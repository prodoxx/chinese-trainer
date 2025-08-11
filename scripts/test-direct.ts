#!/usr/bin/env bun

/**
 * Direct test of confusion generation
 */

import dotenv from 'dotenv';
import { analyzeCharacterComprehensively } from '../src/lib/analytics/openai-linguistic-analysis';

dotenv.config();

async function testCharacter(character: string, pinyin: string, meaning: string) {
  console.log(`\nTesting: ${character} (${pinyin}) - "${meaning}"`);
  console.log('-'.repeat(40));
  
  try {
    const result = await analyzeCharacterComprehensively(character, pinyin, meaning);
    
    console.log(`Found ${result.commonConfusions.length} confusions:`);
    
    let hasSelfReference = false;
    
    result.commonConfusions.forEach((conf, idx) => {
      const isSelf = conf.character === character;
      if (isSelf) hasSelfReference = true;
      
      console.log(`${idx + 1}. ${conf.character}`);
      console.log(`   Reason: ${conf.reason}`);
      console.log(`   Status: ${isSelf ? '❌ SELF-REFERENCE!' : '✅ OK'}`);
    });
    
    console.log(`\nResult: ${hasSelfReference ? '❌ FAILED' : '✅ PASSED'}`);
    
    return !hasSelfReference;
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('DIRECT CONFUSION GENERATION TEST');
  console.log('='.repeat(50));
  
  const tests = [
    { character: '筆', pinyin: 'bǐ', meaning: 'pen, brush' },
    { character: '大', pinyin: 'dà', meaning: 'big' },
    { character: '房間', pinyin: 'fáng jiān', meaning: 'room' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const success = await testCharacter(test.character, test.pinyin, test.meaning);
    if (success) passed++;
    else failed++;
    
    // Delay
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`FINAL: Passed ${passed}/${tests.length}, Failed ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('✅ SUCCESS: No self-references!');
  } else {
    console.log('❌ FAILURE: Self-references detected');
  }
  console.log('='.repeat(50));
}

main().catch(console.error);