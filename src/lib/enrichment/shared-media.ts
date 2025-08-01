/**
 * Shared media generation functions that reuse media across all cards with the same hanzi
 */

import { uploadToR2, existsInR2, deleteFromR2, generateMediaKeysByHanzi } from '@/lib/r2-storage';
import OpenAI from 'openai';

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
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured");
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
    
    // Create an intelligent prompt that focuses solely on the English meaning
    const meaningLower = meaning.toLowerCase();
    
    // Generate dynamic prompt using AI interpretation
    let prompt = '';
    
    try {
      // Use our existing OpenAI interpretation to get a better image prompt
      const interpretation = await interpretChinese(hanzi);
      if (interpretation && interpretation.imagePrompt) {
        // Use the AI-generated image prompt with DALL-E 3 prefix to prevent revision
        prompt = `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: ${interpretation.imagePrompt} CRITICAL: Absolutely no text, words, letters, numbers, or written characters anywhere in the image.`;
        console.log(`Using AI-generated image prompt for ${hanzi}: "${meaning}"`);
      } else {
        throw new Error('No AI image prompt available');
      }
    } catch (error) {
      // Fallback to dynamic prompt generation
      console.log(`Falling back to dynamic prompt generation for: "${meaning}"`);
      
      // Create intelligent prompt based on meaning type with DALL-E 3 prefix
      let basePrompt = '';
      if (meaningLower.match(/\b(feel|emotion|mood|sad|happy|angry|excited|calm|nervous|proud)\b/)) {
        basePrompt = `Simple cartoon illustration of a person clearly showing the emotion "${meaning}" through facial expression and body language. No text, words, or letters anywhere in the image. Educational style, clean background.`;
      } else if (meaningLower.match(/\b(action|move|run|walk|jump|sit|stand|dance|work)\b/)) {
        basePrompt = `Simple cartoon illustration of a person performing the action "${meaning}" with clear movement. No text, words, or letters anywhere in the image. Educational style, clean background.`;
      } else if (meaningLower.match(/\b(size|big|small|large|tiny|huge|little)\b/)) {
        basePrompt = `Simple cartoon illustration showing "${meaning}" through clear size comparison or visual representation. No text, words, or letters anywhere in the image. Educational style, clean background.`;
      } else if (meaningLower.match(/\b(quality|good|bad|beautiful|ugly|clean|dirty|new|old)\b/)) {
        basePrompt = `Simple cartoon illustration clearly demonstrating the quality "${meaning}" through visual comparison or obvious characteristics. No text, words, or letters anywhere in the image. Educational style, clean background.`;
      } else {
        // Generic but dynamic approach
        basePrompt = `Simple cartoon illustration that clearly and obviously represents "${meaning}" through visual elements, expressions, or actions that any student would immediately understand. No text, words, letters, or written characters anywhere in the image. Educational style, clean background.`;
      }
      
      // Add DALL-E 3 prefix to prevent automatic revision
      prompt = `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: ${basePrompt}`;
    }
    
    console.log(`Generating shared DALL-E image for ${hanzi} with meaning: "${meaning}" and pinyin: "${pinyin}"`);
    console.log(`Generated prompt: ${prompt}`);
    console.log(`Image will be stored at: ${imageKey}`);
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Alternative prompt strategies if the main one fails
    const alternativePrompts = [
      // Strategy 1: Ultra minimal approach
      `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: Minimalist line drawing showing "${meaning}" concept through simple visual elements. No text anywhere. Clean style.`,
      
      // Strategy 2: Focus on symbolic representation
      `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: Simple symbol or icon representing "${meaning}". No words, letters, or text. Educational illustration.`,
      
      // Strategy 3: Object-focused approach  
      `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: Basic objects that represent "${meaning}". No text, words, or letters. Simple cartoon style.`
    ];
    
    let response;
    let attempt = 0;
    const maxAttempts = 1; // Start with just the main attempt for now
    
    while (attempt < maxAttempts) {
      try {
        const currentPrompt = attempt === 0 ? prompt : alternativePrompts[Math.min(attempt - 1, alternativePrompts.length - 1)];
        
        console.log(`   Attempt ${attempt + 1}: Using ${attempt === 0 ? 'main' : 'alternative'} prompt strategy`);
        
        // Generate image with DALL-E 3 (latest widely available model)
        response = await openai.images.generate({
          model: "dall-e-3", // Latest widely available model (GPT-image-1 is limited access)
          prompt: currentPrompt,
          n: 1,
          size: "1024x1024", // Cheapest DALL-E 3 option
          quality: "standard", // Standard vs HD for cost savings
          style: "natural", // More realistic than "vivid" style
        });
        
        break; // Success, exit retry loop
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw error;
        }
        console.log(`   Attempt ${attempt} failed, trying alternative approach...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay between attempts
      }
    }

    const dalleImageUrl = response.data[0]?.url;
    if (!dalleImageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    // Download and upload to R2
    const imageResponse = await fetch(dalleImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Upload to R2 with minimal metadata to avoid signature issues
    await uploadToR2(imageKey, Buffer.from(imageBuffer), {
      contentType: 'image/jpeg',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'dalle',
      }
    });
    
    console.log(`✅ Image uploaded successfully to: ${imageKey}`);
    console.log(`   Generated from prompt focusing on: "${meaning}"`);
    
    // Return secure API endpoint - strip 'media/' prefix for cleaner URLs
    const imagePath = imageKey.replace('media/', '');
    // Add timestamp to bust browser cache when force regenerating
    const imageUrl = force 
      ? `/api/media/${imagePath}?t=${Date.now()}`
      : `/api/media/${imagePath}`;
    console.log(`   Access URL: ${imageUrl}`);
    
    return { imageUrl, cached: false };
  } catch (error) {
    console.error('Shared image generation error:', error);
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