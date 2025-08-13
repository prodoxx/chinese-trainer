import { Worker, Job } from "bullmq";
import getRedis from "../redis";
import { DeckEnrichmentJobData } from "../queues";
import connectDB from "@/lib/db/mongodb";
import Card from "@/lib/db/models/Card";
import Deck from "@/lib/db/models/Deck";
import DeckCard from "@/lib/db/models/DeckCard";
import Dictionary from "@/lib/db/models/Dictionary";
// Removed unused imports:
// import { generateTTSAudioR2 } from "@/lib/enrichment/azure-tts-r2";
// import { generateDALLEImageR2 } from "@/lib/enrichment/openai-dalle-r2";
import {
	generateSharedAudio,
	generateSharedImage,
} from "@/lib/enrichment/shared-media";
import { interpretChinese } from "@/lib/enrichment/openai-interpret";
import {
	convertPinyinToneNumbersToMarks,
	hasToneMarks,
} from "@/lib/utils/pinyin";
import { getPreferredEntry } from "@/lib/enrichment/multi-pronunciation-handler";
import { analyzeCharacterComplexity } from "@/lib/enrichment/character-complexity-analyzer";
// Removed unused import:
// import { EnhancedCharacterComplexity } from "@/lib/analytics/enhanced-linguistic-complexity";
import { analyzeCharacterWithAI } from "@/lib/ai/ai-provider";
import { registerWorker } from "../worker-monitor";

export const deckEnrichmentR2Worker = new Worker<DeckEnrichmentJobData>(
	"deck-enrichment",
	async (job: Job<DeckEnrichmentJobData>) => {
		const { deckId, deckName, sessionId, force = false } = job.data;

		// Check if this is a single card enrichment job
		const isSingleCard = job.name === "enrich-single-card";
		const singleCardId = (job.data as any).cardId;
		const singleCardHanzi = (job.data as any).hanzi;

		if (isSingleCard) {
			console.log(
				`\n🚀 Starting single card enrichment for "${singleCardHanzi}" in deck "${deckName}"`,
			);
		} else {
			console.log(
				`\n🚀 Starting deck enrichment (R2) for "${deckName}" (${deckId})`,
			);
			console.log(`   Force mode: ${force}`);
			console.log(`   Session: ${sessionId}`);
		}

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
				// Full deck enrichment
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
					currentOperation: "Starting enrichment...",
				},
			});

			for (const card of cards) {
				try {
					console.log(
						`\n🔄 Processing card ${processedCards + 1}/${totalCards}: ${card.hanzi}`,
					);
					// cardId variable removed as it was unused
				// const cardId = card._id.toString();

					// Update deck status - dictionary lookup
					await Deck.findByIdAndUpdate(deckId, {
						enrichmentProgress: {
							totalCards,
							processedCards,
							currentCard: card.hanzi,
							currentOperation: "Looking up dictionary...",
						},
					});

					// Check if card was already disambiguated
					if (card.disambiguated && card.meaning && card.pinyin) {
						console.log(
							`   ✓ Using pre-selected meaning: ${card.pinyin} - ${card.meaning}`,
						);

						// Convert tone numbers to marks if needed
						if (!hasToneMarks(card.pinyin)) {
							card.pinyin = convertPinyinToneNumbersToMarks(card.pinyin);
						}
					} else {
						// Look up in CEDICT for meaning only
						const dictEntries = await Dictionary.find({
							traditional: card.hanzi,
						});

						if (dictEntries.length > 0) {
							console.log(`   ✓ Found in dictionary`);

							// Get meaning from dictionary
							if (dictEntries.length > 1) {
								const preferredEntry = getPreferredEntry(
									card.hanzi,
									dictEntries,
								);
								card.meaning = preferredEntry.definitions[0] || "No definition";
								console.log(
									`   Multiple entries found, selected meaning: ${card.meaning}`,
								);
							} else {
								// Single entry
								card.meaning = dictEntries[0].definitions[0] || "No definition";
							}

							// Don't use dictionary pinyin - we'll get Taiwan pronunciation from AI
							console.log(`   Will use AI for Taiwan-specific pronunciation`);
						} else {
							console.log(`   ✗ Not in dictionary, will use AI interpretation`);
						}
					}

					// Always use AI interpretation for student-friendly meanings and Taiwan pronunciation unless already disambiguated
					const needsInterpretation =
						!card.disambiguated ||
						!card.pinyin ||
						!card.meaning ||
						card.meaning === "Unknown character";

					if (needsInterpretation) {
						console.log(
							`   🤖 Using AI interpretation for student-friendly meaning...`,
						);

						await Deck.findByIdAndUpdate(deckId, {
							enrichmentProgress: {
								totalCards,
								processedCards,
								currentCard: card.hanzi,
								currentOperation: "AI interpretation...",
							},
						});

						const interpretation = await interpretChinese(card.hanzi);

						if (interpretation) {
							// Always use AI meaning for clearer, student-friendly explanations
							card.meaning = interpretation.meaning || card.meaning;
							card.pinyin = interpretation.pinyin || card.pinyin;
							
							// Save the interpretation prompt
							if (interpretation.interpretationPrompt) {
								card.interpretationPrompt = interpretation.interpretationPrompt;
							}
							
							console.log(`   ✓ AI provided: ${card.pinyin} - ${card.meaning}`);
						} else {
							// Final fallback
							card.meaning = card.meaning || "Unknown character";
							card.pinyin = card.pinyin || "Unknown";
							console.log(`   ⚠️ AI interpretation failed, using fallback`);
						}
					}

					// Generate character complexity analysis
					console.log(`   📊 Analyzing character complexity...`);
					await Deck.findByIdAndUpdate(deckId, {
						enrichmentProgress: {
							totalCards,
							processedCards,
							currentCard: card.hanzi,
							currentOperation: "Analyzing character...",
						},
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

					// Generate image with R2
					console.log(`   🎨 Generating image...`);
					await Deck.findByIdAndUpdate(deckId, {
						enrichmentProgress: {
							totalCards,
							processedCards,
							currentCard: card.hanzi,
							currentOperation: "Generating image...",
						},
					});

					const image = await generateSharedImage(
						card.hanzi,
						card.meaning,
						card.pinyin,
						force,
						card.imagePath, // Pass existing path for deletion if force regenerating
					);

					if (image.imageUrl) {
						card.imageUrl = image.imageUrl;
						card.imagePath = image.imagePath; // Save the R2 storage path
						card.imageSource = "dalle";
						card.imageSourceId = image.cached ? "cached" : "generated";
						card.imageAttribution = "AI Generated";
						card.imageAttributionUrl = "";
						// Save the image prompt if available
						if (image.prompt) {
							card.imagePrompt = image.prompt;
						}
						console.log(
							`   ✓ Image ${image.cached ? "retrieved from cache" : "generated"}`,
						);
					} else {
						// Clear image fields if generation failed
						card.imageUrl = "";
						card.imageSource = undefined;
						card.imageSourceId = undefined;
						card.imageAttribution = undefined;
						card.imageAttributionUrl = undefined;
						card.imagePrompt = undefined;
						console.log(`   ⚠️ Image generation skipped or failed`);
					}

					// Generate TTS audio with R2
					console.log(`   🔊 Generating audio...`);
					await Deck.findByIdAndUpdate(deckId, {
						enrichmentProgress: {
							totalCards,
							processedCards,
							currentCard: card.hanzi,
							currentOperation: "Generating audio...",
						},
					});

					// Ensure we have pinyin before generating audio
					if (!card.pinyin) {
						console.error(
							`   ✗ Cannot generate audio without pinyin for ${card.hanzi}`,
						);
						card.audioUrl = "";
					} else {
						try {
							const ttsResult = await generateSharedAudio(
								card.hanzi,
								card.pinyin,
								false,
								card.meaning,
								card.audioPath, // Pass existing path (though not forcing regeneration)
							); // Never force regenerate audio
							card.audioUrl = ttsResult.audioUrl;
							card.audioPath = ttsResult.audioPath; // Save the R2 storage path
							console.log(
								`   ✓ Audio ${ttsResult.cached ? "retrieved from cache" : "generated"}`,
							);
						} catch (ttsError) {
							console.error(`   ✗ TTS generation failed:`, ttsError);
							card.audioUrl = "";
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
						await Deck.findByIdAndUpdate(deckId, {
							enrichmentProgress: {
								totalCards,
								processedCards,
								currentCard: card.hanzi,
								currentOperation: "Creating AI insights...",
							},
						});

						try {
							// Use OpenAI for AI insights
							const aiConfig = {
								provider: 'openai' as const,
								enabled: true
							};
							
							console.log(`   📋 Using OpenAI for AI insights generation`);
							
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

					// Mark as cached and save
					card.cached = true;
					await card.save();

					processedCards++;
					console.log(
						`   ✅ Card enriched successfully (${processedCards}/${totalCards})`,
					);

					// Update progress
					await Deck.findByIdAndUpdate(deckId, {
						enrichmentProgress: {
							totalCards,
							processedCards,
							currentCard: card.hanzi,
							currentOperation: `Enriched ${card.hanzi}`,
						},
					});

					// Report progress
					await job.updateProgress(
						Math.round((processedCards / totalCards) * 100),
					);
				} catch (cardError) {
					console.error(`   ❌ Error enriching card ${card.hanzi}:`, cardError);
					// Continue with next card
				}
			}

			// Update deck to ready status
			console.log("\n✅ Deck enrichment completed!");
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
		concurrency: 2, // Process 2 decks at a time
	},
);

// Register worker for monitoring
registerWorker(deckEnrichmentR2Worker, "deck-enrichment");
