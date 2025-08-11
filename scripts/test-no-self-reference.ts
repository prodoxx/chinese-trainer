#!/usr/bin/env bun

/**
 * Simple test to verify no self-references in confusion generation
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
  { character: '書', pinyin: 'shū', meaning: 'book' },
  { character: '水', pinyin: 'shuǐ', meaning: 'water' },
  { character: '老師', pinyin: 'lǎo shī', meaning: 'teacher' },
];

async function verifyNoSelfReferences() {
  console.log('='.repeat(60));
  console.log('SELF-REFERENCE VERIFICATION TEST');
  console.log('='.repeat(60));
  console.log('Testing that characters never include themselves in confusions\n');
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  
  for (const test of TEST_CASES) {
    process.stdout.write(`Testing ${test.character} (${test.pinyin})... `);
    
    try {
      const analysis = await analyzeCharacterComprehensively(
        test.character,
        test.pinyin,
        test.meaning
      );
      
      // Check for self-reference
      const hasSelfRef = analysis.commonConfusions.some(
        c => c.character === test.character
      );
      
      // Check for components in multi-char words
      const hasComponents = test.character.length > 1 && 
        analysis.commonConfusions.some(c => 
          c.character.length === 1 && test.character.includes(c.character)
        );
      
      if (hasSelfRef) {
        console.log('❌ FAILED - includes itself!');
        failed++;
        console.log(`  Found: ${analysis.commonConfusions.map(c => c.character).join(', ')}`);
      } else if (hasComponents) {
        console.log('⚠️  WARNING - includes components');
        warnings++;
        console.log(`  Found: ${analysis.commonConfusions.map(c => c.character).join(', ')}`);
        passed++; // Still counts as passed
      } else {
        console.log('✅ PASSED');
        passed++;
        console.log(`  Confusions: ${analysis.commonConfusions.map(c => c.character).join(', ')}`);
      }
      
    } catch (error: any) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
    }
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`Failed: ${failed}/${TEST_CASES.length}`);
  console.log(`Warnings: ${warnings}/${TEST_CASES.length}`);
  
  if (failed === 0) {
    console.log('\n✅ SUCCESS: No characters included themselves!');
  } else {
    console.log('\n❌ FAILURE: Some characters included themselves');
  }
  
  if (warnings > 0) {
    console.log('⚠️  Note: Some multi-character words showed their components');
    console.log('   This may be intentional for teaching purposes');
  }
  
  console.log('='.repeat(60));
}

verifyNoSelfReferences().catch(console.error);