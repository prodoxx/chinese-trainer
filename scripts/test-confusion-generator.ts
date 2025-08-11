#!/usr/bin/env bun

/**
 * Test the focused confusion generator directly
 */

import dotenv from 'dotenv';
import { generateConfusions } from '../src/lib/analytics/ollama-confusion-generator';
import { validateOllamaServer } from '../src/lib/analytics/ollama-linguistic-analysis';

dotenv.config();

const TEST_CASES = [
  { character: '房間', pinyin: 'fáng jiān', meaning: 'room' },
  { character: '朋友', pinyin: 'péng yǒu', meaning: 'friend' },
  { character: '大', pinyin: 'dà', meaning: 'big' },
];

async function testConfusionGenerator() {
  console.log('=== Testing Focused Confusion Generator ===\n');
  
  // First check if Ollama is available
  const validation = await validateOllamaServer();
  if (!validation.available) {
    console.error('❌ Ollama server is not available:', validation.error);
    console.log('\nPlease ensure Ollama is running with the gpt-oss:20b model:');
    console.log('  ollama serve');
    console.log('  ollama pull gpt-oss:20b');
    return;
  }
  
  console.log('✅ Ollama server is available\n');
  
  for (const test of TEST_CASES) {
    console.log(`\n📝 Testing: ${test.character} (${test.pinyin}) - "${test.meaning}"`);
    console.log('-' .repeat(50));
    
    try {
      const confusions = await generateConfusions(
        test.character,
        test.pinyin,
        test.meaning
      );
      
      if (confusions.length > 0) {
        console.log(`✅ Generated ${confusions.length} confusions:`);
        confusions.forEach((conf, idx) => {
          console.log(`\n   ${idx + 1}. ${conf.character} (${conf.pinyin || 'no pinyin'})`);
          console.log(`      Reason: ${conf.reason}`);
          console.log(`      Similarity: ${(conf.similarity * 100).toFixed(0)}%`);
          
          // Validate
          if (test.character.length > 1) {
            const isComponent = test.character.includes(conf.character) && conf.character.length === 1;
            if (isComponent) {
              console.log(`      ❌ ERROR: Component character!`);
            } else {
              console.log(`      ✅ Valid confusion`);
            }
          }
        });
      } else {
        console.log('❌ No confusions generated');
      }
      
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('Test complete!\n');
}

testConfusionGenerator().catch(console.error);