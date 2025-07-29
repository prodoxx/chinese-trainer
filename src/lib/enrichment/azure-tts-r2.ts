import crypto from 'crypto';
import { uploadToR2, existsInR2, generateMediaKeys } from '@/lib/r2-storage';

// Azure Cognitive Services Text-to-Speech configuration
const AZURE_TTS_KEY = process.env.AZURE_TTS_KEY;
const AZURE_TTS_REGION = process.env.AZURE_TTS_REGION || 'eastasia';
const AZURE_TTS_ENDPOINT = `https://${AZURE_TTS_REGION}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;
const AZURE_TTS_SYNTHESIS_ENDPOINT = `https://${AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

// Voice configuration for Traditional Chinese (Taiwan)
const VOICE_NAME = 'zh-TW-HsiaoChenNeural'; // Female voice
// Alternative voices available: 'zh-TW-YunJheNeural' (Male), 'zh-TW-HsiaoYuNeural' (Female)

export interface TTSResult {
  audioUrl: string;
  cached: boolean;
}

/**
 * Generate speech audio using Azure TTS
 */
async function generateSpeech(text: string, voice: string): Promise<Buffer> {
  if (!AZURE_TTS_KEY) {
    throw new Error('Azure TTS API key not configured');
  }

  // SSML for better pronunciation control
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
      <voice name="${voice}">
        <prosody rate="-10%" pitch="0%">
          ${text}
        </prosody>
      </voice>
    </speak>
  `.trim();

  const response = await fetch(AZURE_TTS_SYNTHESIS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_TTS_KEY,
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
  return Buffer.from(audioData);
}

/**
 * Generate TTS audio for Chinese text and store in R2
 */
export async function generateTTSAudioR2(
  text: string,
  deckId: string,
  cardId: string
): Promise<TTSResult> {
  try {
    const { audio: audioKey } = generateMediaKeys(deckId, cardId);
    
    // Check if audio already exists in R2
    const exists = await existsInR2(audioKey);
    if (exists) {
      const audioUrl = `${process.env.R2_PUBLIC_URL}/${audioKey}`;
      return { audioUrl, cached: true };
    }
    
    // Generate new audio
    const voice = VOICE_NAME;
    const audioBuffer = await generateSpeech(text, voice);
    
    // Upload to R2
    const audioUrl = await uploadToR2(audioKey, audioBuffer, {
      contentType: 'audio/mpeg',
      metadata: {
        text,
        voice,
        generatedAt: new Date().toISOString(),
      }
    });
    
    return { audioUrl, cached: false };
  } catch (error) {
    console.error('TTS generation error:', error);
    // Return empty URL on error - app can handle missing audio gracefully
    return { audioUrl: '', cached: false };
  }
}

/**
 * Batch generate TTS audio for multiple texts
 */
export async function batchGenerateTTSR2(
  texts: Array<{ text: string; deckId: string; cardId: string }>
): Promise<Map<string, TTSResult>> {
  const results = new Map<string, TTSResult>();
  
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const result = await generateTTSAudioR2(item.text, item.deckId, item.cardId);
        return { text: item.text, result };
      })
    );
    
    batchResults.forEach(({ text, result }) => {
      results.set(text, result);
    });
    
    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}