#!/usr/bin/env bun

/**
 * Quick consistency test for confusion generation
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

const NUM_ITERATIONS = 3;

async function quickTest() {
  console.log('='.repeat(60));
  console.log('QUICK CONSISTENCY TEST - OpenAI Confusion Generation');
  console.log('='.repeat(60));
  console.log(`Testing ${TEST_CASES.length} characters × ${NUM_ITERATIONS} iterations\n`);
  
  const results: Record<string, any[]> = {};
  let totalSelfReferences = 0;
  let totalComponents = 0;
  let totalTests = 0;
  
  for (const test of TEST_CASES) {
    console.log(`\n📝 ${test.character} (${test.pinyin}) - "${test.meaning}"`);
    results[test.character] = [];
    
    for (let i = 1; i <= NUM_ITERATIONS; i++) {
      process.stdout.write(`  Run ${i}: `);
      
      try {
        const analysis = await analyzeCharacterComprehensively(
          test.character,
          test.pinyin,
          test.meaning
        );
        
        totalTests++;
        
        // Check for issues
        const hasSelfRef = analysis.commonConfusions.some(c => c.character === test.character);
        const hasComponents = test.character.length > 1 && 
          analysis.commonConfusions.some(c => 
            c.character.length === 1 && test.character.includes(c.character)
          );
        
        if (hasSelfRef) {
          totalSelfReferences++;
          console.log(`❌ SELF-REFERENCE!`);
        } else if (hasComponents) {
          totalComponents++;
          console.log(`⚠️  Has components`);
        } else {
          console.log(`✅`);
        }
        
        // Store confusions for consistency check
        const confusionList = analysis.commonConfusions
          .map(c => c.character)
          .sort()
          .join(', ');
        
        console.log(`     Confusions: [${confusionList}]`);
        results[test.character].push(confusionList);
        
      } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check consistency
    const unique = new Set(results[test.character]);
    if (unique.size === 1) {
      console.log(`  ✅ Consistent across all runs`);
    } else {
      console.log(`  ⚠️  ${unique.size} variations found`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${totalTests}`);
  console.log(`Self-references: ${totalSelfReferences} (${(totalSelfReferences/totalTests*100).toFixed(0)}%)`);
  console.log(`Component issues: ${totalComponents} (${(totalComponents/totalTests*100).toFixed(0)}%)`);
  
  if (totalSelfReferences === 0) {
    console.log('\n✅ PERFECT: No self-references detected!');
  } else {
    console.log('\n❌ ISSUE: Self-references were found');
  }
  
  // Consistency check
  let consistent = 0;
  for (const [char, runs] of Object.entries(results)) {
    if (new Set(runs).size === 1) consistent++;
  }
  
  console.log(`Consistency: ${consistent}/${TEST_CASES.length} characters always gave same results`);
  console.log('='.repeat(60));
}

quickTest().catch(console.error);