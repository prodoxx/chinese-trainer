/**
 * Shared media generation functions that reuse media across all cards with the same hanzi
 */

import { generateTTSAudioR2 } from './azure-tts-r2';
import { generateDALLEImageR2 } from './openai-dalle-r2';
import { uploadToR2, existsInR2, generateMediaKeysByHanzi } from '@/lib/r2-storage';
import { generateSpeech } from './azure-tts-r2';
import openai from './openai-client';

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
      const audioUrl = `${process.env.R2_PUBLIC_URL}/${audioKey}`;
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
    
    // Upload to R2
    const audioUrl = await uploadToR2(audioKey, audioBuffer, {
      contentType: 'audio/mpeg',
      metadata: {
        hanzi,
        voice,
        generatedAt: new Date().toISOString(),
      }
    });
    
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
  meaning: string,
  pinyin: string
): Promise<{ imageUrl: string; cached: boolean }> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured");
    return { imageUrl: '', cached: false };
  }

  try {
    const { image: imageKey } = generateMediaKeysByHanzi(hanzi);
    
    // Check if image already exists
    const exists = await existsInR2(imageKey);
    if (exists) {
      const imageUrl = `${process.env.R2_PUBLIC_URL}/${imageKey}`;
      return { imageUrl, cached: true };
    }
    
    // Generate prompt based on the character
    const prompt = `Simple illustration representing "${meaning}". If depicting a person, show a representation including East Asian, Hispanic, White, or Black individual only - one person only. No South Asian/Indian people. Cartoon or minimalist style, educational context.`;
    
    console.log(`Generating shared DALL-E image for ${hanzi}`);
    
    // Import OpenAI client configuration
    const { default: openaiClient } = await import('./openai-dalle-r2');
    
    // Generate image with DALL-E 3
    const response = await openaiClient.images.generate({
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
    
    const imageUrl = await uploadToR2(imageKey, Buffer.from(imageBuffer), {
      contentType: 'image/jpeg',
      metadata: {
        hanzi,
        meaning,
        pinyin,
        prompt,
        generatedAt: new Date().toISOString(),
      }
    });
    
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