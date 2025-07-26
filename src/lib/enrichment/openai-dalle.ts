import OpenAI from "openai";
import { GridFSBucket } from "mongodb";
import { getMongoClient } from "@/lib/db/mongodb";
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
	bucket: GridFSBucket,
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

	// Default: Create a scene based on the meaning
	return `Simple illustration representing "${meaning}". If depicting a person, show a representation including East Asian, Hispanic, White, or Black individual only - one person only. No South Asian/Indian people. Cartoon or minimalist style, educational context.`;
}

/**
 * Download image from URL and store in GridFS
 */
async function storeImageInGridFS(
	bucket: GridFSBucket,
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
		const client = await getMongoClient();
		const db = client.db();
		const bucket = new GridFSBucket(db, { bucketName: "images" });

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

		const imageUrl = response.data[0]?.url;
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
