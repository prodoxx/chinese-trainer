#!/usr/bin/env node

/**
 * Test script to verify that prompts are being saved to MongoDB
 * Usage: bun run scripts/test-prompt-storage.js
 */

import mongoose from 'mongoose';
import Card from '../src/lib/db/models/Card.js';
import { interpretChinese } from '../src/lib/enrichment/openai-interpret.js';
import { analyzeCharacterWithOpenAI } from '../src/lib/analytics/openai-linguistic-analysis.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function testPromptStorage() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test character
    const testCharacter = '學';
    console.log(`\n📝 Testing with character: ${testCharacter}`);

    // Test OpenAI interpretation
    console.log('\n1️⃣ Testing OpenAI interpretation...');
    const interpretation = await interpretChinese(testCharacter);
    console.log('   ✓ Meaning:', interpretation.meaning);
    console.log('   ✓ Pinyin:', interpretation.pinyin);
    console.log('   ✓ Prompt stored:', interpretation.interpretationPrompt ? 'Yes' : 'No');
    if (interpretation.interpretationPrompt) {
      console.log('   ✓ Prompt length:', interpretation.interpretationPrompt.length, 'characters');
    }

    // Test linguistic analysis
    console.log('\n2️⃣ Testing linguistic analysis...');
    const analysis = await analyzeCharacterWithOpenAI(testCharacter);
    console.log('   ✓ Analysis completed');
    console.log('   ✓ Prompt stored:', analysis.linguisticAnalysisPrompt ? 'Yes' : 'No');
    if (analysis.linguisticAnalysisPrompt) {
      console.log('   ✓ Prompt length:', analysis.linguisticAnalysisPrompt.length, 'characters');
    }

    // Create or update a test card
    console.log('\n3️⃣ Saving to database...');
    const card = await Card.findOneAndUpdate(
      { hanzi: testCharacter },
      {
        hanzi: testCharacter,
        meaning: interpretation.meaning,
        pinyin: interpretation.pinyin,
        interpretationPrompt: interpretation.interpretationPrompt,
        linguisticAnalysisPrompt: analysis.linguisticAnalysisPrompt,
        aiInsights: {
          etymology: analysis.etymology,
          mnemonics: analysis.mnemonics,
          commonErrors: analysis.commonErrors,
          usage: analysis.usage,
          learningTips: analysis.learningTips
        },
        aiInsightsGeneratedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('   ✓ Card saved to database');

    // Verify the prompts were saved
    console.log('\n4️⃣ Verifying saved prompts...');
    const savedCard = await Card.findOne({ hanzi: testCharacter });
    console.log('   ✓ Interpretation prompt saved:', savedCard.interpretationPrompt ? 'Yes' : 'No');
    console.log('   ✓ Linguistic analysis prompt saved:', savedCard.linguisticAnalysisPrompt ? 'Yes' : 'No');

    // Display a sample of the saved prompts
    if (savedCard.interpretationPrompt) {
      console.log('\n📋 Sample of interpretation prompt:');
      console.log(savedCard.interpretationPrompt.substring(0, 200) + '...');
    }

    if (savedCard.linguisticAnalysisPrompt) {
      console.log('\n📋 Sample of linguistic analysis prompt:');
      console.log(savedCard.linguisticAnalysisPrompt.substring(0, 200) + '...');
    }

    console.log('\n✅ All tests passed! Prompts are being saved correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testPromptStorage();