#!/usr/bin/env bun

/**
 * Test OpenAI confusion generation consistency across multiple runs
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
  { character: '火', pinyin: 'huǒ', meaning: 'fire' },
  { character: '老師', pinyin: 'lǎo shī', meaning: 'teacher' },
  { character: '電腦', pinyin: 'diàn nǎo', meaning: 'computer' },
  { character: '手機', pinyin: 'shǒu jī', meaning: 'mobile phone' },
  { character: '天', pinyin: 'tiān', meaning: 'sky, day' },
  { character: '地', pinyin: 'dì', meaning: 'earth, ground' },
  { character: '人', pinyin: 'rén', meaning: 'person' },
  { character: '中國', pinyin: 'zhōng guó', meaning: 'China' },
];

const NUM_ITERATIONS = 5; // Run each test 5 times

interface TestResult {
  character: string;
  iteration: number;
  confusions: Array<{
    character: string;
    reason: string;
    similarity: number;
  }>;
  hasSelfReference: boolean;
  hasComponents: boolean;
  time: number;
}

async function testCharacter(
  character: string,
  pinyin: string,
  meaning: string,
  iteration: number
): Promise<TestResult> {
  const startTime = Date.now();
  
  const analysis = await analyzeCharacterComprehensively(character, pinyin, meaning);
  
  const result: TestResult = {
    character,
    iteration,
    confusions: analysis.commonConfusions,
    hasSelfReference: false,
    hasComponents: false,
    time: Date.now() - startTime,
  };
  
  // Check for self-references
  result.hasSelfReference = analysis.commonConfusions.some(
    conf => conf.character === character
  );
  
  // Check for component characters in multi-character words
  if (character.length > 1) {
    const components = character.split('');
    result.hasComponents = analysis.commonConfusions.some(
      conf => conf.character.length === 1 && components.includes(conf.character)
    );
  }
  
  return result;
}

async function runConsistencyTests() {
  console.log('='.repeat(70));
  console.log('OPENAI CONFUSION GENERATION CONSISTENCY TEST');
  console.log('='.repeat(70));
  console.log(`Testing ${TEST_CASES.length} characters × ${NUM_ITERATIONS} iterations each`);
  console.log(`Total tests: ${TEST_CASES.length * NUM_ITERATIONS}\n`);
  
  const allResults: Record<string, TestResult[]> = {};
  let totalTests = 0;
  let failedTests = 0;
  let totalTime = 0;
  
  for (const testCase of TEST_CASES) {
    console.log(`\nTesting: ${testCase.character} (${testCase.pinyin}) - "${testCase.meaning}"`);
    console.log('-'.repeat(50));
    
    const results: TestResult[] = [];
    
    for (let i = 1; i <= NUM_ITERATIONS; i++) {
      process.stdout.write(`  Iteration ${i}...`);
      
      try {
        const result = await testCharacter(
          testCase.character,
          testCase.pinyin,
          testCase.meaning,
          i
        );
        
        results.push(result);
        totalTests++;
        totalTime += result.time;
        
        if (result.hasSelfReference) {
          console.log(` ❌ SELF-REFERENCE FOUND!`);
          failedTests++;
        } else if (result.hasComponents) {
          console.log(` ⚠️  Has components (${result.confusions.length} confusions, ${result.time}ms)`);
        } else {
          console.log(` ✅ (${result.confusions.length} confusions, ${result.time}ms)`);
        }
      } catch (error: any) {
        console.log(` ❌ Error: ${error.message}`);
        failedTests++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    allResults[testCase.character] = results;
    
    // Analyze consistency for this character
    const confusionSets = results.map(r => 
      r.confusions.map(c => c.character).sort().join(',')
    );
    const uniqueSets = new Set(confusionSets);
    
    if (uniqueSets.size === 1) {
      console.log(`  ✅ CONSISTENT: Same confusions across all iterations`);
      console.log(`     Confusions: [${results[0].confusions.map(c => c.character).join(', ')}]`);
    } else {
      console.log(`  ⚠️  VARIATION: ${uniqueSets.size} different confusion sets found`);
      uniqueSets.forEach((set, idx) => {
        const count = confusionSets.filter(s => s === set).length;
        console.log(`     Set ${idx + 1}: [${set}] (${count}/${NUM_ITERATIONS} times)`);
      });
    }
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY STATISTICS');
  console.log('='.repeat(70));
  
  console.log(`\nTotal tests run: ${totalTests}`);
  console.log(`Failed tests (self-reference): ${failedTests}`);
  console.log(`Success rate: ${((totalTests - failedTests) / totalTests * 100).toFixed(1)}%`);
  console.log(`Average response time: ${Math.round(totalTime / totalTests)}ms`);
  
  // Consistency analysis
  let fullyConsistent = 0;
  let partiallyConsistent = 0;
  let inconsistent = 0;
  
  for (const [char, results] of Object.entries(allResults)) {
    const confusionSets = results.map(r => 
      r.confusions.map(c => c.character).sort().join(',')
    );
    const uniqueSets = new Set(confusionSets);
    
    if (uniqueSets.size === 1) {
      fullyConsistent++;
    } else if (uniqueSets.size <= 2) {
      partiallyConsistent++;
    } else {
      inconsistent++;
    }
  }
  
  console.log(`\nConsistency Analysis:`);
  console.log(`  Fully consistent (same every time): ${fullyConsistent}/${TEST_CASES.length}`);
  console.log(`  Partially consistent (1-2 variations): ${partiallyConsistent}/${TEST_CASES.length}`);
  console.log(`  Inconsistent (3+ variations): ${inconsistent}/${TEST_CASES.length}`);
  
  // Self-reference analysis
  const charactersWithSelfRef: string[] = [];
  const charactersWithComponents: string[] = [];
  
  for (const [char, results] of Object.entries(allResults)) {
    if (results.some(r => r.hasSelfReference)) {
      charactersWithSelfRef.push(char);
    }
    if (results.some(r => r.hasComponents)) {
      charactersWithComponents.push(char);
    }
  }
  
  console.log(`\nQuality Analysis:`);
  if (charactersWithSelfRef.length === 0) {
    console.log(`  ✅ EXCELLENT: No self-references detected in any test!`);
  } else {
    console.log(`  ❌ PROBLEMS: Self-references found in: ${charactersWithSelfRef.join(', ')}`);
  }
  
  if (charactersWithComponents.length > 0) {
    console.log(`  ⚠️  Component characters found in: ${charactersWithComponents.join(', ')}`);
    console.log(`     (This may be intentional for some teaching purposes)`);
  }
  
  // Final verdict
  console.log('\n' + '='.repeat(70));
  if (failedTests === 0 && fullyConsistent >= TEST_CASES.length * 0.7) {
    console.log('✅ EXCELLENT RESULTS: High quality and consistency!');
  } else if (failedTests === 0) {
    console.log('✅ GOOD RESULTS: No failures, some variation is normal');
  } else {
    console.log('❌ NEEDS ATTENTION: Self-references detected');
  }
  console.log('='.repeat(70));
}

// Run the tests
runConsistencyTests().catch(console.error);