#!/usr/bin/env bun

/**
 * Test confusion generation consistency across multiple runs for both providers
 */

import dotenv from 'dotenv';
import { analyzeCharacterComprehensively as analyzeWithOpenAI } from '../src/lib/analytics/openai-linguistic-analysis';
import { analyzeCharacterComprehensively as analyzeWithOllama } from '../src/lib/analytics/ollama-linguistic-analysis';
import { validateOllamaServer } from '../src/lib/analytics/ollama-linguistic-analysis';

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
];

const NUM_ITERATIONS = 3; // Run each test 3 times to check consistency

interface TestResult {
  character: string;
  provider: string;
  iteration: number;
  confusions: string[];
  hasSelfReference: boolean;
  hasComponents: boolean;
  error?: string;
}

async function testProvider(
  provider: 'openai' | 'ollama',
  character: string,
  pinyin: string,
  meaning: string,
  iteration: number
): Promise<TestResult> {
  const result: TestResult = {
    character,
    provider,
    iteration,
    confusions: [],
    hasSelfReference: false,
    hasComponents: false,
  };

  try {
    const analysis = provider === 'openai' 
      ? await analyzeWithOpenAI(character, pinyin, meaning)
      : await analyzeWithOllama(character, pinyin, meaning);

    result.confusions = analysis.commonConfusions.map(c => c.character);
    
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
  } catch (error: any) {
    result.error = error.message;
  }

  return result;
}

async function analyzeResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS SUMMARY');
  console.log('='.repeat(70));

  // Group results by character and provider
  const grouped: Record<string, Record<string, TestResult[]>> = {};
  
  for (const result of results) {
    if (!grouped[result.character]) grouped[result.character] = {};
    if (!grouped[result.character][result.provider]) grouped[result.character][result.provider] = [];
    grouped[result.character][result.provider].push(result);
  }

  let totalTests = 0;
  let failedTests = 0;
  let inconsistentTests = 0;

  for (const [character, providers] of Object.entries(grouped)) {
    console.log(`\n📝 ${character}:`);
    
    for (const [provider, tests] of Object.entries(providers)) {
      totalTests += tests.length;
      
      // Check for failures
      const failures = tests.filter(t => t.hasSelfReference || t.error);
      const componentIssues = tests.filter(t => t.hasComponents);
      
      if (failures.length > 0) {
        failedTests += failures.length;
      }
      
      // Check consistency across iterations
      const confusionSets = tests.map(t => t.confusions.sort().join(','));
      const uniqueSets = new Set(confusionSets);
      const isConsistent = uniqueSets.size === 1 && !tests[0].error;
      
      if (!isConsistent && tests.length > 1) {
        inconsistentTests++;
      }
      
      // Report findings
      const emoji = provider === 'openai' ? '🔵' : '🟠';
      console.log(`  ${emoji} ${provider.toUpperCase()}:`);
      
      if (tests[0].error) {
        console.log(`    ❌ Error: ${tests[0].error}`);
      } else {
        console.log(`    Iterations: ${tests.length}`);
        console.log(`    Self-references: ${failures.length > 0 ? `❌ ${failures.length}` : '✅ None'}`);
        console.log(`    Component issues: ${componentIssues.length > 0 ? `⚠️  ${componentIssues.length}` : '✅ None'}`);
        console.log(`    Consistency: ${isConsistent ? '✅ Consistent' : '⚠️  Varies'}`);
        
        if (!isConsistent) {
          console.log(`    Variations:`);
          uniqueSets.forEach((set, idx) => {
            const count = confusionSets.filter(s => s === set).length;
            console.log(`      ${idx + 1}. [${set || 'none'}] (${count} times)`);
          });
        } else {
          console.log(`    Confusions: [${tests[0].confusions.join(', ') || 'none'}]`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('OVERALL STATISTICS');
  console.log('='.repeat(70));
  console.log(`Total tests run: ${totalTests}`);
  console.log(`Failed tests (self-reference or error): ${failedTests}`);
  console.log(`Inconsistent results: ${inconsistentTests}`);
  
  const successRate = ((totalTests - failedTests) / totalTests * 100).toFixed(1);
  const consistencyRate = ((totalTests - inconsistentTests) / totalTests * 100).toFixed(1);
  
  console.log(`Success rate: ${successRate}%`);
  console.log(`Consistency rate: ${consistencyRate}%`);
  
  if (failedTests === 0) {
    console.log('\n✅ EXCELLENT: No self-references detected!');
  } else {
    console.log('\n❌ ISSUES FOUND: Some tests included self-references');
  }
  
  if (consistencyRate === '100.0') {
    console.log('✅ EXCELLENT: All results are consistent across iterations!');
  } else if (parseFloat(consistencyRate) >= 80) {
    console.log('⚠️  GOOD: Most results are consistent, some variation is normal');
  } else {
    console.log('❌ POOR: High variation in results across iterations');
  }
}

async function runConsistencyTests() {
  console.log('='.repeat(70));
  console.log('CONFUSION GENERATION CONSISTENCY TEST');
  console.log('='.repeat(70));
  console.log(`Testing ${TEST_CASES.length} characters × ${NUM_ITERATIONS} iterations each`);
  console.log(`Total tests per provider: ${TEST_CASES.length * NUM_ITERATIONS}`);
  
  // Check Ollama availability
  const ollamaCheck = await validateOllamaServer();
  const testOllama = ollamaCheck.available;
  
  if (!testOllama) {
    console.log('\n⚠️  Ollama not available - testing OpenAI only');
  } else {
    console.log('\n✅ Both OpenAI and Ollama will be tested');
  }
  
  console.log('\nRunning tests...\n');
  
  const results: TestResult[] = [];
  let completed = 0;
  const total = TEST_CASES.length * NUM_ITERATIONS * (testOllama ? 2 : 1);
  
  for (const testCase of TEST_CASES) {
    console.log(`\nTesting: ${testCase.character} (${testCase.pinyin}) - "${testCase.meaning}"`);
    
    for (let i = 1; i <= NUM_ITERATIONS; i++) {
      // Test OpenAI
      process.stdout.write(`  OpenAI iteration ${i}...`);
      const openaiResult = await testProvider(
        'openai',
        testCase.character,
        testCase.pinyin,
        testCase.meaning,
        i
      );
      results.push(openaiResult);
      completed++;
      
      if (openaiResult.error) {
        console.log(' ❌ Error');
      } else if (openaiResult.hasSelfReference) {
        console.log(' ❌ Self-reference!');
      } else {
        console.log(' ✅');
      }
      
      // Test Ollama if available
      if (testOllama) {
        process.stdout.write(`  Ollama iteration ${i}...`);
        const ollamaResult = await testProvider(
          'ollama',
          testCase.character,
          testCase.pinyin,
          testCase.meaning,
          i
        );
        results.push(ollamaResult);
        completed++;
        
        if (ollamaResult.error) {
          console.log(' ❌ Error');
        } else if (ollamaResult.hasSelfReference) {
          console.log(' ❌ Self-reference!');
        } else {
          console.log(' ✅');
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Progress indicator
    const progress = (completed / total * 100).toFixed(0);
    console.log(`  Progress: ${completed}/${total} (${progress}%)`);
  }
  
  // Analyze results
  await analyzeResults(results);
}

// Run the tests
runConsistencyTests().catch(console.error);