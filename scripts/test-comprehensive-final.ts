#!/usr/bin/env bun

/**
 * Comprehensive final test for confusion generation
 */

import dotenv from 'dotenv';
import { analyzeCharacterComprehensively } from '../src/lib/analytics/openai-linguistic-analysis';

dotenv.config();

const TEST_SUITE = [
  // Single characters
  { character: '筆', pinyin: 'bǐ', meaning: 'pen, brush', type: 'single' },
  { character: '大', pinyin: 'dà', meaning: 'big', type: 'single' },
  { character: '水', pinyin: 'shuǐ', meaning: 'water', type: 'single' },
  { character: '火', pinyin: 'huǒ', meaning: 'fire', type: 'single' },
  { character: '書', pinyin: 'shū', meaning: 'book', type: 'single' },
  
  // Multi-character words
  { character: '房間', pinyin: 'fáng jiān', meaning: 'room', type: 'multi' },
  { character: '朋友', pinyin: 'péng yǒu', meaning: 'friend', type: 'multi' },
  { character: '學生', pinyin: 'xué shēng', meaning: 'student', type: 'multi' },
  { character: '老師', pinyin: 'lǎo shī', meaning: 'teacher', type: 'multi' },
  { character: '電腦', pinyin: 'diàn nǎo', meaning: 'computer', type: 'multi' },
];

interface TestResult {
  character: string;
  type: string;
  passed: boolean;
  hasSelfReference: boolean;
  hasComponents: boolean;
  confusionCount: number;
  confusions: string[];
  error?: string;
}

async function testOne(test: any): Promise<TestResult> {
  const result: TestResult = {
    character: test.character,
    type: test.type,
    passed: true,
    hasSelfReference: false,
    hasComponents: false,
    confusionCount: 0,
    confusions: []
  };
  
  try {
    const analysis = await analyzeCharacterComprehensively(
      test.character,
      test.pinyin,
      test.meaning
    );
    
    result.confusionCount = analysis.commonConfusions.length;
    result.confusions = analysis.commonConfusions.map(c => c.character);
    
    // Check for self-reference
    result.hasSelfReference = analysis.commonConfusions.some(
      c => c.character === test.character
    );
    
    // Check for components in multi-character words
    if (test.type === 'multi') {
      const components = test.character.split('');
      result.hasComponents = analysis.commonConfusions.some(
        c => c.character.length === 1 && components.includes(c.character)
      );
    }
    
    result.passed = !result.hasSelfReference;
    
  } catch (error: any) {
    result.error = error.message;
    result.passed = false;
  }
  
  return result;
}

async function runComprehensiveTest() {
  console.log('='.repeat(70));
  console.log('COMPREHENSIVE CONFUSION GENERATION TEST');
  console.log('='.repeat(70));
  console.log(`Testing ${TEST_SUITE.length} characters (${TEST_SUITE.filter(t => t.type === 'single').length} single, ${TEST_SUITE.filter(t => t.type === 'multi').length} multi)\n`);
  
  const results: TestResult[] = [];
  
  for (const test of TEST_SUITE) {
    process.stdout.write(`${test.character} (${test.type})... `);
    
    const result = await testOne(test);
    results.push(result);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else if (result.hasSelfReference) {
      console.log(`❌ SELF-REF [${result.confusions.join(', ')}]`);
    } else if (result.hasComponents) {
      console.log(`⚠️  Components [${result.confusions.join(', ')}]`);
    } else {
      console.log(`✅ [${result.confusions.join(', ')}]`);
    }
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Analysis
  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS');
  console.log('='.repeat(70));
  
  const singleResults = results.filter(r => r.type === 'single');
  const multiResults = results.filter(r => r.type === 'multi');
  
  console.log('\nSingle Characters:');
  console.log(`  Total: ${singleResults.length}`);
  console.log(`  Passed: ${singleResults.filter(r => r.passed).length}`);
  console.log(`  Self-refs: ${singleResults.filter(r => r.hasSelfReference).length}`);
  console.log(`  Avg confusions: ${(singleResults.reduce((sum, r) => sum + r.confusionCount, 0) / singleResults.length).toFixed(1)}`);
  
  console.log('\nMulti-Character Words:');
  console.log(`  Total: ${multiResults.length}`);
  console.log(`  Passed: ${multiResults.filter(r => r.passed).length}`);
  console.log(`  Self-refs: ${multiResults.filter(r => r.hasSelfReference).length}`);
  console.log(`  Components: ${multiResults.filter(r => r.hasComponents).length}`);
  console.log(`  Avg confusions: ${(multiResults.reduce((sum, r) => sum + r.confusionCount, 0) / multiResults.length).toFixed(1)}`);
  
  const totalPassed = results.filter(r => r.passed).length;
  const totalSelfRefs = results.filter(r => r.hasSelfReference).length;
  
  console.log('\nOverall:');
  console.log(`  Success rate: ${(totalPassed / results.length * 100).toFixed(0)}%`);
  console.log(`  Self-reference rate: ${(totalSelfRefs / results.length * 100).toFixed(0)}%`);
  
  // Final verdict
  console.log('\n' + '='.repeat(70));
  if (totalSelfRefs === 0) {
    console.log('✅ PERFECT: No self-references detected!');
    console.log('The confusion generation is working correctly.');
  } else {
    console.log(`❌ ISSUES: ${totalSelfRefs} self-references detected`);
    const problemChars = results.filter(r => r.hasSelfReference).map(r => r.character);
    console.log(`Problem characters: ${problemChars.join(', ')}`);
  }
  
  if (multiResults.some(r => r.hasComponents)) {
    const componentChars = multiResults.filter(r => r.hasComponents).map(r => r.character);
    console.log(`\n⚠️  Note: Component characters found in: ${componentChars.join(', ')}`);
    console.log('This may be intentional for teaching purposes.');
  }
  
  console.log('='.repeat(70));
}

runComprehensiveTest().catch(console.error);