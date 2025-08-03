/**
 * Script to create local demo audio files for development
 * This creates silent MP3 files that won't have CORS issues
 * Run with: npx tsx scripts/create-local-demo-audio.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const DEMO_CHARACTERS = [
  { hanzi: '大', pinyin: 'dà', meaning: 'big, large' },
  { hanzi: '小', pinyin: 'xiǎo', meaning: 'small, little' }, 
  { hanzi: '人', pinyin: 'rén', meaning: 'person, people' },
  // Additional characters for quiz options
  { hanzi: '太', pinyin: 'tài', meaning: 'too/extremely' },
  { hanzi: '天', pinyin: 'tiān', meaning: 'sky/heaven' },
  { hanzi: '少', pinyin: 'shǎo', meaning: 'few/little' },
  { hanzi: '水', pinyin: 'shuǐ', meaning: 'water' },
  { hanzi: '入', pinyin: 'rù', meaning: 'enter' },
  { hanzi: '八', pinyin: 'bā', meaning: 'eight' }
]

// Create a basic silent MP3 file (valid MP3 header with silence)
function createSilentMp3(): Buffer {
  // This is a minimal valid MP3 file with 0.5 seconds of silence
  // MP3 header + silent frame data
  const mp3Data = Buffer.from([
    // ID3v2 header
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    
    // MP3 frame header (MPEG-1 Layer III, 128 kbps, 44.1 kHz, stereo)
    0xFF, 0xFB, 0x90, 0x00,
    
    // Silent audio data (zeros)
    ...new Array(417).fill(0x00),
    
    // Additional MP3 frames for 0.5 seconds of silence
    0xFF, 0xFB, 0x90, 0x00,
    ...new Array(417).fill(0x00),
    
    0xFF, 0xFB, 0x90, 0x00,
    ...new Array(417).fill(0x00),
    
    0xFF, 0xFB, 0x90, 0x00,
    ...new Array(417).fill(0x00),
    
    0xFF, 0xFB, 0x90, 0x00,
    ...new Array(417).fill(0x00)
  ])
  
  return mp3Data
}

async function createLocalDemoAudio() {
  console.log('🎵 Creating local demo audio files...')
  
  const publicDir = join(process.cwd(), 'public', 'demo-deck')
  
  // Create public/demo-deck directory
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true })
  }
  
  for (const char of DEMO_CHARACTERS) {
    console.log(`\n📝 Creating audio for: ${char.hanzi} (${char.pinyin})`)
    
    const charDir = join(publicDir, `demo-${char.hanzi}`)
    if (!existsSync(charDir)) {
      mkdirSync(charDir, { recursive: true })
    }
    
    // Create audio file
    const audioPath = join(charDir, 'audio.mp3')
    const mp3Buffer = createSilentMp3()
    writeFileSync(audioPath, mp3Buffer)
    console.log(`✅ Created audio file: ${audioPath}`)
  }
  
  console.log(`\n🎉 Local demo audio files created in: ${publicDir}`)
  console.log('\n📌 These files will be served from /demo-deck/ without CORS issues')
}

// Run the script
if (require.main === module) {
  createLocalDemoAudio().catch(console.error)
}

export { createLocalDemoAudio }