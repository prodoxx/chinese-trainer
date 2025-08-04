/**
 * Shared media generation functions that reuse media across all cards with the same hanzi
 */

import { uploadToR2, existsInR2, deleteFromR2, generateMediaKeysByHanzi } from '@/lib/r2-storage';
import { fal } from '@fal-ai/client';
import { interpretChinese } from '@/lib/enrichment/openai-interpret';
import { validateAIGeneratedImage, getRefinedPromptForIssues, getSimplifiedPrompt } from '@/lib/enrichment/image-validation';

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
export async function generateSharedAudio(hanzi: string, force: boolean = false): Promise<{ audioUrl: string; cached: boolean }> {
  try {
    const { audio: audioKey } = generateMediaKeysByHanzi(hanzi);
    
    // Check if audio already exists (skip if force=true)
    if (!force) {
      const exists = await existsInR2(audioKey);
      if (exists) {
        // Return secure API endpoint - strip 'media/' prefix for cleaner URLs
        const audioPath = audioKey.replace('media/', '');
        const audioUrl = `/api/media/${audioPath}`;
        return { audioUrl, cached: true };
      }
    } else {
      console.log(`Force regeneration requested for ${hanzi}, will delete existing audio if present`);
      // Delete existing audio if force regenerating
      try {
        const exists = await existsInR2(audioKey);
        if (exists) {
          console.log(`   Deleting existing audio at ${audioKey}`);
          await deleteFromR2(audioKey);
        }
      } catch (deleteError) {
        console.warn(`   Could not delete existing audio:`, deleteError);
      }
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
): Promise<{ imageUrl: string; cached: boolean; prompt?: string }> {
  if (!process.env.FAL_KEY) {
    console.warn("Fal.ai API key not configured");
    return { imageUrl: '', cached: false, prompt: undefined };
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
        return { imageUrl, cached: true, prompt: undefined };
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
        
        // Prefer simpler scenes to reduce AI artifacts - maximum 3 people
        const simplificationHint = meaning.toLowerCase().includes('play') || meaning.toLowerCase().includes('group') 
          ? ' Show MAXIMUM 3 people only for clarity.' 
          : ' Prefer single person or object when possible.';
        
        prompt = `Mnemonic visual aid for learning: ${basePrompt} Photorealistic image that helps students remember the meaning "${meaning}" through real-life association.${simplificationHint} No text, letters, numbers, or written characters anywhere. Professional photography style, natural lighting, high quality, web-friendly resolution.`;
        console.log(`Using AI-generated mnemonic prompt for ${hanzi}: "${meaning}"`);
      } else {
        throw new Error('No AI image prompt available');
      }
    } catch (error) {
      // Fallback to dynamic prompt generation
      console.log(`Falling back to dynamic mnemonic prompt generation for: "${meaning}"`);
      
      const meaningLower = meaning.toLowerCase();
      
      // Create mnemonic-focused prompts based on meaning type - KEEP SIMPLE
      if (meaningLower.match(/\b(feel|emotion|mood|sad|happy|angry|excited|calm|nervous|proud)\b/)) {
        prompt = `Photorealistic portrait: Single person with clear ${meaning} facial expression. Close-up shot, professional photography, natural lighting, no text anywhere.`;
      } else if (meaningLower.match(/\b(action|move|run|walk|jump|sit|stand|dance|work)\b/)) {
        prompt = `Photorealistic action: One person clearly performing "${meaning}" action. Simple composition, professional photography, no text.`;
      } else if (meaningLower.match(/\b(sport|play|game|basketball|football|tennis)\b/)) {
        prompt = `Photorealistic scene: Two people engaged in "${meaning}". Clear composition with EXACTLY 2 people, proper anatomy, single ball/equipment that maintains its shape. Professional photography, no text.`;
      } else if (meaningLower.match(/\b(size|big|small|large|tiny|huge|little)\b/)) {
        prompt = `Photorealistic comparison: Simple objects showing "${meaning}" through size contrast. No people, clear scale difference, professional photography, no text.`;
      } else if (meaningLower.match(/\b(quality|good|bad|beautiful|ugly|clean|dirty|new|old)\b/)) {
        prompt = `Photorealistic example: Single object or scene clearly showing "${meaning}" quality. Simple, uncluttered composition, no text.`;
      } else {
        // Generic mnemonic approach - prefer objects over people when possible
        prompt = `Photorealistic visual for "${meaning}": Simple, clear scene with minimal elements. Prefer single object or person. Professional photography, no text anywhere.`;
      }
    }
    
    console.log(`Generating shared fal.ai image for ${hanzi} with meaning: "${meaning}" and pinyin: "${pinyin}"`);
    console.log(`Generated mnemonic prompt: ${prompt}`);
    console.log(`Image will be stored at: ${imageKey}`);
    
    // Try up to 3 times to generate a valid image
    const maxAttempts = 3;
    let currentPrompt = prompt;
    let validImage = false;
    let falImageUrl: string | undefined;
    let validationResult: any = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\n🎨 Image generation attempt ${attempt}/${maxAttempts}`);
      
      // Rate limit fal.ai API calls
      await rateLimit('fal-ai', 1000); // 1 second between calls
      
      // Generate image with fal.ai flux-pro model for photorealistic quality
      // Using parameters optimized for realistic images
      const result = await fal.run("fal-ai/flux-pro", {
        input: {
          prompt: currentPrompt,
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
        console.error('Failed to extract image URL from fal.ai response:', result);
        throw new Error("No image URL found in fal.ai response");
      }
      
      // Validate the generated image
      console.log('🔍 Validating generated image for AI artifacts...');
      validationResult = await validateAIGeneratedImage(falImageUrl);
      console.log('Validation result:', validationResult);
      
      if (validationResult.isValid) {
        console.log('✅ Image passed validation!');
        validImage = true;
        break;
      } else {
        console.log(`❌ Image failed validation on attempt ${attempt}:`, validationResult.issues);
        
        if (attempt < maxAttempts) {
          // Check if scene is too complex or has too many people
          if (validationResult.details?.crowdedScene || validationResult.details?.personCount > 3) {
            console.log(`Scene has ${validationResult.details?.personCount || 'unknown'} people (max 3 allowed), simplifying prompt...`);
            currentPrompt = getSimplifiedPrompt(prompt, meaning);
          } else {
            // Refine prompt based on specific issues found
            currentPrompt = getRefinedPromptForIssues(prompt, validationResult.issues, validationResult.details);
          }
          console.log('Refined prompt for next attempt:', currentPrompt);
        }
      }
    }
    
    // Use the last generated image even if it didn't pass validation
    if (!validImage) {
      console.warn(`⚠️ Could not generate a perfect image after ${maxAttempts} attempts. Using best effort.`);
      console.warn('Final validation issues:', validationResult?.issues);
    }
    
    if (!falImageUrl) {
      throw new Error("Failed to generate image after all attempts");
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
        validated: validImage ? 'true' : 'false',
        validationAttempts: maxAttempts.toString(),
      }
    });
    
    console.log(`✅ Image uploaded successfully to: ${imageKey}`);
    console.log(`   Generated mnemonic visual for: "${meaning}"`);
    if (validImage) {
      console.log(`   ✨ Image passed AI validation with confidence: ${validationResult.confidence}`);
    } else if (validationResult) {
      console.log(`   ⚠️ Image has potential issues: ${validationResult.issues.join(', ')}`);
    }
    
    // Return secure API endpoint - strip 'media/' prefix for cleaner URLs
    const imagePath = imageKey.replace('media/', '');
    // Add timestamp to bust browser cache when force regenerating
    const imageUrl = force 
      ? `/api/media/${imagePath}?t=${Date.now()}`
      : `/api/media/${imagePath}`;
    console.log(`   Access URL: ${imageUrl}`);
    
    return { imageUrl, cached: false, prompt };
  } catch (error: any) {
    console.error('Shared image generation error:', error);
    // Log detailed error information for debugging
    if (error.status === 422 && error.body?.detail) {
      console.error('Validation error details:', JSON.stringify(error.body.detail, null, 2));
    }
    return { imageUrl: '', cached: false, prompt: undefined };
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