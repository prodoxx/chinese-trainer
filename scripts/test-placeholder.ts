import { searchForImage } from '../src/lib/enrichment/unified-image-search';

// Test with a made-up character that won't have any results
const testChar = { 
  hanzi: '㊣', // Special symbol, not a real character
  meaning: 'special symbol', 
  pinyin: 'test' 
};

async function testPlaceholder() {
  console.log('Testing placeholder fallback...\n');
  
  // Temporarily set env vars to simulate no API keys
  const originalUnsplash = process.env.UNSPLASH_ACCESS_KEY;
  const originalPexels = process.env.PEXELS_API_KEY;
  
  delete process.env.UNSPLASH_ACCESS_KEY;
  delete process.env.PEXELS_API_KEY;
  
  const result = await searchForImage(testChar.hanzi, testChar.meaning, testChar.pinyin);
  
  console.log('Result:');
  console.log(`Source: ${result.source}`);
  console.log(`URL: ${result.url}`);
  
  // Test the URL
  console.log('\nTesting placeholder URL...');
  try {
    const response = await fetch(result.url);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
  } catch (error) {
    console.error('Failed to fetch placeholder:', error);
  }
  
  // Restore env vars
  if (originalUnsplash) process.env.UNSPLASH_ACCESS_KEY = originalUnsplash;
  if (originalPexels) process.env.PEXELS_API_KEY = originalPexels;
}

testPlaceholder().catch(console.error);