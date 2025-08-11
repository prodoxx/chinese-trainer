#!/usr/bin/env bun

/**
 * Test script to verify that all prompts, results, and provider information
 * are being correctly saved to MongoDB for both OpenAI and Ollama
 */

import dotenv from 'dotenv';
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { interpretChinese as interpretChineseWithProvider } from '../src/lib/ai/ai-provider';
import { analyzeCharacterWithAI } from '../src/lib/ai/ai-provider';
import { generateSharedImage } from '../src/lib/enrichment/shared-media';

dotenv.config();

// Test characters
const TEST_CHARACTERS = [
  { hanzi: '測試一', meaning: 'test one' },
  { hanzi: '測試二', meaning: 'test two' }
];

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  for (const char of TEST_CHARACTERS) {
    await Card.deleteOne({ hanzi: char.hanzi });
  }
  console.log('✓ Test data cleaned');
}

async function createTestCard(hanzi: string, meaning: string) {
  const card = new Card({
    hanzi,
    meaning,
    pinyin: '',
    cached: false
  });
  await card.save();
  return card;
}

async function enrichWithProvider(card: any, provider: 'openai' | 'ollama') {
  console.log(`\n📦 Enriching ${card.hanzi} with ${provider.toUpperCase()}...`);
  
  try {
    // Configure AI provider
    const aiConfig = {
      provider: provider as 'openai' | 'ollama',
      model: provider === 'ollama' ? 'gpt-oss:20b' : undefined,
      enabled: true
    };

    // 1. AI Interpretation
    console.log('   Running interpretation...');
    const interpretation = await interpretChineseWithProvider(card.hanzi, aiConfig, card.meaning);
    
    if (interpretation) {
      card.pinyin = interpretation.pinyin || card.pinyin;
      card.meaning = interpretation.meaning || card.meaning;
      
      // Save interpretation prompt and result
      if (interpretation.interpretationPrompt) {
        card.interpretationPrompt = interpretation.interpretationPrompt;
      }
      
      const providerName = aiConfig.provider === 'ollama' ? 'Ollama GPT-OSS:20b' : 'OpenAI';
      card.interpretationProvider = providerName as 'OpenAI' | 'Ollama GPT-OSS:20b';
      
      card.interpretationResult = {
        meaning: interpretation.meaning || '',
        pinyin: interpretation.pinyin || '',
        context: interpretation.context || '',
        imagePrompt: interpretation.imagePrompt || '',
        provider: providerName,
        timestamp: new Date()
      };
    }

    // 2. Linguistic Analysis
    console.log('   Running linguistic analysis...');
    const aiInsights = await analyzeCharacterWithAI(card.hanzi, aiConfig);
    
    if (aiInsights) {
      card.aiInsights = aiInsights;
      card.aiInsightsGeneratedAt = new Date();
      
      // Save linguistic analysis prompt
      if (aiInsights.linguisticAnalysisPrompt) {
        card.linguisticAnalysisPrompt = aiInsights.linguisticAnalysisPrompt;
      }
      
      const providerName = aiConfig.provider === 'ollama' ? 'Ollama GPT-OSS:20b' : 'OpenAI';
      card.analysisProvider = providerName as 'OpenAI' | 'Ollama GPT-OSS:20b';
      
      card.linguisticAnalysisResult = {
        etymology: aiInsights.etymology,
        mnemonics: aiInsights.mnemonics,
        commonErrors: aiInsights.commonErrors,
        usage: aiInsights.usage,
        learningTips: aiInsights.learningTips,
        provider: providerName,
        timestamp: new Date()
      };
    }

    // 3. Image Generation (with query)
    console.log('   Generating image with query...');
    const imageResult = await generateSharedImage(
      card.hanzi,
      card.meaning,
      card.pinyin,
      true, // force
      undefined,
      provider
    );
    
    if (imageResult.imageUrl) {
      card.imageUrl = imageResult.imageUrl;
      card.imagePath = imageResult.imagePath;
      
      // Save image prompt
      if (imageResult.prompt) {
        card.imagePrompt = imageResult.prompt;
      }
      
      // Save query information
      if (imageResult.queryPrompt) {
        card.imageSearchQueryPrompt = imageResult.queryPrompt;
      }
      
      if (imageResult.queryProvider) {
        const providerName = imageResult.queryProvider;
        card.queryProvider = providerName as 'OpenAI' | 'Ollama GPT-OSS:20b';
        
        card.imageSearchQueryResult = {
          query: imageResult.queryResult || '',
          provider: providerName,
          timestamp: new Date()
        };
      }
    }

    // Save the card
    await card.save();
    console.log(`   ✓ Card enriched and saved`);
    
  } catch (error: any) {
    console.error(`   ✗ Enrichment failed: ${error.message}`);
    throw error;
  }
}

async function verifyStoredData(cardId: string, provider: string) {
  const card = await Card.findById(cardId);
  
  if (!card) {
    console.log('   ✗ Card not found');
    return false;
  }

  console.log(`\n📋 Verifying stored data for ${card.hanzi} (${provider}):`);
  
  let allFieldsPresent = true;
  
  // Check interpretation data
  console.log('\n   Interpretation:');
  if (card.interpretationPrompt) {
    console.log(`   ✓ Prompt saved (${card.interpretationPrompt.substring(0, 50)}...)`);
  } else {
    console.log('   ✗ Prompt NOT saved');
    allFieldsPresent = false;
  }
  
  if (card.interpretationProvider) {
    console.log(`   ✓ Provider: ${card.interpretationProvider}`);
  } else {
    console.log('   ✗ Provider NOT saved');
    allFieldsPresent = false;
  }
  
  if (card.interpretationResult) {
    console.log(`   ✓ Result saved:`);
    console.log(`     - Meaning: ${card.interpretationResult.meaning || 'empty'}`);
    console.log(`     - Pinyin: ${card.interpretationResult.pinyin || 'empty'}`);
    console.log(`     - Context: ${card.interpretationResult.context?.substring(0, 30) || 'empty'}...`);
    console.log(`     - Provider: ${card.interpretationResult.provider}`);
    console.log(`     - Timestamp: ${card.interpretationResult.timestamp}`);
  } else {
    console.log('   ✗ Result NOT saved');
    allFieldsPresent = false;
  }

  // Check linguistic analysis data
  console.log('\n   Linguistic Analysis:');
  if (card.linguisticAnalysisPrompt) {
    console.log(`   ✓ Prompt saved (${card.linguisticAnalysisPrompt.substring(0, 50)}...)`);
  } else {
    console.log('   ✗ Prompt NOT saved');
    allFieldsPresent = false;
  }
  
  if (card.analysisProvider) {
    console.log(`   ✓ Provider: ${card.analysisProvider}`);
  } else {
    console.log('   ✗ Provider NOT saved');
    allFieldsPresent = false;
  }
  
  if (card.linguisticAnalysisResult) {
    console.log(`   ✓ Result saved:`);
    console.log(`     - Etymology: ${card.linguisticAnalysisResult.etymology ? 'present' : 'empty'}`);
    console.log(`     - Mnemonics: ${card.linguisticAnalysisResult.mnemonics ? 'present' : 'empty'}`);
    console.log(`     - Provider: ${card.linguisticAnalysisResult.provider}`);
    console.log(`     - Timestamp: ${card.linguisticAnalysisResult.timestamp}`);
  } else {
    console.log('   ✗ Result NOT saved');
    allFieldsPresent = false;
  }

  // Check image query data
  console.log('\n   Image Query:');
  if (card.imageSearchQueryPrompt) {
    console.log(`   ✓ Prompt saved (${card.imageSearchQueryPrompt.substring(0, 50)}...)`);
  } else {
    console.log('   ✗ Prompt NOT saved');
    allFieldsPresent = false;
  }
  
  if (card.queryProvider) {
    console.log(`   ✓ Provider: ${card.queryProvider}`);
  } else {
    console.log('   ✗ Provider NOT saved');
    allFieldsPresent = false;
  }
  
  if (card.imageSearchQueryResult) {
    console.log(`   ✓ Result saved:`);
    console.log(`     - Query: ${card.imageSearchQueryResult.query?.substring(0, 50) || 'empty'}...`);
    console.log(`     - Provider: ${card.imageSearchQueryResult.provider}`);
    console.log(`     - Timestamp: ${card.imageSearchQueryResult.timestamp}`);
  } else {
    console.log('   ✗ Result NOT saved');
    allFieldsPresent = false;
  }

  // Check image prompt (from interpretation)
  console.log('\n   Image Generation:');
  if (card.imagePrompt) {
    console.log(`   ✓ Image prompt saved (${card.imagePrompt.substring(0, 50)}...)`);
  } else {
    console.log('   ✗ Image prompt NOT saved');
    allFieldsPresent = false;
  }

  return allFieldsPresent;
}

async function testPromptStorage() {
  console.log('=== Testing Prompt and Result Storage ===\n');
  
  try {
    // Connect to database
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Clean up any existing test data
    await cleanupTestData();

    // Test with OpenAI
    console.log('\n📝 Test 1: OpenAI Provider');
    console.log('================================');
    const card1 = await createTestCard(TEST_CHARACTERS[0].hanzi, TEST_CHARACTERS[0].meaning);
    console.log(`✓ Created test card: ${card1.hanzi}`);
    
    try {
      await enrichWithProvider(card1, 'openai');
      const openaiValid = await verifyStoredData(card1._id.toString(), 'OpenAI');
      
      if (openaiValid) {
        console.log('\n✅ OpenAI: All prompts and results saved correctly!');
      } else {
        console.log('\n⚠️ OpenAI: Some fields are missing');
      }
    } catch (error: any) {
      console.error(`\n✗ OpenAI enrichment failed: ${error.message}`);
    }

    // Test with Ollama
    console.log('\n📝 Test 2: Ollama Provider');
    console.log('================================');
    const card2 = await createTestCard(TEST_CHARACTERS[1].hanzi, TEST_CHARACTERS[1].meaning);
    console.log(`✓ Created test card: ${card2.hanzi}`);
    
    try {
      await enrichWithProvider(card2, 'ollama');
      const ollamaValid = await verifyStoredData(card2._id.toString(), 'Ollama');
      
      if (ollamaValid) {
        console.log('\n✅ Ollama: All prompts and results saved correctly!');
      } else {
        console.log('\n⚠️ Ollama: Some fields are missing');
      }
    } catch (error: any) {
      console.error(`\n✗ Ollama enrichment failed: ${error.message}`);
      console.log('   (This is expected if Ollama is not running)');
    }

    // Compare providers
    console.log('\n📊 Summary');
    console.log('================================');
    const [openaiCard, ollamaCard] = await Promise.all([
      Card.findById(card1._id),
      Card.findById(card2._id)
    ]);

    if (openaiCard?.interpretationPrompt && ollamaCard?.interpretationPrompt) {
      const sameInterpretationPrompt = openaiCard.interpretationPrompt === ollamaCard.interpretationPrompt;
      console.log(`Interpretation prompts identical: ${sameInterpretationPrompt ? '✓ Yes' : '✗ No'}`);
    }

    if (openaiCard?.linguisticAnalysisPrompt && ollamaCard?.linguisticAnalysisPrompt) {
      const sameAnalysisPrompt = openaiCard.linguisticAnalysisPrompt === ollamaCard.linguisticAnalysisPrompt;
      console.log(`Analysis prompts identical: ${sameAnalysisPrompt ? '✓ Yes' : '✗ No'}`);
    }

    if (openaiCard?.imageSearchQueryPrompt && ollamaCard?.imageSearchQueryPrompt) {
      const sameQueryPrompt = openaiCard.imageSearchQueryPrompt === ollamaCard.imageSearchQueryPrompt;
      console.log(`Query prompts identical: ${sameQueryPrompt ? '✓ Yes' : '✗ No'}`);
    }

    // Clean up test data
    await cleanupTestData();

  } catch (error: any) {
    console.error('\n✗ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the test
testPromptStorage().catch(console.error);