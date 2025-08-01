/**
 * Script to generate demo media files (audio and images) for flash session demo
 * Run with: npx tsx scripts/generate-demo-media.ts
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config()

import { generateTTSAudioR2 } from '@/lib/enrichment/azure-tts-r2'
import { generateDALLEImageR2 } from '@/lib/enrichment/openai-dalle-r2'

// Override the bucket name for static demo media
const STATIC_BUCKET = 'danbing-static-media'

// Custom R2 client for static bucket
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import OpenAI from "openai";

const staticR2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Custom functions for demo media generation
async function uploadToStaticR2(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: STATIC_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      type: 'demo-media',
      generatedAt: new Date().toISOString(),
    }
  });

  await staticR2Client.send(command);
  return `https://static.danbing.ai/${key}`;
}

async function generateDemoTTS(text: string, filename: string): Promise<string> {
  try {
    // Generate TTS using Azure
    const voice = 'zh-TW-HsiaoChenNeural';
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
        <voice name="${voice}">
          <prosody rate="-10%" pitch="0%">
            ${text}
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
      throw new Error(`Azure TTS error: ${response.status}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const url = await uploadToStaticR2(filename, audioBuffer, 'audio/mpeg');
    return url;
  } catch (error) {
    console.error('TTS generation error:', error);
    return '';
  }
}

async function generateDemoImage(hanzi: string, prompt: string, filename: string): Promise<string> {
  try {
    if (!openai) {
      throw new Error('OpenAI not configured');
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural",
    });

    const tempImageUrl = response.data?.[0]?.url;
    if (!tempImageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    // Download and upload to static R2
    const imageResponse = await fetch(tempImageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const url = await uploadToStaticR2(filename, imageBuffer, 'image/png');
    return url;
  } catch (error) {
    console.error('Image generation error:', error);
    return '';
  }
}

interface DemoCharacter {
  hanzi: string
  pinyin: string
  meaning: string
  imagePrompt: string
}

const DEMO_CHARACTERS: DemoCharacter[] = [
  {
    hanzi: '大',
    pinyin: 'dà',
    meaning: 'big, large',
    imagePrompt: 'Simple illustration representing "big, large". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Show a large elephant next to a tiny mouse for size comparison. Cartoon or minimalist style, educational context.'
  },
  {
    hanzi: '小',
    pinyin: 'xiǎo', 
    meaning: 'small, little',
    imagePrompt: 'Simple illustration representing "small, little". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Show a tiny ladybug on a large leaf. Cartoon or minimalist style, educational context.'
  },
  {
    hanzi: '人',
    pinyin: 'rén',
    meaning: 'person, people',
    imagePrompt: 'Simple illustration representing "person, people". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. If depicting a person, show a representation including East Asian, Hispanic, White, or Black individual only - one person only. No South Asian/Indian people. Cartoon or minimalist style, educational context.'
  },
  // Additional characters for quiz options
  {
    hanzi: '太',
    pinyin: 'tài',
    meaning: 'too, extremely',
    imagePrompt: 'Simple illustration representing "too, extremely". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Show an overflowing cup with water spilling out. Cartoon or minimalist style, educational context.'
  },
  {
    hanzi: '天',
    pinyin: 'tiān',
    meaning: 'sky, heaven',
    imagePrompt: 'Simple illustration representing "sky, heaven". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Show a blue sky with white fluffy clouds and sun. Cartoon or minimalist style, educational context.'
  },
  {
    hanzi: '少',
    pinyin: 'shǎo',
    meaning: 'few, little',
    imagePrompt: 'Simple illustration representing "few, little". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Show a jar with only 3 candies inside. Cartoon or minimalist style, educational context.'
  },
  {
    hanzi: '水',
    pinyin: 'shuǐ',
    meaning: 'water',
    imagePrompt: 'Simple illustration representing "water". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Show a glass of water with water droplets. Cartoon or minimalist style, educational context.'
  },
  {
    hanzi: '入',
    pinyin: 'rù',
    meaning: 'enter',
    imagePrompt: 'Simple illustration representing "enter". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Show an open door with an arrow pointing inside. Cartoon or minimalist style, educational context.'
  },
  {
    hanzi: '八',
    pinyin: 'bā',
    meaning: 'eight',
    imagePrompt: 'Simple illustration representing "eight". CRITICAL: ABSOLUTELY NO TEXT, words, letters, numbers, labels, captions, signs, or written characters anywhere in the image. Show 8 colorful balloons floating. Cartoon or minimalist style, educational context.'
  }
]

async function generateDemoMedia() {
  console.log('🎵 Generating demo media files...')
  
  // Debug: Check if API keys are loaded
  console.log('🔍 Environment check:')
  console.log(`AZURE_TTS_KEY: ${process.env.AZURE_TTS_KEY ? 'SET (' + process.env.AZURE_TTS_KEY.substring(0, 8) + '...)' : 'NOT SET'}`)
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET (' + process.env.OPENAI_API_KEY.substring(0, 8) + '...)' : 'NOT SET'}`)
  console.log(`R2_ACCOUNT_ID: ${process.env.R2_ACCOUNT_ID ? 'SET (' + process.env.R2_ACCOUNT_ID.substring(0, 8) + '...)' : 'NOT SET'}`)
  console.log('')
  
  // Add option to skip already generated characters
  const skipCharacters = process.argv.includes('--skip-existing') 
    ? ['大', '小', '人', '太', '天'] 
    : [];
  
  // Force regenerate specific characters only
  const regenerateOnly = process.argv.includes('--regenerate-only')
    ? null  // Regenerate all when not specified
    : null;
  
  // Option to only regenerate images
  const imagesOnly = process.argv.includes('--images-only');

  for (const char of DEMO_CHARACTERS) {
    // Skip if using regenerateOnly and character not in list
    if (regenerateOnly && !regenerateOnly.includes(char.hanzi)) {
      console.log(`⏭️  Skipping character not in regenerate list: ${char.hanzi}`)
      continue;
    }
    
    if (skipCharacters.includes(char.hanzi)) {
      console.log(`⏭️  Skipping already generated character: ${char.hanzi}`)
      continue;
    }
    
    console.log(`\n📝 Processing character: ${char.hanzi} (${char.pinyin})`)
    
    try {
      // Generate TTS audio directly to static bucket (unless images only)
      if (!imagesOnly) {
        console.log('🔊 Generating TTS audio...')
        const audioUrl = await generateDemoTTS(
          char.hanzi, 
          `demo-deck/demo-${char.hanzi}/audio.mp3`
        )
        
        if (audioUrl) {
          console.log(`✅ Audio: generated - ${audioUrl}`)
        } else {
          console.log('❌ Audio generation failed')
        }
      }
      
      // Generate DALL-E image directly to static bucket
      console.log('🖼️  Generating DALL-E image...')
      const imageUrl = await generateDemoImage(
        char.hanzi,
        char.imagePrompt,
        `demo-deck/demo-${char.hanzi}/image.png`
      )
      
      if (imageUrl) {
        console.log(`✅ Image: generated - ${imageUrl}`)
      } else {
        console.log('❌ Image generation failed')
      }
      
      // Small delay between characters to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`❌ Error processing ${char.hanzi}:`, error)
    }
  }
  
  console.log('\n🎉 Demo media generation complete!')
  console.log('\nGenerated URLs will be in format:')
  console.log('Audio: https://static.danbing.ai/demo-deck/demo-[character]/audio.mp3')
  console.log('Images: https://static.danbing.ai/demo-deck/demo-[character]/image.png')
}

// Check if this script is being run directly
if (require.main === module) {
  generateDemoMedia().catch(console.error)
}

export { generateDemoMedia, DEMO_CHARACTERS }