import OpenAI from "openai";
import { uploadImageFromUrl, existsInR2, generateMediaKeys } from '@/lib/r2-storage';

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
 * Generate image using DALL-E 3 and store in R2
 */
export async function generateDALLEImageR2(
  hanzi: string,
  meaning: string,
  pinyin: string,
  deckId: string,
  cardId: string,
  customPrompt?: string,
  forceNew: boolean = false,
): Promise<GeneratedImage> {
  if (!openai) {
    console.warn("OpenAI API key not configured");
    return { url: "", cached: false };
  }

  try {
    const { image: imageKey } = generateMediaKeys(deckId, cardId);
    
    // Check if image already exists in R2 (unless forced to generate new)
    if (!forceNew) {
      const exists = await existsInR2(imageKey);
      if (exists) {
        console.log(`DALL-E cache hit for: ${hanzi}`);
        const url = `${process.env.R2_PUBLIC_URL}/${imageKey}`;
        return { url, cached: true };
      }
    }

    // Use custom prompt if provided, otherwise generate one
    const prompt = customPrompt || generateLearningPrompt(hanzi, meaning, pinyin);

    // Skip if prompt indicates no image needed
    if (prompt === "SKIP_IMAGE") {
      console.log(`Skipping image generation for: ${hanzi}`);
      return { url: "", cached: false };
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

    const tempImageUrl = response.data?.[0]?.url;
    if (!tempImageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    // Upload to R2
    const storedUrl = await uploadImageFromUrl(tempImageUrl, imageKey);

    return { url: storedUrl, cached: false };
  } catch (error) {
    console.error("DALL-E generation error:", error);
    return { url: "", cached: false };
  }
}

/**
 * Batch generate images for multiple characters
 */
export async function batchGenerateImagesR2(
  characters: Array<{ 
    hanzi: string; 
    meaning: string; 
    pinyin: string;
    deckId: string;
    cardId: string;
  }>,
): Promise<Map<string, GeneratedImage>> {
  const results = new Map<string, GeneratedImage>();

  // Process sequentially to avoid rate limits and manage costs
  for (const char of characters) {
    const result = await generateDALLEImageR2(
      char.hanzi,
      char.meaning,
      char.pinyin,
      char.deckId,
      char.cardId,
    );
    results.set(char.hanzi, result);

    // Small delay between requests
    if (result.url && !result.cached) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}