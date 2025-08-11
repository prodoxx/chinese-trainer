import { Worker, Job } from "bullmq";
import getRedis from "../redis";
import { CardEnrichmentJobData } from "../queues";
import connectDB from "@/lib/db/mongodb";
import Card from "@/lib/db/models/Card";
import Dictionary from "@/lib/db/models/Dictionary";
import {
	generateSharedAudio,
	generateSharedImage,
} from "@/lib/enrichment/shared-media";
import { getPreferredEntry } from "@/lib/enrichment/multi-pronunciation-handler";
import { convertPinyinToneNumbersToMarks } from "@/lib/utils/pinyin";
import { interpretChinese as interpretChineseWithProvider } from "@/lib/ai/ai-provider";
import { analyzeCharacterWithAI } from "@/lib/ai/ai-provider";
import { registerWorker } from "../worker-monitor";
import { analyzeCharacterComplexity } from "@/lib/enrichment/character-complexity-analyzer";

export const cardEnrichmentWorker = new Worker<CardEnrichmentJobData>(
	"card-enrichment",
	async (job: Job<CardEnrichmentJobData>) => {
		const { cardId, userId, deckId, force, disambiguationSelection, aiProvider } = job.data;

		console.log(`\n🔄 Starting single card enrichment for card ${cardId}`);
		console.log(`   Force: ${force}`);
		console.log(`   User: ${userId}`);

		// Update job progress
		await job.updateProgress({
			stage: "initializing",
			message: "Starting enrichment process...",
		});

		try {
			await connectDB();

			// Find the card
			const card = await Card.findById(cardId);

			if (!card) {
				throw new Error("Card not found");
			}

			console.log(`   Character: ${card.hanzi}`);

			// Update progress with character info
			await job.updateProgress({
				stage: "card_loaded",
				message: `Enriching character: ${card.hanzi}`,
				character: card.hanzi,
			});

			// Update meaning/pinyin if disambiguation was provided
			if (disambiguationSelection) {
				console.log(
					`   Using disambiguation selection: ${disambiguationSelection.pinyin} - ${disambiguationSelection.meaning}`,
				);
				card.meaning = disambiguationSelection.meaning;
				card.pinyin = convertPinyinToneNumbersToMarks(
					disambiguationSelection.pinyin,
				);
				card.disambiguated = true;
			}

			// Look up in dictionary for meaning
			let dictEntries: any[] = [];
			if (!card.meaning || card.meaning === "Unknown character" || force) {
				dictEntries = await Dictionary.find({
					traditional: card.hanzi,
				});

				if (dictEntries.length > 0) {
					const selectedEntry = getPreferredEntry(card.hanzi, dictEntries);
					card.meaning = selectedEntry.definitions[0] || "No definition";

					if (dictEntries.length > 1) {
						console.log(
							`   Multiple entries found, selected meaning: ${card.meaning}`,
						);
					}
				}
			}

			// Use AI interpretation to get Taiwan-specific pronunciation and student-friendly meanings
			if (
				!card.pinyin ||
				!card.meaning ||
				card.meaning === "Unknown character" ||
				force
			) {
				console.log(
					`   🤖 Using AI interpretation for Taiwan pronunciation and meaning...`,
				);

				await job.updateProgress({
					stage: "ai_interpretation",
					message: "Getting AI pronunciation and meaning...",
					character: card.hanzi,
				});

				// Use OpenAI for interpretation
				const aiConfig = {
					provider: 'openai' as const,
					enabled: true
				};

				console.log(`   Using OpenAI for interpretation`);

				const interpretation = await interpretChineseWithProvider(card.hanzi, aiConfig);

				if (interpretation) {
					// Always use AI pinyin for Taiwan pronunciation
					card.pinyin = interpretation.pinyin || card.pinyin;

					// Always use AI meaning for clearer, student-friendly explanations
					card.meaning = interpretation.meaning || card.meaning;
					
					// Save the interpretation prompt
					if (interpretation.interpretationPrompt) {
						card.interpretationPrompt = interpretation.interpretationPrompt;
					}
					
					// Save provider information
					card.interpretationProvider = 'OpenAI';
					
					// Save complete interpretation result
					card.interpretationResult = {
						meaning: interpretation.meaning || '',
						pinyin: interpretation.pinyin || '',
						context: interpretation.context || '',
						imagePrompt: interpretation.imagePrompt || '',
						provider: 'OpenAI',
						timestamp: new Date()
					};

					console.log(`   ✓ AI provided (OpenAI): ${card.pinyin} - ${card.meaning}`);
				} else {
					console.log(`   ⚠️ AI interpretation failed`);
					// Fallback to dictionary if available
					if (!card.pinyin && dictEntries.length > 0) {
						const selectedEntry = getPreferredEntry(card.hanzi, dictEntries);
						card.pinyin = convertPinyinToneNumbersToMarks(selectedEntry.pinyin);
						console.log(`   Falling back to dictionary pinyin: ${card.pinyin}`);
					}
				}
			}

			// Generate character complexity analysis
			if (!card.semanticCategory || force) {
				console.log(`   📊 Analyzing character complexity...`);

				await job.updateProgress({
					stage: "analyzing_character",
					message: "Analyzing character structure and complexity...",
					character: card.hanzi,
				});

				const complexityAnalysis = await analyzeCharacterComplexity(
					card.hanzi,
					card.pinyin,
					card.meaning
				);

				// Apply analysis results to card
				if (complexityAnalysis.semanticCategory) card.semanticCategory = complexityAnalysis.semanticCategory;
				if (complexityAnalysis.tonePattern) card.tonePattern = complexityAnalysis.tonePattern;
				if (complexityAnalysis.strokeCount) card.strokeCount = complexityAnalysis.strokeCount;
				if (complexityAnalysis.componentCount) card.componentCount = complexityAnalysis.componentCount;
				if (complexityAnalysis.visualComplexity !== undefined) card.visualComplexity = complexityAnalysis.visualComplexity;
				if (complexityAnalysis.overallDifficulty !== undefined) card.overallDifficulty = complexityAnalysis.overallDifficulty;
				if (complexityAnalysis.radicals) card.radicals = complexityAnalysis.radicals;
				if (complexityAnalysis.semanticFields) card.semanticFields = complexityAnalysis.semanticFields;
				if (complexityAnalysis.conceptType) card.conceptType = complexityAnalysis.conceptType;
				if (complexityAnalysis.frequency) card.frequency = complexityAnalysis.frequency;
				if (complexityAnalysis.contextExamples) card.contextExamples = complexityAnalysis.contextExamples;
				if (complexityAnalysis.collocations) card.collocations = complexityAnalysis.collocations;

				console.log(`   ✓ Character analysis saved: ${card.semanticCategory}, difficulty: ${card.overallDifficulty}`);
			}

			// Re-generate image if force=true or no image exists
			if (force || !card.imageUrl || card.imageUrl === "") {
				console.log(`   Generating new image...`);

				await job.updateProgress({
					stage: "generating_image",
					message: "Creating mnemonic image...",
					character: card.hanzi,
				});

				// Ensure we have valid values before calling generateSharedImage
				const meaning = card.meaning || "";
				const pinyin = card.pinyin || "";

				console.log(`   Calling generateSharedImage with:`);
				console.log(`   - hanzi: ${card.hanzi}`);
				console.log(`   - meaning: ${meaning}`);
				console.log(`   - pinyin: ${pinyin}`);
				console.log(`   - force: ${force}`);

				const imageResult = await generateSharedImage(
					card.hanzi,
					meaning,
					pinyin,
					force,
					card.imagePath, // Pass existing path for deletion if force regenerating
					'openai', // Always use OpenAI for image prompt generation
				);

				if (imageResult.imageUrl) {
					card.imageUrl = imageResult.imageUrl;
					card.imagePath = imageResult.imagePath; // Save the R2 storage path
					card.imageSource = "fal";
					card.imageSourceId = imageResult.cached ? "cached" : "generated";
					card.imageAttribution = "AI Generated";
					card.imageAttributionUrl = "";
					
					// Save the image prompt if available
					if (imageResult.prompt) {
						card.imagePrompt = imageResult.prompt;
					}
					
					// Save query information
					if (imageResult.queryPrompt) {
						card.imageSearchQueryPrompt = imageResult.queryPrompt;
					}
					
					// Save query provider and result
					if (imageResult.queryProvider) {
						card.queryProvider = 'OpenAI';
						
						// Save complete query result
						card.imageSearchQueryResult = {
							query: imageResult.queryResult || '',
							provider: 'OpenAI',
							timestamp: new Date()
						};
					}
					
					console.log(
						`   ✓ Image generated (cached: ${imageResult.cached}, force: ${force})`,
					);
					console.log(`   Image URL saved: ${card.imageUrl}`);
					console.log(`   Image path saved: ${card.imagePath}`);
				}
			}

			// Re-generate audio if missing
			if (!card.audioUrl || force) {
				console.log(`   Generating audio...`);

				// Ensure we have pinyin before generating audio
				if (!card.pinyin) {
					console.error(
						`   ✗ Cannot generate audio without pinyin for ${card.hanzi}`,
					);
				} else {
					await job.updateProgress({
						stage: "generating_audio",
						message: "Creating pronunciation audio...",
						character: card.hanzi,
					});

					try {
						const audioResult = await generateSharedAudio(
							card.hanzi,
							card.pinyin,
							force,
							card.meaning,
							card.audioPath, // Pass existing path for deletion if force regenerating
						);
						card.audioUrl = audioResult.audioUrl;
						card.audioPath = audioResult.audioPath; // Save the R2 storage path
						console.log(`   ✓ Audio generated (cached: ${audioResult.cached})`);
						console.log(`   Audio path saved: ${card.audioPath}`);
					} catch (audioError) {
						console.error(`   ✗ Audio generation failed:`, audioError);
					}
				}
			}

			// Generate AI insights if they don't exist, are empty, or if forced
			console.log(`   🧠 Checking AI insights for ${card.hanzi}...`);
			
			// Check if AI insights have actual content (not just empty structure)
			const hasValidAIInsights = card.aiInsights && 
				card.aiInsights.etymology?.origin && 
				card.aiInsights.mnemonics?.visual && 
				card.aiInsights.learningTips?.forBeginners?.length > 0;
			
			console.log(`   Current AI insights: ${hasValidAIInsights ? 'VALID' : 'EMPTY/MISSING'}`);
			console.log(`   Force regeneration: ${force}`);
			
			if (!hasValidAIInsights || force) {
				console.log(`   🚀 Starting AI insights generation for ${card.hanzi}...`);

				await job.updateProgress({
					stage: "generating_insights",
					message: "Creating AI-powered learning insights...",
					character: card.hanzi,
				});

				try {
					// Configure AI provider for insights (reuse from above)
					const aiConfig = {
						provider: 'openai' as const,
						enabled: true
					};

					console.log(`   📋 AI Config: provider=${aiConfig.provider}, enabled=${aiConfig.enabled}`);

					const aiInsights = await analyzeCharacterWithAI(card.hanzi, aiConfig);
					
					console.log(`   ✨ AI insights received:`, {
						hasEtymology: !!aiInsights?.etymology,
						hasMnemonics: !!aiInsights?.mnemonics,
						hasLearningTips: !!aiInsights?.learningTips,
						hasCommonErrors: !!aiInsights?.commonErrors,
						hasUsage: !!aiInsights?.usage
					});
					
					// Validate that AI insights have actual content
					const isValidInsights = aiInsights && 
						aiInsights.etymology?.origin && 
						aiInsights.mnemonics?.visual && 
						aiInsights.learningTips?.forBeginners?.length > 0;
					
					if (isValidInsights) {
						card.aiInsights = aiInsights;
						card.aiInsightsGeneratedAt = new Date();
						console.log(`   ✅ Valid AI insights saved to card`);
						console.log(`   📅 Setting aiInsightsGeneratedAt to: ${card.aiInsightsGeneratedAt}`);
					} else {
						console.warn(`   ⚠️ AI insights returned but were empty or invalid`);
						console.warn(`   Details:`, {
							etymologyOrigin: aiInsights?.etymology?.origin || 'MISSING',
							mnemonicsVisual: aiInsights?.mnemonics?.visual || 'MISSING',
							learningTipsCount: aiInsights?.learningTips?.forBeginners?.length || 0
						});
						// Don't save invalid insights
						card.aiInsights = undefined;
					}
					
					// Save the linguistic analysis prompt
					if (aiInsights.linguisticAnalysisPrompt) {
						card.linguisticAnalysisPrompt = aiInsights.linguisticAnalysisPrompt;
					}
					
					// Save provider information for analysis
					card.analysisProvider = 'OpenAI';
					
					// Save complete linguistic analysis result
					card.linguisticAnalysisResult = {
						etymology: aiInsights.etymology,
						mnemonics: aiInsights.mnemonics,
						commonErrors: aiInsights.commonErrors,
						usage: aiInsights.usage,
						learningTips: aiInsights.learningTips,
						provider: 'OpenAI',
						timestamp: new Date()
					};
					
					console.log(`   ✓ AI insights generated with OpenAI`);
					console.log(`   📝 AI insights will be saved to database`);
				} catch (aiError) {
					console.error(`   ✗ AI insights generation failed:`, aiError);
					console.error(`   Error details:`, {
						message: aiError instanceof Error ? aiError.message : 'Unknown error',
						stack: aiError instanceof Error ? aiError.stack : undefined
					});
					
					// IMPORTANT: Don't save empty AI insights structure
					// If generation failed, either keep existing insights or set to null
					if (!card.aiInsights || !card.aiInsights.etymology?.origin) {
						console.log(`   ⚠️ Preventing save of empty AI insights structure`);
						card.aiInsights = undefined; // Remove empty structure
					}
				}
			} else {
				console.log(`   ⏭️ Skipping AI insights generation (already exists or not forced)`);
			}

			await job.updateProgress({
				stage: "saving",
				message: "Saving enriched data...",
				character: card.hanzi,
			});

			// Mark card as cached since enrichment is complete
			card.cached = true;

			// Debug: Log all fields before save
			console.log(`   📝 Before save - Card fields:`);
			console.log(`      - aiInsights: ${card.aiInsights ? 'YES' : 'NO'}`);
			console.log(`      - aiInsightsGeneratedAt: ${card.aiInsightsGeneratedAt}`);
			console.log(`      - cached: ${card.cached}`);

			// Save the updated card
			await card.save();
			
			// Debug: Check what was actually saved
			const savedCard = await Card.findById(card._id);
			console.log(`   📝 After save - Database check:`);
			console.log(`      - aiInsights: ${savedCard?.aiInsights ? 'YES' : 'NO'}`);
			console.log(`      - aiInsightsGeneratedAt: ${savedCard?.aiInsightsGeneratedAt}`);
			console.log(`      - cached: ${savedCard?.cached}`);

			console.log(`✅ Card enrichment completed for ${card.hanzi}`);
			
			// Verify AI insights were saved
			if (card.aiInsights) {
				console.log(`   📊 AI insights saved: Yes`);
				console.log(`   📅 Generation date saved: ${card.aiInsightsGeneratedAt ? 'Yes' : 'No'}`);
				if (card.aiInsightsGeneratedAt) {
					console.log(`   📅 Date value: ${card.aiInsightsGeneratedAt}`);
				}
			}

			// Return the updated card data
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
		} catch (error: any) {
			console.error("Card enrichment error:", error);

			// Check if this is a non-recoverable error that shouldn't be retried
			const nonRecoverableErrors = [
				"Card not found",
				"No job ID returned from server",
				"Card validation failed",
			];

			// Check if error message contains any non-recoverable error patterns
			const errorMessage = error.message || error.toString();
			const isNonRecoverable = nonRecoverableErrors.some((pattern) =>
				errorMessage.includes(pattern),
			);

			if (isNonRecoverable) {
				// Mark job as failed without retrying by setting attemptsMade to max attempts
				console.error(
					"Non-recoverable error detected, skipping retries:",
					errorMessage,
				);
				job.attemptsMade = 999; // This will prevent retries
			}

			throw error;
		}
	},
	{
		connection: getRedis(),
		concurrency: 2, // Reduce concurrency to prevent lock timeouts
		lockDuration: 300000, // 5 minutes (increased from default 30s)
		lockRenewTime: 60000, // Renew lock every minute
	},
);

// Register worker for monitoring
registerWorker(cardEnrichmentWorker, "card-enrichment");
