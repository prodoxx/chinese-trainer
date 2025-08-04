import mongoose from 'mongoose';
import { searchForImage } from '../src/lib/enrichment/unified-image-search';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/danbing';

const testCharacters = [
  { hanzi: '愛', meaning: 'to love', pinyin: 'ài' },
  { hanzi: '學', meaning: 'to learn', pinyin: 'xué' },
  { hanzi: '的', meaning: 'possessive particle', pinyin: 'de' },
  { hanzi: '山', meaning: 'mountain', pinyin: 'shān' },
  { hanzi: '水', meaning: 'water', pinyin: 'shuǐ' },
];

async function testUnifiedSearch() {
  console.log('Testing Unified Image Search\n');
  console.log('API Keys configured:');
  console.log(`- OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`- Unsplash: ${process.env.UNSPLASH_ACCESS_KEY ? '✅' : '❌'}`);
  console.log(`- Pexels: ${process.env.PEXELS_API_KEY ? '✅' : '❌'}`);
  console.log('\n');

  await mongoose.connect(MONGODB_URI);

  for (const char of testCharacters) {
    console.log(`Testing ${char.hanzi} (${char.meaning})...`);
    
    const image = await searchForImage(char.hanzi, char.meaning, char.pinyin);
    
    console.log(`  Source: ${image.source}`);
    console.log(`  URL: ${image.url.substring(0, 50)}...`);
    console.log(`  Attribution: ${image.attribution}`);
    console.log('');
    
    // Small delay between searches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await mongoose.connection.close();
  console.log('Test complete!');
}

testUnifiedSearch().catch(console.error);