import { Worker, Job } from "bullmq";
import getRedis from "../redis";
import { DeckEnrichmentJobData, getCardEnrichmentQueue } from "../queues";
import connectDB from "@/lib/db/mongodb";
import Card from "@/lib/db/models/Card";
import Deck from "@/lib/db/models/Deck";
import DeckCard from "@/lib/db/models/DeckCard";
import Dictionary from "@/lib/db/models/Dictionary";
import {
	generateSharedAudio,
	generateSharedImage,
	checkSharedMediaExists,
} from "@/lib/enrichment/shared-media";
import { interpretChinese } from "@/lib/enrichment/openai-interpret";
import {
	convertPinyinToneNumbersToMarks,
	hasToneMarks,
} from "@/lib/utils/pinyin";
import { getPreferredEntry } from "@/lib/enrichment/multi-pronunciation-handler";
import { analyzeCharacterComplexity } from "@/lib/enrichment/character-complexity-analyzer";
import { analyzeCharacterWithAI } from "@/lib/ai/ai-provider";
import { registerWorker } from "../worker-monitor";
import {
	BATCH_CONFIG,
	PARALLEL_CONFIG,
	WORKER_CONCURRENCY,
	JOB_CONFIG,
	getWorkerConcurrency,
} from "../config";

// Rate limiter class for API calls
class RateLimiter {
	private tokens: number;
	private maxTokens: number;
	private refillRate: number;
	private lastRefill: number;

	constructor(tokensPerSecond: number) {
		this.maxTokens = tokensPerSecond * 2; // Allow burst of 2x the rate
		this.tokens = this.maxTokens;
		this.refillRate = tokensPerSecond;
		this.lastRefill = Date.now();
	}

	async acquire(count: number = 1): Promise<void> {
		// Refill tokens based on elapsed time
		const now = Date.now();
		const elapsed = (now - this.lastRefill) / 1000;
		this.tokens = Math.min(
			this.maxTokens,
			this.tokens + elapsed * this.refillRate
		);
		this.lastRefill = now;

		// Wait if not enough tokens
		while (this.tokens < count) {
			const waitTime = ((count - this.tokens) / this.refillRate) * 1000;
			await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100)));
			
			// Refill again after waiting
			const now = Date.now();
			const elapsed = (now - this.lastRefill) / 1000;
			this.tokens = Math.min(
				this.maxTokens,
				this.tokens + elapsed * this.refillRate
			);
			this.lastRefill = now;
		}

		this.tokens -= count;
	}
}

// Create rate limiters for different services
const openAIRateLimiter = new RateLimiter(2); // 2 calls per second
const falRateLimiter = new RateLimiter(1); // 1 call per second
const azureTTSRateLimiter = new RateLimiter(5); // 5 calls per second

// Cache for dictionary lookups to reduce database queries
const dictionaryCache = new Map<string, any[]>();

export const deckEnrichmentR2Worker = new Worker<DeckEnrichmentJobData>(
	"deck-enrichment",
	async (job: Job<DeckEnrichmentJobData>) => {
		const { deckId, deckName, sessionId, force = false } = job.data;

		// Check if this is a single card enrichment job
		const isSingleCard = job.name === "enrich-single-card";
		const singleCardId = (job.data as any).cardId;
		const singleCardHanzi = (job.data as any).hanzi;

		console.log(
			`\n🚀 Starting ${isSingleCard ? 'single card' : 'deck'} enrichment (OPTIMIZED) for "${deckName}" (${deckId})`
		);
		console.log(`   Force mode: ${force}`);
		console.log(`   Session: ${sessionId}`);
		console.log(`   Batch size: ${BATCH_CONFIG.DECK_ENRICHMENT_BATCH_SIZE}`);
		console.log(`   Parallel enrichment: ${PARALLEL_CONFIG.DECK_ENRICHMENT_PARALLEL}`);

		try {
			await connectDB();

			let cards;

			if (isSingleCard) {
				// Single card enrichment
				const card = await Card.findById(singleCardId);
				if (!card) {
					throw new Error(`Card not found: ${singleCardId}`);
				}
				cards = [card];
				console.log(`   Found single card: ${card.hanzi}`);
			} else {
				// Full deck enrichment - fetch all cards
				console.log("📋 Fetching cards from deck...");
				const deckCards = await DeckCard.find({ deckId }).populate("cardId");
				cards = deckCards.map((dc) => dc.cardId).filter((card) => card);
				console.log(`   Found ${cards.length} total cards`);

				// Filter cards that need enrichment
				if (!force) {
					const beforeFilter = cards.length;
					cards = cards.filter(
						(card) =>
							!card.cached ||
							card.imageSource === "placeholder" ||
							!card.imageUrl ||
							!card.audioUrl ||
							// Check if URLs are R2 URLs
							(card.imageUrl &&
								!card.imageUrl.includes(process.env.R2_PUBLIC_URL)) ||
							(card.audioUrl &&
								!card.audioUrl.includes(process.env.R2_PUBLIC_URL)),
					);
					console.log(
						`   Filtered to ${cards.length} cards needing enrichment (${beforeFilter - cards.length} already enriched)`,
					);
				}
			}

			const totalCards = cards.length;
			let processedCards = 0;
			let failedCards = 0;

			if (totalCards === 0) {
				console.log("✅ No cards need enrichment");

				// Update deck to ready status
				await Deck.findByIdAndUpdate(deckId, {
					status: "ready",
					enrichmentProgress: {
						totalCards: 0,
						processedCards: 0,
						currentOperation: "All cards already enriched",
					},
				});

				return { success: true, totalCards: 0, processedCards: 0 };
			}

			// Update deck status
			await Deck.findByIdAndUpdate(deckId, {
				status: "enriching",
				enrichmentProgress: {
					totalCards,
					processedCards,
					currentOperation: "Starting optimized enrichment...",
				},
			});

			// Pre-fetch all dictionary entries in batches for better performance
			console.log("📚 Pre-fetching dictionary entries...");
			const uniqueHanzi = [...new Set(cards.map(c => c.hanzi))];
			
			for (let i = 0; i < uniqueHanzi.length; i += BATCH_CONFIG.DICTIONARY_BATCH_SIZE) {
				const batch = uniqueHanzi.slice(i, i + BATCH_CONFIG.DICTIONARY_BATCH_SIZE);
				const dictEntries = await Dictionary.find({
					traditional: { $in: batch }
				});
				
				// Group by hanzi and cache
				for (const entry of dictEntries) {
					if (!dictionaryCache.has(entry.traditional)) {
						dictionaryCache.set(entry.traditional, []);
					}
					dictionaryCache.get(entry.traditional)!.push(entry);
				}
			}
			console.log(`   Cached dictionary entries for ${dictionaryCache.size} characters`);

			// Process cards in batches
			const totalBatches = Math.ceil(cards.length / BATCH_CONFIG.DECK_ENRICHMENT_BATCH_SIZE);

			for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
				const start = batchIndex * BATCH_CONFIG.DECK_ENRICHMENT_BATCH_SIZE;
				const end = Math.min(start + BATCH_CONFIG.DECK_ENRICHMENT_BATCH_SIZE, cards.length);
				const batch = cards.slice(start, end);

				console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} cards)`);

				// Update deck status for batch
				await Deck.findByIdAndUpdate(deckId, {
					enrichmentProgress: {
						totalCards,
						processedCards,
						currentOperation: `Processing batch ${batchIndex + 1}/${totalBatches}`,
					},
				});

				// Process cards within batch in parallel (with concurrency limit)
				const batchResults = await processCardsInParallel(
					batch,
					async (card) => {
						try {
							await enrichSingleCard(
								card,
								force,
								deckId,
								totalCards,
								processedCards
							);
							processedCards++;
							
							// Update progress
							await job.updateProgress(
								Math.round((processedCards / totalCards) * 100)
							);
							
							return { success: true };
						} catch (error) {
							console.error(`   ❌ Error enriching card ${card.hanzi}:`, error);
							failedCards++;
							return { success: false, error };
						}
					},
					PARALLEL_CONFIG.DECK_ENRICHMENT_PARALLEL
				);

				// Save all cards in batch at once (bulk update)
				const successfulCards = batch.filter((_, index) => batchResults[index].success);
				if (successfulCards.length > 0) {
					await Card.bulkSave(successfulCards);
					console.log(`   💾 Batch saved: ${successfulCards.length} cards`);
				}

				// Add delay between batches to prevent overwhelming the system
				if (batchIndex < totalBatches - 1) {
					console.log(`   ⏱️ Waiting ${BATCH_CONFIG.DECK_ENRICHMENT_BATCH_DELAY}ms before next batch...`);
					await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.DECK_ENRICHMENT_BATCH_DELAY));
				}
			}

			// Clear dictionary cache to free memory
			dictionaryCache.clear();

			// Update deck to ready status
			console.log(`\n✅ Deck enrichment completed! Processed: ${processedCards}, Failed: ${failedCards}`);
			await Deck.findByIdAndUpdate(deckId, {
				status: "ready",
				enrichmentProgress: {
					totalCards,
					processedCards,
					currentOperation: "Enrichment complete!",
				},
			});

			return {
				success: true,
				totalCards,
				processedCards,
				failedCards,
				message: `Successfully enriched ${processedCards} out of ${totalCards} cards`,
			};
		} catch (error) {
			console.error("❌ Deck enrichment error:", error);

			// Update deck status to error
			await Deck.findByIdAndUpdate(deckId, {
				status: "error",
				enrichmentProgress: {
					currentOperation: "Enrichment failed",
				},
			});

			throw error;
		}
	},
	{
		connection: getRedis(),
		concurrency: getWorkerConcurrency('DECK_ENRICHMENT'),
		lockDuration: JOB_CONFIG.DECK_ENRICHMENT_LOCK,
		lockRenewTime: JOB_CONFIG.LOCK_RENEW_TIME,
	},
);

// Helper function to process cards in parallel with concurrency limit
async function processCardsInParallel<T>(
	items: T[],
	processor: (item: T) => Promise<any>,
	concurrency: number
): Promise<any[]> {
	const results: any[] = new Array(items.length);
	const executing: Set<Promise<void>> = new Set();

	for (let i = 0; i < items.length; i++) {
		const index = i; // Capture index in closure
		const promise = processor(items[index])
			.then(result => {
				results[index] = result;
			})
			.catch(error => {
				// Ensure errors are captured in results
				results[index] = { success: false, error };
			})
			.finally(() => {
				executing.delete(promise);
			});

		executing.add(promise);

		// Wait if we've reached concurrency limit
		if (executing.size >= concurrency) {
			await Promise.race(executing);
		}
	}

	// Wait for remaining promises
	await Promise.all(executing);
	return results;
}

// Enrichment function for a single card
async function enrichSingleCard(
	card: any,
	force: boolean,
	deckId: string,
	totalCards: number,
	processedCards: number
): Promise<void> {
	console.log(`   🔄 Processing card: ${card.hanzi}`);

	// Check if shared media already exists (to skip unnecessary API calls)
	const { audioExists, imageExists } = await checkSharedMediaExists(card.hanzi);

	// Check if card was already disambiguated
	if (card.disambiguated && card.meaning && card.pinyin) {
		console.log(`      ✓ Using pre-selected meaning: ${card.pinyin} - ${card.meaning}`);

		// Convert tone numbers to marks if needed
		if (!hasToneMarks(card.pinyin)) {
			card.pinyin = convertPinyinToneNumbersToMarks(card.pinyin);
		}
	} else {
		// Look up in cached dictionary entries
		const dictEntries = dictionaryCache.get(card.hanzi) || [];

		if (dictEntries.length > 0) {
			console.log(`      ✓ Found in dictionary cache`);

			// Get meaning from dictionary
			if (dictEntries.length > 1) {
				const preferredEntry = getPreferredEntry(card.hanzi, dictEntries);
				card.meaning = preferredEntry.definitions[0] || "No definition";
			} else {
				card.meaning = dictEntries[0].definitions[0] || "No definition";
			}
		}
	}

	// Use AI interpretation if needed (with rate limiting)
	const needsInterpretation =
		!card.disambiguated ||
		!card.pinyin ||
		!card.meaning ||
		card.meaning === "Unknown character";

	if (needsInterpretation) {
		console.log(`      🤖 Using AI interpretation...`);
		
		// Acquire rate limit token before calling OpenAI
		await openAIRateLimiter.acquire();
		
		const interpretation = await interpretChinese(card.hanzi);

		if (interpretation) {
			card.meaning = interpretation.meaning || card.meaning;
			card.pinyin = interpretation.pinyin || card.pinyin;
			
			if (interpretation.interpretationPrompt) {
				card.interpretationPrompt = interpretation.interpretationPrompt;
			}
		} else {
			card.meaning = card.meaning || "Unknown character";
			card.pinyin = card.pinyin || "Unknown";
		}
	}

	// Generate character complexity analysis (lightweight, no API calls)
	if (!card.semanticCategory || force) {
		const complexityAnalysis = await analyzeCharacterComplexity(
			card.hanzi,
			card.pinyin,
			card.meaning
		);

		// Apply analysis results to card
		Object.assign(card, {
			semanticCategory: complexityAnalysis.semanticCategory,
			tonePattern: complexityAnalysis.tonePattern,
			strokeCount: complexityAnalysis.strokeCount,
			componentCount: complexityAnalysis.componentCount,
			visualComplexity: complexityAnalysis.visualComplexity,
			overallDifficulty: complexityAnalysis.overallDifficulty,
			radicals: complexityAnalysis.radicals,
			semanticFields: complexityAnalysis.semanticFields,
			conceptType: complexityAnalysis.conceptType,
			frequency: complexityAnalysis.frequency,
			contextExamples: complexityAnalysis.contextExamples,
			collocations: complexityAnalysis.collocations,
		});
	}

	// Generate image with rate limiting (only if needed)
	if (!imageExists || force) {
		console.log(`      🎨 Generating image...`);
		
		// Acquire rate limit token before calling fal.ai
		await falRateLimiter.acquire();
		
		const image = await generateSharedImage(
			card.hanzi,
			card.meaning,
			card.pinyin,
			force,
			card.imagePath,
		);

		if (image.imageUrl) {
			card.imageUrl = image.imageUrl;
			card.imagePath = image.imagePath;
			card.imageSource = "dalle";
			card.imageSourceId = image.cached ? "cached" : "generated";
			card.imageAttribution = "AI Generated";
			card.imageAttributionUrl = "";
			if (image.prompt) {
				card.imagePrompt = image.prompt;
			}
		}
	} else {
		console.log(`      ⏭️ Skipping image (already exists)`);
	}

	// Generate TTS audio with rate limiting (only if needed)
	if (!audioExists || !card.audioUrl || force) {
		if (!card.pinyin) {
			console.error(`      ✗ Cannot generate audio without pinyin`);
			card.audioUrl = "";
		} else {
			console.log(`      🔊 Generating audio...`);
			
			// Acquire rate limit token before calling Azure TTS
			await azureTTSRateLimiter.acquire();
			
			try {
				const ttsResult = await generateSharedAudio(
					card.hanzi,
					card.pinyin,
					false,
					card.meaning,
					card.audioPath,
				);
				card.audioUrl = ttsResult.audioUrl;
				card.audioPath = ttsResult.audioPath;
			} catch (ttsError) {
				console.error(`      ✗ TTS generation failed:`, ttsError);
				card.audioUrl = "";
			}
		}
	} else {
		console.log(`      ⏭️ Skipping audio (already exists)`);
	}

	// Generate AI insights if needed (with rate limiting)
	const hasValidAIInsights = card.aiInsights && 
		card.aiInsights.etymology?.origin && 
		card.aiInsights.mnemonics?.visual && 
		card.aiInsights.learningTips?.forBeginners?.length > 0;

	if (!hasValidAIInsights || force) {
		console.log(`      🧠 Generating AI insights...`);
		
		// Acquire rate limit token before calling OpenAI
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
			}
		} catch (aiError) {
			console.error(`      ✗ AI insights generation failed:`, aiError);
		}
	} else {
		console.log(`      ⏭️ Skipping AI insights (already exists)`);
	}

	// Mark as cached
	card.cached = true;
	console.log(`      ✅ Card enriched successfully`);
}

// Register worker for monitoring
registerWorker(deckEnrichmentR2Worker, "deck-enrichment");

// Handle graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, closing deck enrichment worker...');
	await deckEnrichmentR2Worker.close();
});

process.on('SIGINT', async () => {
	console.log('SIGINT received, closing deck enrichment worker...');
	await deckEnrichmentR2Worker.close();
});