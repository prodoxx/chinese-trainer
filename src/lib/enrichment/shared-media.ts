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
    
    // Build a comprehensive prompt that ensures correct interpretation
    let prompt = `Create an educational illustration that accurately represents ONLY this specific meaning: "${meaning}". `;
    
    // Add specific instructions based on what type of concept it might be
    if (meaningLower.match(/\b(person|people|human|man|woman|child)\b/) || 
        meaningLower.match(/\b(feel|feeling|emotion|state)\b/) ||
        meaningLower.match(/ing\b/) || // likely an action or state
        meaningLower.match(/ed\b/)) {   // likely a state or condition
      prompt += `If this involves a person, show them clearly demonstrating this concept through appropriate facial expressions, body language, or actions. `;
    }
    
    // Add clarification to avoid ambiguity
    prompt += `Focus exclusively on visualizing "${meaning}" without any alternative interpretations. Make the meaning immediately obvious to a language learner. `;
    
    // Add style instructions
    prompt += `Use a simple, clear cartoon style suitable for educational flashcards. If showing people, depict one person only (East Asian, Hispanic, White, or Black individual). Avoid complex scenes or multiple interpretations.`;
    
    // Add explicit instruction to ignore any other possible meanings
    prompt += ` IMPORTANT: This image must represent "${meaning}" and nothing else.`;
    
    console.log(`Generating shared DALL-E image for ${hanzi} with meaning: "${meaning}" and pinyin: "${pinyin}"`);
    console.log(`Generated prompt: ${prompt}`);
    console.log(`Image will be stored at: ${imageKey}`);
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

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