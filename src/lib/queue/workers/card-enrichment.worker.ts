import { Worker, Job, Queue } from "bullmq";
import getRedis from "../redis";
import { CardEnrichmentJobData, getCardEnrichmentQueue } from "../queues";
import connectDB from "@/lib/db/mongodb";
import Card from "@/lib/db/models/Card";
import Dictionary from "@/lib/db/models/Dictionary";
import {
	generateSharedAudio,
	generateSharedImage,
	checkSharedMediaExists,
} from "@/lib/enrichment/shared-media";
import { getPreferredEntry } from "@/lib/enrichment/multi-pronunciation-handler";
import { convertPinyinToneNumbersToMarks } from "@/lib/utils/pinyin";
import { interpretChinese as interpretChineseWithProvider } from "@/lib/ai/ai-provider";
import { analyzeCharacterWithAI } from "@/lib/ai/ai-provider";
import { registerWorker } from "../worker-monitor";
import { analyzeCharacterComplexity } from "@/lib/enrichment/character-complexity-analyzer";
import { getCommonlyConfusedCharacters, analyzeCharacterConfusion } from "@/lib/enrichment/confusion-analyzer";
import {
	CACHE_CONFIG,
	WORKER_CONCURRENCY,
	JOB_CONFIG,
	RATE_LIMITS,
	getWorkerConcurrency,
	getRateLimit,
} from "../config";

// Rate limiter with token bucket algorithm
class TokenBucketRateLimiter {
	private tokens: number;
	private maxTokens: number;
	private refillRate: number;
	private lastRefill: number;
	private queue: Array<() => void> = [];

	constructor(tokensPerSecond: number, burstSize?: number) {
		this.refillRate = tokensPerSecond;
		this.maxTokens = burstSize || tokensPerSecond * 2;
		this.tokens = this.maxTokens;
		this.lastRefill = Date.now();
		
		// Start refill timer
		setInterval(() => this.refill(), 100);
	}

	private refill(): void {
		const now = Date.now();
		const elapsed = (now - this.lastRefill) / 1000;
		const tokensToAdd = elapsed * this.refillRate;
		
		this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
		this.lastRefill = now;
		
		// Process queued requests
		while (this.queue.length > 0 && this.tokens >= 1) {
			const resolve = this.queue.shift();
			if (resolve) {
				this.tokens--;
				resolve();
			}
		}
	}

	async acquire(count: number = 1): Promise<void> {
		return new Promise<void>((resolve) => {
			this.refill(); // Ensure tokens are up to date
			
			if (this.tokens >= count) {
				this.tokens -= count;
				resolve();
			} else {
				// Queue the request
				this.queue.push(resolve);
			}
		});
	}
}

// Create rate limiters for different services
const openAIConfig = getRateLimit('OPENAI_GPT4');
const falConfig = getRateLimit('FAL_FLUX');
const azureConfig = getRateLimit('AZURE_TTS');

const openAIRateLimiter = new TokenBucketRateLimiter(openAIConfig.rate, openAIConfig.burst);
const falRateLimiter = new TokenBucketRateLimiter(falConfig.rate, falConfig.burst);
const azureTTSRateLimiter = new TokenBucketRateLimiter(azureConfig.rate, azureConfig.burst);

// Cache for dictionary and media checks
const cache = new Map<string, { data: any; timestamp: number }>();

function getCached<T>(key: string): T | null {
	const cached = cache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.DICTIONARY_CACHE_TTL) {
		return cached.data as T;
	}
	cache.delete(key);
	return null;
}

function setCache(key: string, data: any): void {
	cache.set(key, { data, timestamp: Date.now() });
}

// Batch processor for multiple card enrichment jobs
class BatchProcessor {
	private queue: Queue;
	private activeJobs: Map<string, Job> = new Map();

	constructor(queue: Queue) {
		this.queue = queue;
	}

	async processBatch(jobs: Job<CardEnrichmentJobData>[]): Promise<void> {
		console.log(`\n📦 Processing batch of ${jobs.length} card enrichment jobs`);

		// Pre-fetch shared data for all cards in batch
		const cardIds = jobs.map(j => j.data.cardId);
		const cards = await Card.find({ _id: { $in: cardIds } });
		const cardMap = new Map(cards.map(c => [c._id.toString(), c]));

		// Pre-fetch dictionary entries for all cards
		const uniqueHanzi = [...new Set(cards.map(c => c.hanzi))];
		const dictEntries = await Dictionary.find({
			traditional: { $in: uniqueHanzi }
		});
		
		// Group dictionary entries by hanzi
		const dictMap = new Map<string, any[]>();
		for (const entry of dictEntries) {
			if (!dictMap.has(entry.traditional)) {
				dictMap.set(entry.traditional, []);
			}
			dictMap.get(entry.traditional)!.push(entry);
		}

		// Check shared media existence for all cards at once
		const mediaChecks = await Promise.all(
			uniqueHanzi.map(async hanzi => ({
				hanzi,
				...(await checkSharedMediaExists(hanzi))
			}))
		);
		const mediaMap = new Map(mediaChecks.map(m => [m.hanzi, m]));

		// Process each job with optimized data access
		const results = await Promise.allSettled(
			jobs.map(job => this.processJob(job, cardMap, dictMap, mediaMap))
		);

		// Handle results
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			const job = jobs[i];
			
			if (result.status === 'fulfilled') {
				console.log(`   ✅ Job ${job.id} completed successfully`);
			} else {
				console.error(`   ❌ Job ${job.id} failed:`, result.reason);
			}
		}
	}

	private async processJob(
		job: Job<CardEnrichmentJobData>,
		cardMap: Map<string, any>,
		dictMap: Map<string, any[]>,
		mediaMap: Map<string, any>
	): Promise<any> {
		const { cardId, userId, force, disambiguationSelection } = job.data;

		try {
			const card = cardMap.get(cardId);
			if (!card) {
				throw new Error(`Card not found: ${cardId}`);
			}

			console.log(`   🔄 Processing card: ${card.hanzi}`);

			// Update job progress
			await job.updateProgress({
				stage: "processing",
				message: `Enriching character: ${card.hanzi}`,
				character: card.hanzi,
			});

			// Get cached media check
			const mediaCheck = mediaMap.get(card.hanzi) || { audioExists: false, imageExists: false };

			// Update meaning/pinyin if disambiguation was provided
			if (disambiguationSelection) {
				card.meaning = disambiguationSelection.meaning;
				card.pinyin = convertPinyinToneNumbersToMarks(
					disambiguationSelection.pinyin,
				);
				card.disambiguated = true;
			}

			// Use cached dictionary entries
			if (!card.meaning || card.meaning === "Unknown character" || force) {
				const dictEntries = dictMap.get(card.hanzi) || [];

				if (dictEntries.length > 0) {
					const selectedEntry = getPreferredEntry(card.hanzi, dictEntries);
					card.meaning = selectedEntry.definitions[0] || "No definition";
				}
			}

			// Use AI interpretation if needed (with rate limiting)
			if (
				!card.pinyin ||
				!card.meaning ||
				card.meaning === "Unknown character" ||
				force
			) {
				await openAIRateLimiter.acquire();
				
				const aiConfig = {
					provider: 'openai' as const,
					enabled: true
				};

				const interpretation = await interpretChineseWithProvider(card.hanzi, aiConfig);

				if (interpretation) {
					card.pinyin = interpretation.pinyin || card.pinyin;
					card.meaning = interpretation.meaning || card.meaning;
					
					if (interpretation.interpretationPrompt) {
						card.interpretationPrompt = interpretation.interpretationPrompt;
					}
					
					card.interpretationProvider = 'OpenAI';
					card.interpretationResult = {
						meaning: interpretation.meaning || '',
						pinyin: interpretation.pinyin || '',
						context: interpretation.context || '',
						imagePrompt: interpretation.imagePrompt || '',
						provider: 'OpenAI',
						timestamp: new Date()
					};
				}
			}

			// Generate character complexity analysis (no API calls)
			if (!card.semanticCategory || force) {
				const complexityAnalysis = await analyzeCharacterComplexity(
					card.hanzi,
					card.pinyin,
					card.meaning
				);

				Object.assign(card, complexityAnalysis);
			}

			// Generate confusion analysis with AI-powered reasons
			if (!card.commonConfusions || card.commonConfusions.length === 0 || force) {
				await openAIRateLimiter.acquire();
				
				try {
					// Get commonly confused characters
					const confusedChars = await getCommonlyConfusedCharacters(card.hanzi, 3);
					
					if (confusedChars.length > 0) {
						// Analyze confusion for each character
						const confusionAnalyses = await Promise.all(
							confusedChars.map(async (confusedChar) => {
								// Look up the confused character's details
								const confusedCard = await Card.findOne({ hanzi: confusedChar });
								const confusedDictEntry = !confusedCard ? 
									dictMap.get(confusedChar)?.[0] : null;
								
								const confusedData = {
									hanzi: confusedChar,
									pinyin: confusedCard?.pinyin || confusedDictEntry?.pinyin || '',
									meaning: confusedCard?.meaning || confusedDictEntry?.definitions?.[0] || ''
								};
								
								// Analyze confusion with AI
								const analysis = await analyzeCharacterConfusion(
									{ hanzi: card.hanzi, pinyin: card.pinyin, meaning: card.meaning },
									confusedData,
									'openai'
								);
								
								return {
									character: analysis.character,
									similarity: analysis.confusionScore,
									reasons: analysis.reasons,
									confusionTypes: analysis.confusionTypes
								};
							})
						);
						
						// Store confusion analysis
						card.commonConfusions = confusionAnalyses;
					}
				} catch (confusionError) {
					console.error(`      ✗ Confusion analysis failed:`, confusionError);
					// Use basic confusion analysis as fallback
					const confusedChars = await getCommonlyConfusedCharacters(card.hanzi, 3);
					card.commonConfusions = confusedChars.map(char => ({
						character: char,
						similarity: 0.5,
						reasons: ['May be confused in learning context'],
						confusionTypes: {
							visual: 0.5,
							phonetic: 0,
							semantic: 0,
							tonal: 0
						}
					}));
				}
			}

			// Generate image if needed (with rate limiting)
			if (!mediaCheck.imageExists || force || !card.imageUrl) {
				await falRateLimiter.acquire();

				const imageResult = await generateSharedImage(
					card.hanzi,
					card.meaning || "",
					card.pinyin || "",
					force,
					card.imagePath,
					'openai',
				);

				if (imageResult.imageUrl) {
					card.imageUrl = imageResult.imageUrl;
					card.imagePath = imageResult.imagePath;
					card.imageSource = "fal";
					card.imageSourceId = imageResult.cached ? "cached" : "generated";
					card.imageAttribution = "AI Generated";
					card.imageAttributionUrl = "";
					
					if (imageResult.prompt) {
						card.imagePrompt = imageResult.prompt;
					}
					
					if (imageResult.queryPrompt) {
						card.imageSearchQueryPrompt = imageResult.queryPrompt;
					}
					
					if (imageResult.queryProvider) {
						card.queryProvider = 'OpenAI';
						card.imageSearchQueryResult = {
							query: imageResult.queryResult || '',
							provider: 'OpenAI',
							timestamp: new Date()
						};
					}
				}
			}

			// Generate audio if needed (with rate limiting)
			if (!mediaCheck.audioExists || !card.audioUrl || force) {
				if (card.pinyin) {
					await azureTTSRateLimiter.acquire();

					try {
						const audioResult = await generateSharedAudio(
							card.hanzi,
							card.pinyin,
							force,
							card.meaning,
							card.audioPath,
						);
						card.audioUrl = audioResult.audioUrl;
						card.audioPath = audioResult.audioPath;
					} catch (audioError) {
						console.error(`      ✗ Audio generation failed:`, audioError);
					}
				}
			}

			// Generate AI insights if needed (with rate limiting)
			const hasValidAIInsights = card.aiInsights && 
				card.aiInsights.etymology?.origin && 
				card.aiInsights.mnemonics?.visual && 
				card.aiInsights.learningTips?.forBeginners?.length > 0;

			if (!hasValidAIInsights || force) {
				await openAIRateLimiter.acquire();

				try {
					const aiConfig = {
						provider: 'openai' as const,
						enabled: true
					};

					const aiInsights = await analyzeCharacterWithAI(card.hanzi, aiConfig);
					
					const isValidInsights = aiInsights && 
						aiInsights.etymology?.origin && 
						aiInsights.mnemonics?.visual && 
						aiInsights.learningTips?.forBeginners?.length > 0;
					
					if (isValidInsights) {
						card.aiInsights = aiInsights;
						card.aiInsightsGeneratedAt = new Date();
						
						if (aiInsights.linguisticAnalysisPrompt) {
							card.linguisticAnalysisPrompt = aiInsights.linguisticAnalysisPrompt;
						}
						
						card.analysisProvider = 'OpenAI';
						card.linguisticAnalysisResult = {
							etymology: aiInsights.etymology,
							mnemonics: aiInsights.mnemonics,
							commonErrors: aiInsights.commonErrors,
							usage: aiInsights.usage,
							learningTips: aiInsights.learningTips,
							provider: 'OpenAI',
							timestamp: new Date()
						};
					}
				} catch (aiError) {
					console.error(`      ✗ AI insights generation failed:`, aiError);
				}
			}

			// Mark card as cached
			card.cached = true;

			// Save the card
			await card.save();

			// Update job progress
			await job.updateProgress({
				stage: "completed",
				message: "Enrichment completed",
				character: card.hanzi,
			});

			console.log(`      ✅ Card ${card.hanzi} enriched successfully`);

			return {
				success: true,
				card: {
					_id: card._id,
					hanzi: card.hanzi,
					meaning: card.meaning,
					english: card.meaning ? [card.meaning] : [],
					pinyin: card.pinyin,
					imageUrl: card.imageUrl,
					audioUrl: card.audioUrl,
					imageAttribution: card.imageAttribution,
					imageAttributionUrl: card.imageAttributionUrl,
				},
			};
		} catch (error) {
			console.error(`Error processing job ${job.id}:`, error);
			throw error;
		}
	}
}

// Main worker with batch processing
export const cardEnrichmentWorker = new Worker<CardEnrichmentJobData>(
	"card-enrichment",
	async (job: Job<CardEnrichmentJobData>) => {
		// For now, process jobs individually but with optimizations
		// In production, you could batch multiple jobs together
		console.log(`\n🔄 Starting optimized card enrichment for job ${job.id}`);
		
		await connectDB();
		
		const queue = getCardEnrichmentQueue();
		const processor = new BatchProcessor(queue);
		
		// Process this job (could be extended to batch multiple jobs)
		await processor.processBatch([job]);
		
		// Get the result from the job
		const card = await Card.findById(job.data.cardId);
		if (!card) {
			throw new Error("Card not found after enrichment");
		}
		
		return {
			success: true,
			card: {
				_id: card._id,
				hanzi: card.hanzi,
				meaning: card.meaning,
				english: card.meaning ? [card.meaning] : [],
				pinyin: card.pinyin,
				imageUrl: card.imageUrl,
				audioUrl: card.audioUrl,
				imageAttribution: card.imageAttribution,
				imageAttributionUrl: card.imageAttributionUrl,
			},
		};
	},
	{
		connection: getRedis(),
		concurrency: getWorkerConcurrency('CARD_ENRICHMENT'),
		lockDuration: JOB_CONFIG.CARD_ENRICHMENT_LOCK,
		lockRenewTime: JOB_CONFIG.LOCK_RENEW_TIME,
	},
);

// Register worker for monitoring
registerWorker(cardEnrichmentWorker, "card-enrichment");

// Clean up cache periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, value] of cache.entries()) {
		if (now - value.timestamp > CACHE_CONFIG.DICTIONARY_CACHE_TTL) {
			cache.delete(key);
		}
	}
}, CACHE_CONFIG.CLEANUP_INTERVAL);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, closing card enrichment worker...');
	await cardEnrichmentWorker.close();
});

process.on('SIGINT', async () => {
	console.log('SIGINT received, closing card enrichment worker...');
	await cardEnrichmentWorker.close();
});