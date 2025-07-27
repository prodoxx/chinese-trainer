import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import crypto from 'crypto';

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
 * Generate a cache key for TTS audio
 */
function generateCacheKey(text: string, voice: string): string {
  return crypto.createHash('md5').update(`${text}-${voice}`).digest('hex');
}

/**
 * Check if audio exists in GridFS cache
 */
async function checkAudioCache(bucket: mongoose.mongo.GridFSBucket, cacheKey: string): Promise<string | null> {
  try {
    const files = await bucket.find({ filename: `tts_${cacheKey}.mp3` }).toArray();
    if (files.length > 0) {
      return `/api/audio/${files[0]._id}`;
    }
  } catch (error) {
    console.error('Error checking audio cache:', error);
  }
  return null;
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
 * Store audio in GridFS
 */
async function storeAudioInGridFS(
  bucket: mongoose.mongo.GridFSBucket, 
  audioBuffer: Buffer, 
  cacheKey: string
): Promise<string> {
  const filename = `tts_${cacheKey}.mp3`;
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: 'audio/mpeg',
      metadata: {
        type: 'tts',
        cacheKey,
        createdAt: new Date()
      }
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(`/api/audio/${uploadStream.id}`);
    });

    uploadStream.write(audioBuffer);
    uploadStream.end();
  });
}

/**
 * Generate TTS audio for Chinese text
 */
export async function generateTTSAudio(text: string): Promise<TTSResult> {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'audio' });
    
    // Use primary voice
    const voice = VOICE_NAME;
    const cacheKey = generateCacheKey(text, voice);
    
    // Check cache first
    const cachedUrl = await checkAudioCache(bucket, cacheKey);
    if (cachedUrl) {
      return { audioUrl: cachedUrl, cached: true };
    }
    
    // Generate new audio
    const audioBuffer = await generateSpeech(text, voice);
    
    // Store in GridFS
    const audioUrl = await storeAudioInGridFS(bucket, audioBuffer, cacheKey);
    
    return { audioUrl, cached: false };
  } catch (error) {
    console.error('TTS generation error:', error);
    // Return null URL on error - app can handle missing audio gracefully
    return { audioUrl: '', cached: false };
  }
}

/**
 * Batch generate TTS audio for multiple texts
 */
export async function batchGenerateTTS(texts: string[]): Promise<Map<string, TTSResult>> {
  const results = new Map<string, TTSResult>();
  
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (text) => {
        const result = await generateTTSAudio(text);
        return { text, result };
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