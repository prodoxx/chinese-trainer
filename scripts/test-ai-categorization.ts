import { generateImageSearchQuery } from '../src/lib/enrichment/openai-query';

const testCharacters = [
  // Grammatical particles
  { hanzi: '的', meaning: 'possessive particle', pinyin: 'de' },
  { hanzi: '了', meaning: 'completed action marker', pinyin: 'le' },
  
  // Pronouns
  { hanzi: '我', meaning: 'I, me', pinyin: 'wǒ' },
  { hanzi: '你', meaning: 'you', pinyin: 'nǐ' },
  
  // Concrete objects
  { hanzi: '山', meaning: 'mountain', pinyin: 'shān' },
  { hanzi: '書', meaning: 'book', pinyin: 'shū' },
  { hanzi: '水', meaning: 'water', pinyin: 'shuǐ' },
  
  // Actions
  { hanzi: '吃', meaning: 'to eat', pinyin: 'chī' },
  { hanzi: '跑', meaning: 'to run', pinyin: 'pǎo' },
  { hanzi: '看', meaning: 'to look, to see', pinyin: 'kàn' },
  
  // Emotions
  { hanzi: '愛', meaning: 'love, to love', pinyin: 'ài' },
  { hanzi: '怕', meaning: 'to fear, afraid', pinyin: 'pà' },
  
  // Abstract qualities
  { hanzi: '大', meaning: 'big, large', pinyin: 'dà' },
  { hanzi: '快', meaning: 'fast, quick', pinyin: 'kuài' },
  { hanzi: '好', meaning: 'good', pinyin: 'hǎo' },
];

async function testAICategorization() {
  console.log('Testing AI Categorization of Chinese Characters\n');
  console.log('=' . repeat(50));
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OpenAI API key not configured');
    console.log('The system will use fallback logic for abstract concepts');
    console.log('=' . repeat(50));
  }
  
  for (const char of testCharacters) {
    console.log(`\n${char.hanzi} (${char.pinyin}) - ${char.meaning}`);
    const query = await generateImageSearchQuery(char.hanzi, char.meaning, char.pinyin);
    console.log(`→ Search query: "${query}"`);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' . repeat(50));
  console.log('AI automatically categorized each character type!');
}

testAICategorization().catch(console.error);