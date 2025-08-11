#!/usr/bin/env bun

/**
 * Test the improved confusion generation to ensure characters never include themselves
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
];

async function testConfusionGeneration() {
  console.log('=== Testing Improved Confusion Generation ===\n');
  console.log('This test verifies that characters NEVER include themselves in confusions\n');
  
  // Check if Ollama is available
  const ollamaAvailable = await validateOllamaServer();
  if (!ollamaAvailable.available) {
    console.log('⚠️ Ollama is not available, will only test OpenAI');
  }
  
  let allTestsPassed = true;
  
  for (const test of TEST_CASES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${test.character} (${test.pinyin}) - "${test.meaning}"`);
    console.log('='.repeat(60));
    
    // Test OpenAI
    console.log('\n📘 OpenAI Results:');
    try {
      const openAIResult = await analyzeWithOpenAI(
        test.character,
        test.pinyin,
        test.meaning
      );
      
      console.log(`  Found ${openAIResult.commonConfusions.length} confusions:`);
      
      let openAIPass = true;
      openAIResult.commonConfusions.forEach((conf, idx) => {
        const isSelf = conf.character === test.character;
        const isComponent = test.character.length > 1 && 
                          conf.character.length === 1 && 
                          test.character.includes(conf.character);
        
        const status = isSelf ? '❌ FAIL (self-reference)' : 
                      isComponent ? '⚠️ WARN (component)' : 
                      '✅ PASS';
        
        console.log(`  ${idx + 1}. ${conf.character} - ${conf.reason}`);
        console.log(`     Similarity: ${(conf.similarity * 100).toFixed(0)}%`);
        console.log(`     Status: ${status}`);
        
        if (isSelf) {
          openAIPass = false;
          allTestsPassed = false;
        }
      });
      
      if (openAIPass) {
        console.log('  ✅ OpenAI: All checks passed');
      } else {
        console.log('  ❌ OpenAI: Failed - character includes itself');
      }
      
      // Check if prompts were saved
      if (openAIResult.comprehensiveAnalysisPrompt) {
        console.log('  ✅ Comprehensive analysis prompt saved');
      }
      
    } catch (error: any) {
      console.error(`  ❌ OpenAI Error: ${error.message}`);
      allTestsPassed = false;
    }
    
    // Test Ollama if available
    if (ollamaAvailable.available) {
      console.log('\n📙 Ollama Results:');
      try {
        const ollamaResult = await analyzeWithOllama(
          test.character,
          test.pinyin,
          test.meaning
        );
        
        console.log(`  Found ${ollamaResult.commonConfusions.length} confusions:`);
        
        let ollamaPass = true;
        ollamaResult.commonConfusions.forEach((conf, idx) => {
          const isSelf = conf.character === test.character;
          const isComponent = test.character.length > 1 && 
                            conf.character.length === 1 && 
                            test.character.includes(conf.character);
          
          const status = isSelf ? '❌ FAIL (self-reference)' : 
                        isComponent ? '⚠️ WARN (component)' : 
                        '✅ PASS';
          
          console.log(`  ${idx + 1}. ${conf.character} - ${conf.reason}`);
          console.log(`     Similarity: ${(conf.similarity * 100).toFixed(0)}%`);
          console.log(`     Status: ${status}`);
          
          if (isSelf) {
            ollamaPass = false;
            allTestsPassed = false;
          }
        });
        
        if (ollamaPass) {
          console.log('  ✅ Ollama: All checks passed');
        } else {
          console.log('  ❌ Ollama: Failed - character includes itself');
        }
        
        // Check if prompts were saved
        if (ollamaResult.comprehensiveAnalysisPrompt) {
          console.log('  ✅ Comprehensive analysis prompt saved');
        }
        if (ollamaResult.confusionGenerationPrompt) {
          console.log('  ✅ Confusion generation prompt saved');
        }
        
      } catch (error: any) {
        console.error(`  ❌ Ollama Error: ${error.message}`);
        allTestsPassed = false;
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED - No characters include themselves in confusions');
  } else {
    console.log('❌ SOME TESTS FAILED - Characters are including themselves in confusions');
  }
  console.log('='.repeat(60) + '\n');
}

testConfusionGeneration().catch(console.error);