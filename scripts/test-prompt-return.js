#!/usr/bin/env node

/**
 * Test script to verify that functions return prompts without database
 * Usage: bun run scripts/test-prompt-return.js
 */

import { interpretChinese } from '../src/lib/enrichment/openai-interpret.js';
import { analyzeCharacterWithOpenAI } from '../src/lib/analytics/openai-linguistic-analysis.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testPromptReturn() {
  try {
    // Test character
    const testCharacter = '學';
    console.log(`📝 Testing with character: ${testCharacter}\n`);

    // Test OpenAI interpretation
    console.log('1️⃣ Testing OpenAI interpretation...');
    try {
      const interpretation = await interpretChinese(testCharacter);
      console.log('   ✓ Meaning:', interpretation.meaning);
      console.log('   ✓ Pinyin:', interpretation.pinyin);
      console.log('   ✓ Context:', interpretation.context || 'N/A');
      console.log('   ✓ Image Prompt:', interpretation.imagePrompt ? 'Present' : 'Missing');
      console.log('   ✓ Interpretation Prompt:', interpretation.interpretationPrompt ? 'Present' : 'Missing');
      
      if (interpretation.interpretationPrompt) {
        console.log('   ✓ Prompt length:', interpretation.interpretationPrompt.length, 'characters');
        console.log('\n📋 Sample of interpretation prompt:');
        console.log('   ', interpretation.interpretationPrompt.substring(0, 150) + '...\n');
      } else {
        console.log('   ❌ interpretationPrompt field is missing!\n');
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
      console.log('   ℹ️ This might be due to OpenAI API key issues\n');
    }

    // Test linguistic analysis
    console.log('2️⃣ Testing linguistic analysis...');
    try {
      const analysis = await analyzeCharacterWithOpenAI(testCharacter);
      console.log('   ✓ Analysis completed');
      console.log('   ✓ Etymology:', analysis.etymology ? 'Present' : 'Missing');
      console.log('   ✓ Mnemonics:', analysis.mnemonics ? 'Present' : 'Missing');
      console.log('   ✓ Usage:', analysis.usage ? 'Present' : 'Missing');
      console.log('   ✓ Linguistic Analysis Prompt:', analysis.linguisticAnalysisPrompt ? 'Present' : 'Missing');
      
      if (analysis.linguisticAnalysisPrompt) {
        console.log('   ✓ Prompt length:', analysis.linguisticAnalysisPrompt.length, 'characters');
        console.log('\n📋 Sample of linguistic analysis prompt:');
        console.log('   ', analysis.linguisticAnalysisPrompt.substring(0, 150) + '...\n');
      } else {
        console.log('   ❌ linguisticAnalysisPrompt field is missing!\n');
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
      console.log('   ℹ️ This might be due to OpenAI API key issues or dictionary database\n');
    }

    console.log('✅ Test complete! Check above for results.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPromptReturn();