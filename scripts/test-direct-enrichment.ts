#!/usr/bin/env bun
/**
 * Test enrichment directly without queueing
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import Dictionary from '../src/lib/db/models/Dictionary';
import { generateSharedAudio, generateSharedImage } from '../src/lib/enrichment/shared-media';
import { getPreferredEntry } from '../src/lib/enrichment/multi-pronunciation-handler';
import { convertPinyinToneNumbersToMarks } from '../src/lib/utils/pinyin';
import { interpretChinese as interpretChineseWithProvider } from '../src/lib/ai/ai-provider';
import { analyzeCharacterWithAI } from '../src/lib/ai/ai-provider';
import { getCharacterAnalysisWithCache } from '../src/lib/analytics/character-analysis-service';

async function enrichCard(hanzi: string, meaning: string, testNumber: number) {
  console.log(`\n🧪 Test ${testNumber}: Direct enrichment for "${hanzi}" (${meaning})`);
  console.log('-'.repeat(60));
  
  try {
    await connectDB();
    
    // Step 1: Create test card
    console.log('1️⃣ Creating test card...');
    
    // Delete existing card if it exists
    await Card.deleteOne({ hanzi });
    
    const card = await Card.create({
      hanzi,
      meaning,
      pinyin: '',
      cached: false
    });
    
    console.log(`   ✅ Created card: ${card._id}`);
    console.log(`   Initial AI insights: ${card.aiInsights ? 'EXISTS' : 'NONE'}`);
    
    // Step 2: Dictionary lookup
    console.log('\n2️⃣ Looking up in dictionary...');
    const dictEntries = await Dictionary.find({ traditional: hanzi });
    
    if (dictEntries.length > 0) {
      const selectedEntry = getPreferredEntry(hanzi, dictEntries);
      card.meaning = selectedEntry.definitions[0] || meaning;
      console.log(`   ✅ Found in dictionary: ${card.meaning}`);
    } else {
      console.log(`   ℹ️ Not in dictionary, using provided meaning`);
    }
    
    // Step 3: AI interpretation
    console.log('\n3️⃣ Getting AI interpretation...');
    const aiConfig = {
      provider: 'openai' as 'openai' | 'ollama',
      model: undefined,
      enabled: true
    };
    
    const interpretation = await interpretChineseWithProvider(hanzi, aiConfig);
    
    if (interpretation) {
      card.pinyin = interpretation.pinyin || card.pinyin;
      card.meaning = interpretation.meaning || card.meaning;
      console.log(`   ✅ AI provided: ${card.pinyin} - ${card.meaning}`);
    } else {
      console.log(`   ⚠️ AI interpretation failed`);
    }
    
    // Step 4: Generate AI insights
    console.log('\n4️⃣ Generating AI insights...');
    console.log(`   Current AI insights: ${card.aiInsights ? 'EXISTS' : 'MISSING'}`);
    
    // Check if AI insights have actual content
    const hasValidAIInsights = card.aiInsights && 
      card.aiInsights.etymology?.origin && 
      card.aiInsights.mnemonics?.visual && 
      card.aiInsights.learningTips?.forBeginners?.length > 0;
    
    console.log(`   Valid content check: ${hasValidAIInsights ? 'YES' : 'NO'}`);
    
    if (!hasValidAIInsights) {
      console.log(`   🚀 Starting AI insights generation...`);
      
      try {
        const aiInsights = await analyzeCharacterWithAI(card.hanzi, aiConfig);
        
        console.log(`   ✨ AI insights received:`, {
          hasEtymology: !!aiInsights?.etymology,
          hasMnemonics: !!aiInsights?.mnemonics,
          hasLearningTips: !!aiInsights?.learningTips,
          hasCommonErrors: !!aiInsights?.commonErrors,
          hasUsage: !!aiInsights?.usage
        });
        
        if (aiInsights) {
          card.aiInsights = aiInsights;
          card.aiInsightsGeneratedAt = new Date();
          
          console.log(`   ✅ AI insights generated successfully`);
          
          // Show detailed content
          console.log('\n   📋 Content Check:');
          console.log(`      Etymology origin: ${aiInsights.etymology?.origin ? '✅' : '❌'}`);
          console.log(`      Visual mnemonic: ${aiInsights.mnemonics?.visual ? '✅' : '❌'}`);
          console.log(`      Story mnemonic: ${aiInsights.mnemonics?.story ? '✅' : '❌'}`);
          console.log(`      Component breakdown: ${aiInsights.mnemonics?.components ? '✅' : '❌'}`);
          console.log(`      Beginner tips: ${aiInsights.learningTips?.forBeginners?.length || 0}`);
          console.log(`      Intermediate tips: ${aiInsights.learningTips?.forIntermediate?.length || 0}`);
          console.log(`      Advanced tips: ${aiInsights.learningTips?.forAdvanced?.length || 0}`);
          
          if (aiInsights.mnemonics?.visual) {
            console.log(`\n   📝 Sample visual mnemonic:`);
            console.log(`      "${aiInsights.mnemonics.visual.substring(0, 100)}..."`);
          }
        } else {
          console.log(`   ❌ AI insights generation returned null`);
        }
      } catch (aiError) {
        console.error(`   ❌ AI insights generation failed:`, aiError);
        console.error(`   Error details:`, {
          message: aiError instanceof Error ? aiError.message : 'Unknown error',
          stack: aiError instanceof Error ? aiError.stack?.split('\n')[0] : undefined
        });
      }
    } else {
      console.log(`   ⏭️ Skipping - already has valid AI insights`);
    }
    
    // Step 5: Save card
    console.log('\n5️⃣ Saving card...');
    card.cached = true;
    await card.save();
    
    // Step 6: Verify saved data
    console.log('\n6️⃣ Verifying saved data...');
    const savedCard = await Card.findById(card._id);
    
    if (savedCard) {
      const hasValidSavedInsights = savedCard.aiInsights?.etymology?.origin && 
        savedCard.aiInsights?.mnemonics?.visual && 
        savedCard.aiInsights?.learningTips?.forBeginners?.length > 0;
      
      console.log(`   ${hasValidSavedInsights ? '✅' : '❌'} AI insights saved: ${hasValidSavedInsights ? 'YES' : 'NO'}`);
      console.log(`   ${savedCard.aiInsightsGeneratedAt ? '✅' : '❌'} Timestamp saved: ${savedCard.aiInsightsGeneratedAt || 'MISSING'}`);
      
      return hasValidSavedInsights;
    }
    
    return false;
    
  } catch (error) {
    console.error('   ❌ Test failed with error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Direct AI Insights Generation');
  console.log('=' .repeat(60));
  
  // Test characters
  const testCases = [
    { hanzi: '測', meaning: 'test/measure' },
    { hanzi: '水', meaning: 'water' },
    { hanzi: '火', meaning: 'fire' }
  ];
  
  const results: boolean[] = [];
  
  // Run tests
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const success = await enrichCard(testCase.hanzi, testCase.meaning, i + 1);
    results.push(success);
    
    if (success) {
      console.log(`\n✅ Test ${i + 1} PASSED: AI insights generated and saved!\n`);
    } else {
      console.log(`\n❌ Test ${i + 1} FAILED: AI insights not generated properly!\n`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Summary:');
  console.log('-'.repeat(40));
  
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  console.log(`  ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`  ❌ Failed: ${failed}/${testCases.length}`);
  
  if (passed === testCases.length) {
    console.log('\n🎉 All tests passed! AI insights generation is working correctly!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the error messages above.');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

main();