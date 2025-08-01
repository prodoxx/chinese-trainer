/**
 * Script to create placeholder demo media files
 * This creates simple placeholder files that can be uploaded to R2
 * Once API keys are configured, run generate-demo-media.ts for real content
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const DEMO_CHARACTERS = [
  { hanzi: '大', pinyin: 'dà', meaning: 'big, large' },
  { hanzi: '小', pinyin: 'xiǎo', meaning: 'small, little' }, 
  { hanzi: '人', pinyin: 'rén', meaning: 'person, people' }
]

async function createPlaceholderFiles() {
  console.log('📁 Creating placeholder demo files...')
  
  const outputDir = join(process.cwd(), 'demo-media-placeholders')
  
  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }
  
  for (const char of DEMO_CHARACTERS) {
    console.log(`\n📝 Creating placeholders for: ${char.hanzi} (${char.pinyin})`)
    
    const charDir = join(outputDir, `demo-${char.hanzi}`)
    if (!existsSync(charDir)) {
      mkdirSync(charDir, { recursive: true })
    }
    
    // Create audio placeholder (empty MP3 file)
    const audioPath = join(charDir, 'audio.mp3')
    // Create a minimal valid MP3 header (silent audio)
    const mp3Header = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, 0x00, 0x03, 0x48, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ])
    writeFileSync(audioPath, mp3Header)
    console.log(`✅ Created audio placeholder: ${audioPath}`)
    
    // Create image placeholder (1x1 PNG)
    const imagePath = join(charDir, 'image.png')
    // Minimal 1x1 transparent PNG
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ])
    writeFileSync(imagePath, pngData)
    console.log(`✅ Created image placeholder: ${imagePath}`)
  }
  
  console.log(`\n🎉 Placeholder files created in: ${outputDir}`)
  console.log('\n📤 Next steps:')
  console.log('1. Upload these files to your R2 bucket at the correct paths:')
  console.log('   - demo-deck/demo-大/audio.mp3 & image.png')
  console.log('   - demo-deck/demo-小/audio.mp3 & image.png') 
  console.log('   - demo-deck/demo-人/audio.mp3 & image.png')
  console.log('2. Set up API keys in .env file')
  console.log('3. Run generate-demo-media.ts to replace with real content')
}

// Check if this script is being run directly
if (require.main === module) {
  createPlaceholderFiles().catch(console.error)
}

export { createPlaceholderFiles }