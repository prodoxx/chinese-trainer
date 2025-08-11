#!/usr/bin/env bun

/**
 * Final verification test with timeout handling
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

async function testWithTimeout(
  character: string,
  pinyin: string,
  meaning: string,
  timeoutMs: number = 10000
): Promise<{ success: boolean; confusions?: any[]; error?: string }> {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  
  try {
    const result = await Promise.race([
      analyzeCharacterComprehensively(character, pinyin, meaning),
      timeoutPromise
    ]) as any;
    
    return { success: true, confusions: result.commonConfusions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function runFinalTest() {
  console.log('='.repeat(60));
  console.log('FINAL VERIFICATION - No Self-References');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const test of TEST_CASES) {
    console.log(`\n${test.character} (${test.pinyin}) - "${test.meaning}"`);
    
    // Run 2 iterations to check consistency
    for (let i = 1; i <= 2; i++) {
      process.stdout.write(`  Attempt ${i}: `);
      
      const result = await testWithTimeout(
        test.character,
        test.pinyin,
        test.meaning,
        10000
      );
      
      if (!result.success) {
        console.log(`❌ ${result.error}`);
      } else {
        const hasSelfRef = result.confusions?.some(
          c => c.character === test.character
        );
        
        if (hasSelfRef) {
          console.log('❌ FAILED - includes itself!');
        } else {
          const confList = result.confusions?.map(c => c.character).join(', ');
          console.log(`✅ PASSED [${confList}]`);
        }
        
        results.push({
          character: test.character,
          iteration: i,
          hasSelfRef,
          confusions: result.confusions?.map(c => c.character)
        });
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const totalTests = results.length;
  const failedTests = results.filter(r => r.hasSelfRef).length;
  const successRate = ((totalTests - failedTests) / totalTests * 100).toFixed(0);
  
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${totalTests - failedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success rate: ${successRate}%`);
  
  // Check consistency
  const charGroups: Record<string, string[][]> = {};
  for (const result of results) {
    if (!charGroups[result.character]) charGroups[result.character] = [];
    charGroups[result.character].push(result.confusions || []);
  }
  
  let consistentCount = 0;
  for (const [char, iterations] of Object.entries(charGroups)) {
    if (iterations.length > 1) {
      const first = iterations[0].sort().join(',');
      const second = iterations[1].sort().join(',');
      if (first === second) consistentCount++;
    }
  }
  
  console.log(`Consistency: ${consistentCount}/${TEST_CASES.length} characters gave same results`);
  
  if (failedTests === 0) {
    console.log('\n✅ EXCELLENT: No self-references detected!');
    console.log('The confusion generation is working correctly.');
  } else {
    console.log('\n❌ PROBLEM: Self-references were detected');
  }
  
  console.log('='.repeat(60));
}

runFinalTest().catch(console.error);