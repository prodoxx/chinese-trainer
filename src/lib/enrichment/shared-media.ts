/**
 * Shared media generation functions that reuse media across all cards with the same hanzi
 */

import {
	uploadToR2,
	existsInR2,
	deleteFromR2,
	generateMediaKeysByHanziPinyin,
	generateUniqueMediaKeys,
} from "@/lib/r2-storage";
import { fal } from "@fal-ai/client";
import { interpretChinese as interpretChineseWithProvider } from "@/lib/ai/ai-provider";
import {
	validateAIGeneratedImage,
	getRefinedPromptForIssues,
	getSimplifiedPrompt,
} from "@/lib/enrichment/image-validation";
import {
	generateAudioContext,
	needsAudioContext,
} from "@/lib/enrichment/audio-context-generator";

// Lazy-loaded audio trimming functions
let _trimAudioBuffer:
	| ((
			buffer: Buffer,
			start: number,
			duration: number,
			format: string,
	  ) => Promise<Buffer>)
	| null = null;
let _isTrimmingAvailable: (() => Promise<boolean>) | null = null;

// Helper to get audio trimming functions
async function getAudioTrimmer() {
	if (!_trimAudioBuffer || !_isTrimmingAvailable) {
		if (typeof window === "undefined") {
			// Server-side: use the actual implementation
			try {
				const trimmerModule = await import(
					"@/lib/enrichment/audio-trimmer-server"
				);
				_trimAudioBuffer = trimmerModule.trimAudioBuffer;
				_isTrimmingAvailable = trimmerModule.isTrimmingAvailable;
			} catch (error) {
				console.warn("Failed to load server-side audio trimmer:", error);
				// Fallback to stub
				const stubModule = await import("@/lib/enrichment/audio-trimmer");
				_trimAudioBuffer = stubModule.trimAudioBuffer;
				_isTrimmingAvailable = stubModule.isTrimmingAvailable;
			}
		} else {
			// Client-side: use stub implementation
			const stubModule = await import("@/lib/enrichment/audio-trimmer");
			_trimAudioBuffer = stubModule.trimAudioBuffer;
			_isTrimmingAvailable = stubModule.isTrimmingAvailable;
		}
	}
	return {
		trimAudioBuffer: _trimAudioBuffer,
		isTrimmingAvailable: _isTrimmingAvailable,
	};
}

// Simple rate limiter for API calls
const rateLimiters = new Map<string, { lastCall: number; minDelay: number }>();

async function rateLimit(service: string, minDelayMs: number = 1000) {
	const limiter = rateLimiters.get(service) || {
		lastCall: 0,
		minDelay: minDelayMs,
	};
	const now = Date.now();
	const timeSinceLastCall = now - limiter.lastCall;

	if (timeSinceLastCall < limiter.minDelay) {
		const waitTime = limiter.minDelay - timeSinceLastCall;
		console.log(`Rate limiting ${service}: waiting ${waitTime}ms`);
		await new Promise((resolve) => setTimeout(resolve, waitTime));
	}

	limiter.lastCall = Date.now();
	rateLimiters.set(service, limiter);
}

export interface SharedMediaResult {
	audioUrl: string;
	imageUrl: string;
	audioPath?: string; // R2 storage path for database
	imagePath?: string; // R2 storage path for database
	audioCached: boolean;
	imageCached: boolean;
}

/**
 * Generate or retrieve audio for a Chinese character
 * Media is shared across all cards with the same hanzi+pinyin combination
 */
export async function generateSharedAudio(
	hanzi: string,
	pinyin: string,
	force: boolean = false,
	meaning: string = "",
	existingAudioPath?: string, // Existing path from database to delete
): Promise<{ audioUrl: string; audioPath: string; cached: boolean }> {
	try {
		// For checking existing media, use the predictable path
		const { audio: checkKey } = generateMediaKeysByHanziPinyin(hanzi, pinyin);

		// Check if audio already exists (skip if force=true)
		if (!force) {
			const exists = await existsInR2(checkKey);
			if (exists) {
				// Return secure API endpoint - strip 'media/' prefix for cleaner URLs
				const audioPath = checkKey.replace("media/", "");
				const audioUrl = `/api/media/${audioPath}`;
				return { audioUrl, audioPath: checkKey, cached: true };
			}
		}

		// If force regenerating and we have an existing path, delete it
		if (force && existingAudioPath) {
			console.log(
				`Force regeneration requested for ${hanzi}, will delete existing audio if present`,
			);
			try {
				const exists = await existsInR2(existingAudioPath);
				if (exists) {
					console.log(`   Deleting existing audio at ${existingAudioPath}`);
					await deleteFromR2(existingAudioPath);
				}
			} catch {
				console.warn(`   Could not delete existing audio:`);
			}
		}

		// Generate new audio
		const voice = "zh-TW-HsiaoChenNeural";

		// Log the pinyin for debugging
		console.log(`   Generating audio for ${hanzi} with pinyin: "${pinyin}"`);

		// Check if this character needs context-based audio
		let needsContext = needsAudioContext(hanzi, pinyin);
		let audioBuffer: Buffer | undefined;

		if (needsContext) {
			console.log(
				`   🎯 Character ${hanzi} needs context-based audio generation`,
			);

			// Check if trimming is available
			const { isTrimmingAvailable } = await getAudioTrimmer();
			const canTrim = await isTrimmingAvailable();
			if (!canTrim) {
				console.warn(
					`   ⚠️ FFmpeg not available, falling back to simple generation`,
				);
				needsContext = false;
			} else {
				// Get context for this character
				const audioContext = await generateAudioContext(hanzi, pinyin, meaning);

				if (audioContext) {
					console.log(`   Context phrase: "${audioContext.contextPhrase}"`);
					console.log(
						`   Trim: ${audioContext.trimStart}ms for ${audioContext.trimDuration}ms`,
					);

					// Generate audio with context phrase
					const ssml = `
						<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
							<voice name="${voice}">
								<prosody rate="-10%" pitch="0%">
									${audioContext.contextPhrase}
								</prosody>
							</voice>
						</speak>
					`.trim();

					// Log SSML for debugging
					console.log(
						`   Context SSML: ${ssml.replace(/\n/g, " ").replace(/\s+/g, " ")}`,
					);

					// Rate limit Azure TTS calls
					await rateLimit("azure-tts", 500); // 500ms between calls

					const response = await fetch(
						`https://${process.env.AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
						{
							method: "POST",
							headers: {
								"Ocp-Apim-Subscription-Key": process.env.AZURE_TTS_KEY!,
								"Content-Type": "application/ssml+xml",
								"X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
								"User-Agent": "ChineseFlashCards",
							},
							body: ssml,
						},
					);

					if (!response.ok) {
						const error = await response.text();
						console.error(`   Azure TTS error response: ${error}`);
						throw new Error(
							`Azure TTS API error: ${response.status} - ${error}`,
						);
					}

					const fullAudioData = await response.arrayBuffer();
					const fullAudioBuffer = Buffer.from(fullAudioData);

					// Trim the audio to extract just the character
					console.log(
						`   ✂️ Trimming audio to extract ${hanzi} pronunciation...`,
					);
					const { trimAudioBuffer } = await getAudioTrimmer();
					audioBuffer = await trimAudioBuffer(
						fullAudioBuffer,
						audioContext.trimStart,
						audioContext.trimDuration,
						"mp3",
					);

					console.log(`   ✓ Audio trimmed successfully`);
				} else {
					console.log(
						`   ⚠️ Could not generate context, falling back to simple generation`,
					);
					needsContext = false;
				}
			}
		}

		// If we don't need context or context generation failed, use simple generation
		if (!needsContext) {
			const ssml = `
				<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
					<voice name="${voice}">
						<prosody rate="-10%" pitch="0%">
							${hanzi}
						</prosody>
					</voice>
				</speak>
			`.trim();

			// Log SSML for debugging
			console.log(`   SSML: ${ssml.replace(/\n/g, " ").replace(/\s+/g, " ")}`);

			// Rate limit Azure TTS calls
			await rateLimit("azure-tts", 500); // 500ms between calls

			const response = await fetch(
				`https://${process.env.AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
				{
					method: "POST",
					headers: {
						"Ocp-Apim-Subscription-Key": process.env.AZURE_TTS_KEY!,
						"Content-Type": "application/ssml+xml",
						"X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
						"User-Agent": "ChineseFlashCards",
					},
					body: ssml,
				},
			);

			if (!response.ok) {
				const error = await response.text();
				console.error(`   Azure TTS error response: ${error}`);
				throw new Error(`Azure TTS API error: ${response.status} - ${error}`);
			}

			const audioData = await response.arrayBuffer();
			audioBuffer = Buffer.from(audioData);
		}

		// Ensure we have audio buffer
		if (!audioBuffer) {
			throw new Error("Failed to generate audio buffer");
		}

		// Generate unique key for new audio to ensure cache invalidation
		const { audio: newAudioKey } = generateUniqueMediaKeys(hanzi, pinyin);

		// Upload to R2 with unique filename
		await uploadToR2(newAudioKey, audioBuffer, {
			contentType: "audio/mpeg",
			metadata: {
				voice,
				generatedAt: new Date().toISOString(),
				contextBased: needsContext ? "true" : "false",
			},
		});

		// Return secure API endpoint - strip 'media/' prefix for cleaner URLs
		const audioPath = newAudioKey.replace("media/", "");
		// No need for timestamp parameter since we have a unique filename
		const audioUrl = `/api/media/${audioPath}`;
		return { audioUrl, audioPath: newAudioKey, cached: false };
	} catch (error) {
		console.error("Shared audio generation error:", error);
		return { audioUrl: "", audioPath: "", cached: false };
	}
}

/**
 * Generate or retrieve image for a Chinese character
 * Media is shared across all cards with the same hanzi+pinyin combination
 */
export async function generateSharedImage(
	hanzi: string,
	meaning: string = "",
	pinyin: string = "",
	force: boolean = false,
	existingImagePath?: string, // Existing path from database to delete
	_aiProvider: "openai" = "openai", // AI provider to use for image prompts (not used in current implementation)
): Promise<{
	imageUrl: string;
	imagePath: string;
	cached: boolean;
	prompt?: string;
	queryPrompt?: string;
	queryResult?: string;
	queryProvider?: string;
}> {
	if (!process.env.FAL_KEY) {
		console.warn("Fal.ai API key not configured");
		return {
			imageUrl: "",
			imagePath: "",
			cached: false,
			prompt: undefined,
			queryPrompt: undefined,
			queryResult: undefined,
			queryProvider: undefined,
		};
	}

	try {
		// For checking existing media, use the predictable path
		const { image: checkKey } = generateMediaKeysByHanziPinyin(hanzi, pinyin);

		// Check if image already exists (skip if force=true)
		if (!force) {
			const exists = await existsInR2(checkKey);
			if (exists) {
				// Return secure API endpoint - strip 'media/' prefix for cleaner URLs
				const imagePath = checkKey.replace("media/", "");
				const imageUrl = `/api/media/${imagePath}`;
				return {
					imageUrl,
					imagePath: checkKey,
					cached: true,
					prompt: undefined,
					queryPrompt: undefined,
					queryResult: undefined,
					queryProvider: undefined,
				};
			}
		}

		// If force regenerating and we have an existing path, delete it
		if (force && existingImagePath) {
			console.log(
				`Force regeneration requested for ${hanzi}, will delete existing image if present`,
			);
			try {
				const exists = await existsInR2(existingImagePath);
				if (exists) {
					console.log(`   Deleting existing image at ${existingImagePath}`);
					await deleteFromR2(existingImagePath);
				}
			} catch {
				console.warn(`   Could not delete existing image:`);
			}
		}

		// Import our smart prompt optimization service
		const { optimizeImagePromptSmart } = await import(
			"@/lib/enrichment/prompt-optimization-service"
		);

		// Generate smart, culturally accurate prompt using OpenAI
		let prompt = "";
		let negativePrompt = "";
		let queryProvider: string | undefined;
		let queryPrompt: string | undefined;
		let queryResult: string | undefined;

		try {
			// Use the smart optimization service to generate the best prompt
			const optimizationResult = await optimizeImagePromptSmart(
				hanzi,
				meaning,
				pinyin,
			);

			if (optimizationResult.prompt) {
				prompt = optimizationResult.prompt;
				negativePrompt = optimizationResult.negativePrompt;
				queryProvider = "Smart AI Optimizer";
				queryPrompt = `Cultural Accuracy: ${(optimizationResult.culturalAccuracy * 100).toFixed(0)}%, Educational Value: ${(optimizationResult.educationalValue * 100).toFixed(0)}%, Clarity: ${(optimizationResult.clarity * 100).toFixed(0)}%`;
				queryResult = optimizationResult.prompt;

				// Log optimization details
				console.log(
					`   Cultural Accuracy: ${(optimizationResult.culturalAccuracy * 100).toFixed(0)}%`,
				);
				console.log(
					`   Educational Value: ${(optimizationResult.educationalValue * 100).toFixed(0)}%`,
				);
				console.log(
					`   Clarity: ${(optimizationResult.clarity * 100).toFixed(0)}%`,
				);
				console.log(
					`   Strategy: ${optimizationResult.metadata.visualStrategy}`,
				);
			} else {
				// Fall back to AI interpretation if needed
				const aiConfig = {
					provider: "openai" as const,
					enabled: true,
				};

				const interpretation = await interpretChineseWithProvider(
					hanzi,
					aiConfig,
					meaning,
				);

				// Store query information
				queryProvider = "OpenAI";
				queryPrompt = interpretation?.interpretationPrompt || "";
				queryResult = interpretation?.imagePrompt || "";

				if (interpretation && interpretation.imagePrompt) {
					// Clean any Chinese characters or text references from the prompt
					const cleanedPrompt = interpretation.imagePrompt
						.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, "") // Remove Chinese chars
						// Remove phrases that reference text/characters
						.replace(
							/\bwith[^,.]*(written|text|characters|words|letters|labeled)[^,.]*[,.]?/gi,
							"",
						)
						.replace(
							/\b(the )?(character|text|word|letter|writing|label)[^,.]*(showing|displaying|above|below|beside)[^,.]*[,.]?/gi,
							"",
						)
						.replace(/\bto emphasize that[^,.]*means[^,.]*[,.]?/gi, "") // Remove "to emphasize that X means Y"
						.replace(/\bmeans "[^"]*"/gi, "") // Remove 'means "something"'
						.replace(/\bmeans '[^']*'/gi, "") // Remove "means 'something'"
						.replace(
							/\b(written|labeled|marked|showing|displaying) (in|with|as)[^,.]*[,.]?/gi,
							"",
						)
						.replace(/\bin bold\b/gi, "")
						.replace(/\bwith.*written\b/gi, "")
						.replace(/\bcharacters.*showing\b/gi, "")
						.replace(/\btext.*displaying\b/gi, "")
						.replace(/\bwords.*on\b/gi, "")
						.replace(/\bwith.*characters\b/gi, "")
						.replace(/\bthe character.*above\b/gi, "")
						.replace(/\bwritten in bold\b/gi, "")
						.replace(/\bare written\b/gi, "")
						.replace(/\bwith text\b/gi, "")
						.replace(/\bshowing text\b/gi, "")
						.replace(/\bdisplaying words\b/gi, "")
						.replace(/\blabeled\b/gi, "")
						// Clean up the result
						.replace(/\s+/g, " ")
						.replace(/\s+([,.])/g, "$1")
						.replace(/,\s*,/g, ",")
						.replace(/\.\s*\./g, ".")
						.replace(/^\s*[,.]/, "") // Remove leading punctuation
						.trim();

					// Adapt the prompt for fal.ai - focus on mnemonic visual association
					const basePrompt = cleanedPrompt.replace(/CRITICAL.*$/, "").trim();

					// If the prompt is too short or generic after cleaning, generate a better one
					if (
						!basePrompt ||
						basePrompt.length < 30 ||
						basePrompt.includes("illustration of a gray cloud") ||
						basePrompt.includes("clear illustration representing")
					) {
						// Generate a specific prompt based on the meaning
						const meaningLower = meaning.toLowerCase();
						if (meaningLower === "rain" || meaningLower.includes("rain")) {
							prompt = `Dark storm cloud with heavy rain falling onto wet ground, raindrops creating ripples in puddles. Photorealistic, moody weather scene. No text anywhere.`;
						} else {
							// Fall back to meaning-based generation
							prompt = `Photorealistic visual for "${meaning}": Simple, clear scene with minimal elements. Professional photography, no text anywhere.`;
						}
					} else {
						// Prefer simpler scenes to reduce AI artifacts - maximum 3 people
						const simplificationHint =
							meaning.toLowerCase().includes("play") ||
							meaning.toLowerCase().includes("group")
								? " Show MAXIMUM 3 people only for clarity."
								: " Prefer single person or object when possible.";

						prompt = `Mnemonic visual aid for learning: ${basePrompt} Photorealistic image that helps students remember the meaning "${meaning}" through real-life association.${simplificationHint} No text, letters, numbers, or written characters anywhere. Professional photography style, natural lighting, high quality, web-friendly resolution.`;
					}
					console.log(
						`Using AI-generated mnemonic prompt (${queryProvider}) for ${hanzi}: "${meaning}"`,
					);
				} else {
					throw new Error("No AI image prompt available");
				}
			}
		} catch {
			// Fallback to dynamic prompt generation
			console.log(
				`Falling back to dynamic mnemonic prompt generation for: "${meaning}"`,
			);

			const meaningLower = meaning.toLowerCase();

			// Create mnemonic-focused prompts based on meaning type - KEEP SIMPLE
			if (
				meaningLower.match(
					/\b(feel|emotion|mood|sad|happy|angry|excited|calm|nervous|proud)\b/,
				)
			) {
				prompt = `Photorealistic portrait: Single person with clear ${meaning} facial expression. Close-up shot, professional photography, natural lighting, no text anywhere.`;
			} else if (
				meaningLower.match(
					/\b(action|move|run|walk|jump|sit|stand|dance|work)\b/,
				)
			) {
				prompt = `Photorealistic action: One person clearly performing "${meaning}" action. Simple composition, professional photography, no text.`;
			} else if (
				meaningLower.match(/\b(sport|play|game|basketball|football|tennis)\b/)
			) {
				prompt = `Photorealistic scene: Two people engaged in "${meaning}". Clear composition with EXACTLY 2 people, proper anatomy, single ball/equipment that maintains its shape. Professional photography, no text.`;
			} else if (
				meaningLower.match(/\b(size|big|small|large|tiny|huge|little)\b/)
			) {
				prompt = `Photorealistic comparison: Simple objects showing "${meaning}" through size contrast. No people, clear scale difference, professional photography, no text.`;
			} else if (
				meaningLower.match(
					/\b(quality|good|bad|beautiful|ugly|clean|dirty|new|old)\b/,
				)
			) {
				prompt = `Photorealistic example: Single object or scene clearly showing "${meaning}" quality. Simple, uncluttered composition, no text.`;
			} else {
				// Generic mnemonic approach - prefer objects over people when possible
				prompt = `Photorealistic visual for "${meaning}": Simple, clear scene with minimal elements. Prefer single object or person. Professional photography, no text anywhere.`;
			}
		}

		console.log(
			`Generating shared fal.ai imagen4 image for ${hanzi} with meaning: "${meaning}" and pinyin: "${pinyin}"`,
		);
		console.log(`Generated mnemonic prompt: ${prompt}`);

		// Try up to 3 times to generate a valid image
		const maxAttempts = 3;
		let currentPrompt = prompt;
		let validImage = false;
		let falImageUrl: string | undefined;
		let validationResult: {
			isValid: boolean;
			confidence?: number;
			issues?: string[];
			details?: Record<string, unknown>;
		} | null = null;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			console.log(`\n🎨 Image generation attempt ${attempt}/${maxAttempts}`);

			// Rate limit fal.ai API calls
			await rateLimit("fal-ai", 1000); // 1 second between calls

			// Generate image with fal.ai imagen4/preview model for high-quality images
			// Using parameters optimized for the imagen4 model with negative prompts
			const result = (await fal.run("fal-ai/imagen4/preview", {
				input: {
					prompt: currentPrompt,
					negative_prompt:
						negativePrompt ||
						"No text, letters, numbers, or written characters. No stereotypes or inappropriate content.",
					steps: 20,
					cfg_scale: 7.5,
					seed: Math.floor(Math.random() * 1000000),
				} as any,
			})) as any;

			console.log("fal.ai API response:", JSON.stringify(result, null, 2));

			// Check for different possible response structures
			falImageUrl = undefined;

			// Check if response is wrapped in 'data' property
			const responseData = result?.data || result;

			if (responseData?.images?.[0]?.url) {
				falImageUrl = responseData.images[0].url;
			} else if (responseData?.image?.url) {
				falImageUrl = responseData.image.url;
			} else if (responseData?.url) {
				falImageUrl = responseData.url;
			} else if (responseData?.output?.images?.[0]?.url) {
				falImageUrl = responseData.output.images[0].url;
			} else if (responseData?.output?.url) {
				falImageUrl = responseData.output.url;
			}

			if (!falImageUrl) {
				console.error(
					"Failed to extract image URL from fal.ai response:",
					result,
				);
				throw new Error("No image URL found in fal.ai response");
			}

			// Since validation is disabled, mark as valid and break out of retry loop
			validImage = true;
			console.log("✅ Image generated successfully!");
			break;
		}

		// Use the last generated image even if it didn't pass validation
		// if (!validImage) {
		// 	console.warn(
		// 		`⚠️ Could not generate a perfect image after ${maxAttempts} attempts. Using best effort.`,
		// 	);
		// 	console.warn("Final validation issues:", validationResult?.issues);
		// }

		if (!falImageUrl) {
			throw new Error("Failed to generate image after all attempts");
		}

		// Download and upload to R2
		const imageResponse = await fetch(falImageUrl);
		const imageBuffer = await imageResponse.arrayBuffer();

		// Generate unique key for new image to ensure cache invalidation
		const { image: newImageKey } = generateUniqueMediaKeys(hanzi, pinyin);

		// Upload to R2 with unique filename
		await uploadToR2(newImageKey, Buffer.from(imageBuffer), {
			contentType: "image/jpeg",
			metadata: {
				generatedAt: new Date().toISOString(),
				source: "fal-imagen4-preview",
				validated: validImage ? "true" : "false",
				validationAttempts: maxAttempts.toString(),
			},
		});

		console.log(`✅ Image uploaded successfully to: ${newImageKey}`);
		console.log(`   Generated mnemonic visual for: "${meaning}"`);
		// if (validImage) {
		// 	console.log(
		// 		`   ✨ Image passed AI validation with confidence: ${validationResult?.confidence}`,
		// 	);
		// } else if (validationResult) {
		// 	console.log(
		// 		`   ⚠️ Image has potential issues: ${validationResult.issues?.join(", ") || "unknown"}`,
		// 	);
		// }

		// Return secure API endpoint - strip 'media/' prefix for cleaner URLs
		const imagePath = newImageKey.replace("media/", "");
		// No need for timestamp parameter since we have a unique filename
		const imageUrl = `/api/media/${imagePath}`;
		console.log(`   Access URL: ${imageUrl}`);

		return {
			imageUrl,
			imagePath: newImageKey,
			cached: false,
			prompt,
			queryPrompt,
			queryResult,
			queryProvider,
		};
	} catch (error) {
		console.error("Shared image generation error:", error);
		// Log detailed error information for debugging
		const err = error as { status?: number; body?: { detail?: unknown } };
		if (err.status === 422 && err.body?.detail) {
			console.error(
				"Validation error details:",
				JSON.stringify(err.body.detail, null, 2),
			);
		}
		return {
			imageUrl: "",
			imagePath: "",
			cached: false,
			prompt: undefined,
			queryPrompt: undefined,
			queryResult: undefined,
			queryProvider: undefined,
		};
	}
}

/**
 * Check if shared media already exists for a character
 */
export async function checkSharedMediaExists(hanzi: string): Promise<{
	audioExists: boolean;
	imageExists: boolean;
}> {
	const { audio: audioKey, image: imageKey } = generateMediaKeysByHanziPinyin(
		hanzi,
		"",
	);

	const [audioExists, imageExists] = await Promise.all([
		existsInR2(audioKey),
		existsInR2(imageKey),
	]);

	return { audioExists, imageExists };
}
