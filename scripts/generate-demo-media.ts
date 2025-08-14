/**
 * Script to generate demo media files (audio and images) for flash session demo
 * Run with: npx tsx scripts/generate-demo-media.ts
 */

// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import { fal } from "@fal-ai/client";

// Override the bucket name for static demo media
const STATIC_BUCKET = "danbing-static-media";

// Custom R2 client for static bucket
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const staticR2Client = new S3Client({
	region: "auto",
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
	forcePathStyle: true,
	requestChecksumCalculation: "WHEN_REQUIRED",
	responseChecksumValidation: "WHEN_REQUIRED",
});

// Configure fal.ai
if (process.env.FAL_KEY) {
	fal.config({
		credentials: process.env.FAL_KEY,
	});
}

// Custom functions for demo media generation
async function uploadToStaticR2(
	key: string,
	buffer: Buffer,
	contentType: string,
): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: STATIC_BUCKET,
		Key: key,
		Body: buffer,
		ContentType: contentType,
		Metadata: {
			type: "demo-media",
			generatedAt: new Date().toISOString(),
		},
	});

	await staticR2Client.send(command);
	return `https://static.danbing.ai/${key}`;
}

async function generateDemoTTS(
	text: string,
	filename: string,
): Promise<string> {
	try {
		// Generate TTS using Azure
		const voice = "zh-TW-HsiaoChenNeural";
		const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
        <voice name="${voice}">
          <prosody rate="-10%" pitch="0%">
            ${text}
          </prosody>
        </voice>
      </speak>
    `.trim();

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
			throw new Error(`Azure TTS error: ${response.status}`);
		}

		const audioBuffer = Buffer.from(await response.arrayBuffer());
		const url = await uploadToStaticR2(filename, audioBuffer, "audio/mpeg");
		return url;
	} catch (error) {
		console.error("TTS generation error:", error);
		return "";
	}
}

async function generateDemoImage(
	hanzi: string,
	prompt: string,
	filename: string,
): Promise<string> {
	try {
		if (!process.env.FAL_KEY) {
			throw new Error("fal.ai not configured");
		}

		// Generate image with fal.ai imagen4/preview model for high-quality images
		const result = (await fal.run("fal-ai/imagen4/preview", {
			input: {
				prompt,
				negative_prompt:
					"No text, letters, numbers, or written characters. No stereotypes or inappropriate content.",
				steps: 20,
				cfg_scale: 7.5,
				seed: Math.floor(Math.random() * 1000000),
			} as any,
		})) as any;

		// Extract image URL from response
		let imageUrl: string | undefined;
		const responseData = result?.data || result;

		if (responseData?.images?.[0]?.url) {
			imageUrl = responseData.images[0].url;
		} else if (responseData?.image?.url) {
			imageUrl = responseData.image.url;
		} else if (responseData?.url) {
			imageUrl = responseData.url;
		} else if (responseData?.output?.images?.[0]?.url) {
			imageUrl = responseData.output.images[0].url;
		} else if (responseData?.output?.url) {
			imageUrl = responseData.output.url;
		}

		if (!imageUrl) {
			throw new Error("No image URL returned from fal.ai");
		}

		// Download and upload to static R2
		const imageResponse = await fetch(imageUrl);
		const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
		const url = await uploadToStaticR2(filename, imageBuffer, "image/jpeg");
		return url;
	} catch (error) {
		console.error("Image generation error:", error);
		return "";
	}
}

interface DemoCharacter {
	hanzi: string;
	pinyin: string;
	meaning: string;
	imagePrompt: string;
}

const DEMO_CHARACTERS: DemoCharacter[] = [
	{
		hanzi: "大",
		pinyin: "dà",
		meaning: "big, large",
		imagePrompt:
			'Photorealistic size comparison showing "big, large". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. A massive adult elephant standing next to a tiny mouse in natural lighting, dramatic scale difference. Professional wildlife photography style, educational context.',
	},
	{
		hanzi: "小",
		pinyin: "xiǎo",
		meaning: "small, little",
		imagePrompt:
			'Photorealistic macro shot showing "small, little". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. A tiny ladybug resting on a large green leaf with dewdrops, emphasizing the small scale. Professional macro photography, natural lighting.',
	},
	{
		hanzi: "人",
		pinyin: "rén",
		meaning: "person, people",
		imagePrompt:
			'Photorealistic portrait representing "person, people". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. A single person standing confidently, natural expression, professional portrait photography. Medium shot, natural lighting, educational context.',
	},
	// Additional characters for quiz options
	{
		hanzi: "太",
		pinyin: "tài",
		meaning: "too, extremely",
		imagePrompt:
			'Photorealistic scene showing "too, extremely". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. A coffee cup overflowing with hot coffee spilling onto a white saucer and table. Professional food photography, dramatic lighting highlighting the excess.',
	},
	{
		hanzi: "天",
		pinyin: "tiān",
		meaning: "sky, heaven",
		imagePrompt:
			'Photorealistic landscape showing "sky, heaven". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. A vast blue sky with dramatic white cumulus clouds during golden hour. Professional landscape photography, wide angle view.',
	},
	{
		hanzi: "少",
		pinyin: "shǎo",
		meaning: "few, little",
		imagePrompt:
			'Photorealistic scene showing "few, little". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. A clear glass jar with only 3 colorful candies at the bottom, emphasizing emptiness. Professional product photography, soft lighting.',
	},
	{
		hanzi: "水",
		pinyin: "shuǐ",
		meaning: "water",
		imagePrompt:
			'Photorealistic shot of "water". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Crystal clear water being poured into a glass with visible water droplets and ripples. Professional beverage photography, backlighting to show clarity.',
	},
	{
		hanzi: "入",
		pinyin: "rù",
		meaning: "enter",
		imagePrompt:
			'Photorealistic architectural shot showing "enter". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. An inviting open doorway with warm light streaming through from inside, clear path leading in. Professional architectural photography.',
	},
	{
		hanzi: "八",
		pinyin: "bā",
		meaning: "eight",
		imagePrompt:
			'Photorealistic composition showing "eight". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Eight identical red apples arranged in two rows on a white surface. Professional still life photography, perfect symmetry.',
	},
];

async function generateDemoMedia() {
	console.log("🎵 Generating demo media files...");

	// Debug: Check if API keys are loaded
	console.log("🔍 Environment check:");
	console.log(
		`AZURE_TTS_KEY: ${process.env.AZURE_TTS_KEY ? "SET (" + process.env.AZURE_TTS_KEY.substring(0, 8) + "...)" : "NOT SET"}`,
	);
	console.log(
		`FAL_KEY: ${process.env.FAL_KEY ? "SET (" + process.env.FAL_KEY.substring(0, 8) + "...)" : "NOT SET"}`,
	);
	console.log(
		`R2_ACCOUNT_ID: ${process.env.R2_ACCOUNT_ID ? "SET (" + process.env.R2_ACCOUNT_ID.substring(0, 8) + "...)" : "NOT SET"}`,
	);
	console.log("");

	// Add option to skip already generated characters
	const skipCharacters = process.argv.includes("--skip-existing")
		? ["大", "小", "人", "太", "天"]
		: [];

	// Force regenerate specific characters only
	const regenerateOnly = process.argv.includes("--regenerate-only")
		? null // Regenerate all when not specified
		: null;

	// Option to only regenerate images
	const imagesOnly = process.argv.includes("--images-only");

	for (const char of DEMO_CHARACTERS) {
		// Skip if using regenerateOnly and character not in list
		if (regenerateOnly && !regenerateOnly.includes(char.hanzi)) {
			console.log(
				`⏭️  Skipping character not in regenerate list: ${char.hanzi}`,
			);
			continue;
		}

		if (skipCharacters.includes(char.hanzi)) {
			console.log(`⏭️  Skipping already generated character: ${char.hanzi}`);
			continue;
		}

		console.log(`\n📝 Processing character: ${char.hanzi} (${char.pinyin})`);

		try {
			// Generate TTS audio directly to static bucket (unless images only)
			if (!imagesOnly) {
				console.log("🔊 Generating TTS audio...");
				const audioUrl = await generateDemoTTS(
					char.hanzi,
					`demo-deck/demo-${char.hanzi}/audio.mp3`,
				);

				if (audioUrl) {
					console.log(`✅ Audio: generated - ${audioUrl}`);
				} else {
					console.log("❌ Audio generation failed");
				}
			}

			// Generate fal.ai image directly to static bucket
			console.log("🖼️  Generating fal.ai photorealistic image...");
			const imageUrl = await generateDemoImage(
				char.hanzi,
				char.imagePrompt,
				`demo-deck/demo-${char.hanzi}/image.jpg`,
			);

			if (imageUrl) {
				console.log(`✅ Image: generated - ${imageUrl}`);
			} else {
				console.log("❌ Image generation failed");
			}

			// Small delay between characters to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error(`❌ Error processing ${char.hanzi}:`, error);
		}
	}

	console.log("\n🎉 Demo media generation complete!");
	console.log("\nGenerated URLs will be in format:");
	console.log(
		"Audio: https://static.danbing.ai/demo-deck/demo-[character]/audio.mp3",
	);
	console.log(
		"Images: https://static.danbing.ai/demo-deck/demo-[character]/image.jpg",
	);
}

// Check if this script is being run directly
if (require.main === module) {
	generateDemoMedia().catch(console.error);
}

export { generateDemoMedia, DEMO_CHARACTERS };
