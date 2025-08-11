#!/usr/bin/env bun

/**
 * Test OpenAI confusion generation to ensure characters never include themselves
 */

import dotenv from 'dotenv';
import { analyzeCharacterComprehensively } from '../src/lib/analytics/openai-linguistic-analysis';

dotenv.config();

const TEST_CASES = [
  { character: '筆', pinyin: 'bǐ', meaning: 'pen, brush' },
  { character: '房間', pinyin: 'fáng jiān', meaning: 'room' },
  { character: '朋友', pinyin: 'péng yǒu', meaning: 'friend' },
  { character: '大', pinyin: 'dà', meaning: 'big' },
  { character: '學生', pinyin: 'xué shēng', meaning: 'student' },
];

async function testOpenAIConfusion() {
  console.log('=== Testing OpenAI Confusion Generation ===\n');
  console.log('Verifying that characters NEVER include themselves in confusions\n');
  
  let allTestsPassed = true;
  
  for (const test of TEST_CASES) {
    console.log(`\nTesting: ${test.character} (${test.pinyin}) - "${test.meaning}"`);
    console.log('-'.repeat(50));
    
    try {
      const result = await analyzeCharacterComprehensively(
        test.character,
        test.pinyin,
        test.meaning
      );
      
      console.log(`Found ${result.commonConfusions.length} confusions:`);
      
      let testPassed = true;
      result.commonConfusions.forEach((conf, idx) => {
        const isSelf = conf.character === test.character;
        const isComponent = test.character.length > 1 && 
                          conf.character.length === 1 && 
                          test.character.includes(conf.character);
        
        console.log(`${idx + 1}. ${conf.character}`);
        console.log(`   Reason: ${conf.reason}`);
        console.log(`   Similarity: ${(conf.similarity * 100).toFixed(0)}%`);
        
        if (isSelf) {
          console.log(`   ❌ FAIL: Character includes itself!`);
          testPassed = false;
          allTestsPassed = false;
        } else if (isComponent) {
          console.log(`   ⚠️ WARNING: Component character (may be intentional)`);
        } else {
          console.log(`   ✅ PASS: Valid confusion`);
        }
      });
      
      if (testPassed) {
        console.log(`✅ ${test.character}: PASSED - No self-references`);
      } else {
        console.log(`❌ ${test.character}: FAILED - Contains self-reference`);
      }
      
      if (result.comprehensiveAnalysisPrompt) {
        console.log('✅ Prompt was saved');
      }
      
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      allTestsPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('No characters included themselves in their confusion lists');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('Some characters incorrectly included themselves');
  }
  console.log('='.repeat(50) + '\n');
}

testOpenAIConfusion().catch(console.error);