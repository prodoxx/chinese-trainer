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
import { interpretChinese } from "@/lib/enrichment/openai-interpret";
import { registerWorker } from "../worker-monitor";
import { analyzeCharacterWithOpenAI } from "@/lib/analytics/openai-linguistic-analysis";
import { getCharacterAnalysisWithCache } from "@/lib/analytics/character-analysis-service";

export const cardEnrichmentWorker = new Worker<CardEnrichmentJobData>(
	"card-enrichment",
	async (job: Job<CardEnrichmentJobData>) => {
		const { cardId, userId, deckId, force, disambiguationSelection } = job.data;

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

				const interpretation = await interpretChinese(card.hanzi);

				if (interpretation) {
					// Always use AI pinyin for Taiwan pronunciation
					card.pinyin = interpretation.pinyin || card.pinyin;

					// Always use AI meaning for clearer, student-friendly explanations
					card.meaning = interpretation.meaning || card.meaning;
					
					// Save the interpretation prompt
					if (interpretation.interpretationPrompt) {
						card.interpretationPrompt = interpretation.interpretationPrompt;
					}

					console.log(`   ✓ AI provided: ${card.pinyin} - ${card.meaning}`);
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

			// Generate character analysis
			if (!card.semanticCategory || force) {
				console.log(`   📊 Analyzing character complexity...`);

				await job.updateProgress({
					stage: "analyzing_character",
					message: "Analyzing character structure and complexity...",
					character: card.hanzi,
				});

				const analysis = await getCharacterAnalysisWithCache(card.hanzi);
				if (analysis) {
					// Map analysis fields to card fields
					card.semanticCategory = analysis.semanticCategory;
					card.tonePattern = analysis.tonePattern;
					card.strokeCount = analysis.strokeCount;
					card.componentCount = analysis.componentCount;
					card.visualComplexity = analysis.visualComplexity;
					card.overallDifficulty = analysis.overallDifficulty;
					card.mnemonics = analysis.mnemonics;
					card.etymology = analysis.etymology;
					console.log(
						`   ✓ Character analysis saved: ${analysis.semanticCategory}, difficulty: ${analysis.overallDifficulty}`,
					);
				}
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

			// Generate AI insights if they don't exist or if forced
			if (!card.aiInsights || force) {
				console.log(`   Generating AI insights...`);

				await job.updateProgress({
					stage: "generating_insights",
					message: "Creating AI-powered learning insights...",
					character: card.hanzi,
				});

				try {
					const aiInsights = await analyzeCharacterWithOpenAI(card.hanzi);
					card.aiInsights = aiInsights;
					card.aiInsightsGeneratedAt = new Date();
					
					// Save the linguistic analysis prompt
					if (aiInsights.linguisticAnalysisPrompt) {
						card.linguisticAnalysisPrompt = aiInsights.linguisticAnalysisPrompt;
					}
					
					console.log(`   ✓ AI insights generated`);
				} catch (aiError) {
					console.error(`   ✗ AI insights generation failed:`, aiError);
					// Continue without AI insights - it's not critical for basic functionality
				}
			}

			await job.updateProgress({
				stage: "saving",
				message: "Saving enriched data...",
				character: card.hanzi,
			});

			// Save the updated card
			await card.save();

			console.log(`✅ Card enrichment completed for ${card.hanzi}`);

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
