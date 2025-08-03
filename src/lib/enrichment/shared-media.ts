/**
 * Shared media generation functions that reuse media across all cards with the same hanzi
 */

import { uploadToR2, existsInR2, deleteFromR2, generateMediaKeysByHanzi } from '@/lib/r2-storage';
import { fal } from '@fal-ai/client';
import { interpretChinese } from '@/lib/enrichment/openai-interpret';

// Simple rate limiter for API calls
const rateLimiters = new Map<string, { lastCall: number; minDelay: number }>();

async function rateLimit(service: string, minDelayMs: number = 1000) {
  const limiter = rateLimiters.get(service) || { lastCall: 0, minDelay: minDelayMs };
  const now = Date.now();
  const timeSinceLastCall = now - limiter.lastCall;
  
  if (timeSinceLastCall < limiter.minDelay) {
    const waitTime = limiter.minDelay - timeSinceLastCall;
    console.log(`Rate limiting ${service}: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  limiter.lastCall = Date.now();
  rateLimiters.set(service, limiter);
}

export interface SharedMediaResult {
  audioUrl: string;
  imageUrl: string;
  audioCached: boolean;
  imageCached: boolean;
}

/**
 * Generate or retrieve audio for a Chinese character
 * Media is shared across all cards with the same hanzi
 */
export async function generateSharedAudio(hanzi: string): Promise<{ audioUrl: string; cached: boolean }> {
  try {
    const { audio: audioKey } = generateMediaKeysByHanzi(hanzi);
    
    // Check if audio already exists
    const exists = await existsInR2(audioKey);
    if (exists) {
      // Return secure API endpoint - strip 'media/' prefix for cleaner URLs
      const audioPath = audioKey.replace('media/', '');
      const audioUrl = `/api/media/${audioPath}`;
      return { audioUrl, cached: true };
    }
    
    // Generate new audio
    const voice = 'zh-TW-HsiaoChenNeural';
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
        <voice name="${voice}">
          <prosody rate="-10%" pitch="0%">
            ${hanzi}
          </prosody>
        </voice>
      </speak>
    `.trim();

    // Rate limit Azure TTS calls
    await rateLimit('azure-tts', 500); // 500ms between calls
    
    const response = await fetch(`https://${process.env.AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TTS_KEY!,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'ChineseFlashCards'
      },
      body: ssml
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure TTS API error: ${response.status} - ${error}`);
    }

    const audioData = await response.arrayBuffer();
    const audioBuffer = Buffer.from(audioData);
    
    // Upload to R2 (avoid special characters in metadata)
    await uploadToR2(audioKey, audioBuffer, {
      contentType: 'audio/mpeg',
      metadata: {
        voice,
        generatedAt: new Date().toISOString(),
      }
    });
    
    // Return secure API endpoint - strip 'media/' prefix for cleaner URLs
    const audioPath = audioKey.replace('media/', '');
    const audioUrl = `/api/media/${audioPath}`;
    return { audioUrl, cached: false };
  } catch (error) {
    console.error('Shared audio generation error:', error);
    return { audioUrl: '', cached: false };
  }
}

/**
 * Generate or retrieve image for a Chinese character
 * Media is shared across all cards with the same hanzi
 */
export async function generateSharedImage(
  hanzi: string,
  meaning: string = '',
  pinyin: string = '',
  force: boolean = false
): Promise<{ imageUrl: string; cached: boolean }> {
  if (!process.env.FAL_KEY) {
    console.warn("Fal.ai API key not configured");
    return { imageUrl: '', cached: false };
  }

  try {
    const { image: imageKey } = generateMediaKeysByHanzi(hanzi);
    
    // Check if image already exists (skip if force=true)
    if (!force) {
      const exists = await existsInR2(imageKey);
      if (exists) {
        // Return secure API endpoint - strip 'media/' prefix for cleaner URLs
        const imagePath = imageKey.replace('media/', '');
        const imageUrl = `/api/media/${imagePath}`;
        return { imageUrl, cached: true };
      }
    } else {
      console.log(`Force regeneration requested for ${hanzi}, will delete existing image if present`);
      // Delete existing image if force regenerating
      try {
        const exists = await existsInR2(imageKey);
        if (exists) {
          console.log(`   Deleting existing image at ${imageKey}`);
          await deleteFromR2(imageKey);
        }
      } catch (deleteError) {
        console.warn(`   Could not delete existing image:`, deleteError);
      }
    }
    
    // Generate mnemonic-focused prompt using AI interpretation
    let prompt = '';
    
    try {
      // Use our existing OpenAI interpretation to get a better image prompt
      const interpretation = await interpretChinese(hanzi);
      if (interpretation && interpretation.imagePrompt) {
        // Adapt the prompt for fal.ai - focus on mnemonic visual association
        const basePrompt = interpretation.imagePrompt.replace(/CRITICAL.*$/, '').trim();
        prompt = `Mnemonic visual aid for learning: ${basePrompt} Photorealistic image that helps students remember the meaning "${meaning}" through real-life association. No text, letters, numbers, or written characters anywhere. Professional photography style, natural lighting, high quality, web-friendly resolution.`;
        console.log(`Using AI-generated mnemonic prompt for ${hanzi}: "${meaning}"`);
      } else {
        throw new Error('No AI image prompt available');
      }
    } catch (error) {
      // Fallback to dynamic prompt generation
      console.log(`Falling back to dynamic mnemonic prompt generation for: "${meaning}"`);
      
      const meaningLower = meaning.toLowerCase();
      
      // Create mnemonic-focused prompts based on meaning type
      if (meaningLower.match(/\b(feel|emotion|mood|sad|happy|angry|excited|calm|nervous|proud)\b/)) {
        prompt = `Photorealistic portrait: A person with natural ${meaning} expression that helps students remember this emotion through real human connection. Professional photography, natural lighting, no text anywhere, educational visual aid.`;
      } else if (meaningLower.match(/\b(action|move|run|walk|jump|sit|stand|dance|work)\b/)) {
        prompt = `Photorealistic action shot: Real person naturally performing "${meaning}" action in a memorable way. Professional photography, motion capture, no text, visual memory aid for language learning.`;
      } else if (meaningLower.match(/\b(size|big|small|large|tiny|huge|little)\b/)) {
        prompt = `Photorealistic size comparison: Real objects clearly showing "${meaning}" concept through dramatic scale difference. Professional photography, no text, helps students associate visual with meaning.`;
      } else if (meaningLower.match(/\b(quality|good|bad|beautiful|ugly|clean|dirty|new|old)\b/)) {
        prompt = `Photorealistic contrast: Real-world scene clearly showing "${meaning}" quality for easy memorization. Professional photography, no text, helps students remember through visual association.`;
      } else {
        // Generic mnemonic approach
        prompt = `Photorealistic visual for "${meaning}": Create a memorable real-world scene that helps students instantly recall this concept. Professional photography, natural lighting, no text anywhere, clear visual memory aid.`;
      }
    }
    
    console.log(`Generating shared fal.ai image for ${hanzi} with meaning: "${meaning}" and pinyin: "${pinyin}"`);
    console.log(`Generated mnemonic prompt: ${prompt}`);
    console.log(`Image will be stored at: ${imageKey}`);
    
    // Rate limit fal.ai API calls
    await rateLimit('fal-ai', 1000); // 1 second between calls
    
    // Generate image with fal.ai flux-pro model for photorealistic quality
    // Using parameters optimized for realistic images
    const result = await fal.run("fal-ai/flux-pro", {
      input: {
        prompt,
        image_size: "square_hd",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: 2,
        output_format: "jpeg"
      }
    }) as any;

    console.log('fal.ai API response:', JSON.stringify(result, null, 2));

    // Check for different possible response structures
    let falImageUrl: string | undefined;
    
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
      console.error('Failed to extract image URL from fal.ai response:', result);
      throw new Error("No image URL found in fal.ai response");
    }

    // Download and upload to R2
    const imageResponse = await fetch(falImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Upload to R2 with minimal metadata to avoid signature issues
    await uploadToR2(imageKey, Buffer.from(imageBuffer), {
      contentType: 'image/jpeg',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'fal-flux-pro',
      }
    });
    
    console.log(`✅ Image uploaded successfully to: ${imageKey}`);
    console.log(`   Generated mnemonic visual for: "${meaning}"`);
    
    // Return secure API endpoint - strip 'media/' prefix for cleaner URLs
    const imagePath = imageKey.replace('media/', '');
    // Add timestamp to bust browser cache when force regenerating
    const imageUrl = force 
      ? `/api/media/${imagePath}?t=${Date.now()}`
      : `/api/media/${imagePath}`;
    console.log(`   Access URL: ${imageUrl}`);
    
    return { imageUrl, cached: false };
  } catch (error: any) {
    console.error('Shared image generation error:', error);
    // Log detailed error information for debugging
    if (error.status === 422 && error.body?.detail) {
      console.error('Validation error details:', JSON.stringify(error.body.detail, null, 2));
    }
    return { imageUrl: '', cached: false };
  }
}

/**
 * Check if shared media already exists for a character
 */
export async function checkSharedMediaExists(hanzi: string): Promise<{
  audioExists: boolean;
  imageExists: boolean;
}> {
  const { audio: audioKey, image: imageKey } = generateMediaKeysByHanzi(hanzi);
  
  const [audioExists, imageExists] = await Promise.all([
    existsInR2(audioKey),
    existsInR2(imageKey)
  ]);
  
  return { audioExists, imageExists };
}