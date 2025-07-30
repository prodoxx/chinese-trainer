import OpenAI from "openai";
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import crypto from "crypto";

const openai = process.env.OPENAI_API_KEY
	? new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		})
	: null;

export interface GeneratedImage {
	url: string;
	cached: boolean;
}

/**
 * Generate a cache key for the image
 */
function generateCacheKey(
	hanzi: string,
	meaning: string,
	prompt: string,
): string {
	// Include the actual prompt in the cache key to ensure new prompts generate new images
	return crypto
		.createHash("md5")
		.update(`dalle-v2-${hanzi}-${meaning}-${prompt}`)
		.digest("hex");
}

/**
 * Check if image exists in GridFS cache
 */
async function checkImageCache(
	bucket: mongoose.mongo.GridFSBucket,
	cacheKey: string,
): Promise<string | null> {
	try {
		const files = await bucket
			.find({ filename: `dalle_${cacheKey}.png` })
			.toArray();
		if (files.length > 0) {
			return `/api/images/${files[0]._id}`;
		}
	} catch (error) {
		console.error("Error checking image cache:", error);
	}
	return null;
}

/**
 * Generate a descriptive prompt for language learning
 */
function generateLearningPrompt(
	hanzi: string,
	meaning: string,
	pinyin: string,
): string {
	// Check if this is a word that shouldn't have an image
	const skipWords = [
		"的",
		"了",
		"嗎",
		"把",
		"被",
		"我",
		"你",
		"他",
		"她",
		"它",
	];
	if (skipWords.includes(hanzi)) {
		return "SKIP_IMAGE";
	}

	// Parse the meaning to understand what we're depicting
	const meaningLower = meaning.toLowerCase();
	
	// For abstract concepts or actions, create contextual scenes
	if (hanzi === "累") {
		// Check if it's tired (lèi) or accumulate (lěi) based on pinyin
		if (pinyin.includes("lèi") || pinyin.includes("lei4") || meaningLower.includes("tired") || meaningLower.includes("weary")) {
			return `Educational illustration showing tiredness: A person looking exhausted, sitting on a chair with drooping shoulders, yawning, with tired eyes and a weary expression. Maybe holding their head in their hands or stretching. Simple cartoon style with muted colors to convey fatigue. No text.`;
		} else if (pinyin.includes("lěi") || pinyin.includes("lei3") || meaningLower.includes("accumulate")) {
			return `Educational illustration showing the concept of accumulation: A person carefully stacking coins in increasingly tall piles on a table, representing gradual accumulation over time. Simple, clean cartoon style with bright colors. No text.`;
		}
	}
	
	if (hanzi === "放鬆" || meaningLower.includes("relax") || meaningLower.includes("loosen")) {
		return `Educational illustration showing relaxation: A person sitting comfortably in a peaceful garden, shoulders relaxed, with a calm expression, perhaps doing gentle stretching or meditation. Peaceful atmosphere with soft colors. Simple cartoon style. No text.`;
	}
	
	// For verbs and actions
	if (meaningLower.includes("to ")) {
		return `Educational illustration clearly demonstrating the action "${meaning}". Show a person actively performing this specific action in a clear, unambiguous way. Simple cartoon style, bright colors, educational context. No text.`;
	}
	
	// For concrete objects
	if (meaningLower.includes("object") || meaningLower.includes("thing") || 
		!meaningLower.includes("to ") && !meaningLower.includes("feeling") && !meaningLower.includes("emotion")) {
		return `Educational illustration of "${meaning}". Show the object clearly as the main focus, with appropriate context. Simple, clean style with bright colors. No text.`;
	}
	
	// For emotions and feelings
	if (meaningLower.includes("feeling") || meaningLower.includes("emotion") || 
		meaningLower.includes("happy") || meaningLower.includes("sad") || meaningLower.includes("angry")) {
		return `Educational illustration showing the emotion or feeling of "${meaning}". Use facial expressions and body language to clearly convey this emotion. Simple cartoon style. No text.`;
	}

	// Default: Create a scene that clearly represents the meaning
	return `Educational illustration that clearly and accurately represents the concept of "${meaning}". The image should make the meaning immediately obvious to a language learner. Use visual metaphors or concrete examples when dealing with abstract concepts. Simple, clean cartoon style with bright colors. No text in the image.`;
}

/**
 * Download image from URL and store in GridFS
 */
async function storeImageInGridFS(
	bucket: mongoose.mongo.GridFSBucket,
	imageUrl: string,
	cacheKey: string,
): Promise<string> {
	const response = await fetch(imageUrl);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.statusText}`);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	const filename = `dalle_${cacheKey}.png`;

	return new Promise((resolve, reject) => {
		const uploadStream = bucket.openUploadStream(filename, {
			contentType: "image/png",
			metadata: {
				type: "dalle",
				cacheKey,
				createdAt: new Date(),
			},
		});

		uploadStream.on("error", reject);
		uploadStream.on("finish", () => {
			resolve(`/api/images/${uploadStream.id}`);
		});

		uploadStream.write(buffer);
		uploadStream.end();
	});
}

/**
 * Generate image using DALL-E 3
 */
export async function generateDALLEImage(
	hanzi: string,
	meaning: string,
	pinyin: string,
	customPrompt?: string,
	forceNew: boolean = false,
): Promise<GeneratedImage> {
	if (!openai) {
		console.warn("OpenAI API key not configured");
		return { url: "", cached: false };
	}

	try {
		await connectDB();
		const db = mongoose.connection.db;
		if (!db) {
			throw new Error('Database not connected');
		}
		const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "images" });

		// Use custom prompt if provided, otherwise generate one
		const prompt =
			customPrompt || generateLearningPrompt(hanzi, meaning, pinyin);

		// Skip if prompt indicates no image needed
		if (prompt === "SKIP_IMAGE") {
			console.log(`Skipping image generation for: ${hanzi}`);
			return { url: "", cached: false };
		}

		const cacheKey = generateCacheKey(hanzi, meaning, prompt);

		// Check cache first (unless forced to generate new)
		if (!forceNew) {
			const cachedUrl = await checkImageCache(bucket, cacheKey);
			if (cachedUrl) {
				console.log(`DALL-E cache hit for: ${hanzi}`);
				return { url: cachedUrl, cached: true };
			}
		}

		console.log(
			`Generating DALL-E image for ${hanzi} with prompt: "${prompt}"`,
		);

		// Generate image with DALL-E 3
		const response = await openai.images.generate({
			model: "dall-e-3",
			prompt: prompt,
			n: 1,
			size: "1024x1024",
			quality: "standard", // Use 'standard' instead of 'hd' to save costs
			style: "natural", // Natural style for educational purposes
		});

		const imageUrl = response.data?.[0]?.url;
		if (!imageUrl) {
			throw new Error("No image URL returned from DALL-E");
		}

		// Store in GridFS
		const storedUrl = await storeImageInGridFS(bucket, imageUrl, cacheKey);

		return { url: storedUrl, cached: false };
	} catch (error) {
		console.error("DALL-E generation error:", error);
		return { url: "", cached: false };
	}
}

/**
 * Batch generate images for multiple characters
 */
export async function batchGenerateImages(
	characters: Array<{ hanzi: string; meaning: string; pinyin: string }>,
): Promise<Map<string, GeneratedImage>> {
	const results = new Map<string, GeneratedImage>();

	// Process sequentially to avoid rate limits and manage costs
	for (const char of characters) {
		const result = await generateDALLEImage(
			char.hanzi,
			char.meaning,
			char.pinyin,
		);
		results.set(char.hanzi, result);

		// Small delay between requests
		if (result.url && !result.cached) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	return results;
}
