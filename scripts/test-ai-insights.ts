#!/usr/bin/env bun
/**
 * Test script to verify AI insights generation
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { analyzeCharacterWithAI } from '../src/lib/ai/ai-provider';

async function testAIInsights() {
  console.log('🧪 Testing AI Insights Generation\n');
  
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Test character
    const testCharacter = '房間';
    
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not configured in .env file');
      console.log('Please add your OpenAI API key to the .env file:');
      console.log('OPENAI_API_KEY=your-key-here\n');
      process.exit(1);
    }
    console.log('✅ OpenAI API key is configured\n');
    
    // Test AI provider
    console.log(`Testing AI insights generation for: ${testCharacter}`);
    console.log('-------------------------------------------');
    
    const aiConfig = {
      provider: 'openai' as const,
      enabled: true
    };
    
    console.log('📋 AI Config:', aiConfig);
    console.log('\nGenerating AI insights...\n');
    
    const startTime = Date.now();
    const insights = await analyzeCharacterWithAI(testCharacter, aiConfig);
    const duration = Date.now() - startTime;
    
    console.log(`✅ AI insights generated in ${duration}ms\n`);
    
    // Display insights
    console.log('📊 AI Insights Summary:');
    console.log('-------------------------------------------');
    console.log('Etymology:', insights.etymology ? '✓' : '✗');
    console.log('  - Origin:', insights.etymology?.origin ? insights.etymology.origin.substring(0, 50) + '...' : 'N/A');
    console.log('\nMnemonics:', insights.mnemonics ? '✓' : '✗');
    console.log('  - Visual:', insights.mnemonics?.visual ? insights.mnemonics.visual.substring(0, 50) + '...' : 'N/A');
    console.log('  - Story:', insights.mnemonics?.story ? insights.mnemonics.story.substring(0, 50) + '...' : 'N/A');
    console.log('\nLearning Tips:', insights.learningTips ? '✓' : '✗');
    console.log('  - For Beginners:', insights.learningTips?.forBeginners?.length || 0, 'tips');
    console.log('\nCommon Errors:', insights.commonErrors ? '✓' : '✗');
    console.log('  - Similar Characters:', insights.commonErrors?.similarCharacters?.length || 0);
    console.log('\nUsage:', insights.usage ? '✓' : '✗');
    console.log('  - Register Level:', insights.usage?.registerLevel || 'N/A');
    console.log('  - Frequency:', insights.usage?.frequency || 'N/A');
    
    // Test saving to database
    console.log('\n-------------------------------------------');
    console.log('Testing database save...\n');
    
    // Find or create a test card
    let card = await Card.findOne({ hanzi: testCharacter });
    if (!card) {
      console.log('Creating test card...');
      card = new Card({
        hanzi: testCharacter,
        pinyin: 'fángjiān',
        meaning: 'room',
      });
    }
    
    // Save AI insights
    card.aiInsights = insights;
    card.aiInsightsGeneratedAt = new Date();
    await card.save();
    
    console.log('✅ AI insights saved to database');
    
    // Verify save
    const savedCard = await Card.findOne({ hanzi: testCharacter });
    if (savedCard?.aiInsights) {
      console.log('✅ Verified: AI insights are persisted in database');
      console.log(`   Generated at: ${savedCard.aiInsightsGeneratedAt}`);
    } else {
      console.error('❌ Failed to verify AI insights in database');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    if (error instanceof Error) {
      console.error('\nError details:');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
  
  console.log('\n✅ All tests passed!');
  process.exit(0);
}

// Run the test
testAIInsights();