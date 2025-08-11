#!/usr/bin/env bun
/**
 * Test script to debug aiInsightsGeneratedAt field saving
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import mongoose from 'mongoose';

async function main() {
  console.log('🧪 Testing aiInsightsGeneratedAt field\n');
  
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Create a unique test character
    const testHanzi = '時間戳_' + Date.now();
    
    // Test 1: Direct creation with aiInsightsGeneratedAt
    console.log('Test 1: Creating card with aiInsightsGeneratedAt in constructor...');
    const card1 = new Card({
      hanzi: testHanzi + '_1',
      meaning: 'test',
      aiInsights: {
        etymology: { origin: 'test origin' },
        mnemonics: { visual: 'test visual' },
        learningTips: { forBeginners: ['test tip'] }
      },
      aiInsightsGeneratedAt: new Date()
    });
    
    await card1.save();
    console.log('Card saved with ID:', card1._id);
    console.log('aiInsightsGeneratedAt from model:', card1.aiInsightsGeneratedAt);
    
    // Check database directly
    const dbCard1 = await Card.findById(card1._id);
    console.log('aiInsightsGeneratedAt from DB:', dbCard1?.aiInsightsGeneratedAt);
    console.log('Type:', typeof dbCard1?.aiInsightsGeneratedAt);
    
    // Test 2: Setting field after creation
    console.log('\nTest 2: Setting aiInsightsGeneratedAt after creation...');
    const card2 = new Card({
      hanzi: testHanzi + '_2',
      meaning: 'test'
    });
    
    card2.aiInsights = {
      etymology: { origin: 'test origin' },
      mnemonics: { visual: 'test visual' },
      learningTips: { forBeginners: ['test tip'] }
    };
    card2.aiInsightsGeneratedAt = new Date();
    
    console.log('Before save - aiInsightsGeneratedAt:', card2.aiInsightsGeneratedAt);
    await card2.save();
    console.log('After save - aiInsightsGeneratedAt:', card2.aiInsightsGeneratedAt);
    
    const dbCard2 = await Card.findById(card2._id);
    console.log('From DB - aiInsightsGeneratedAt:', dbCard2?.aiInsightsGeneratedAt);
    
    // Test 3: Using updateOne
    console.log('\nTest 3: Using updateOne to set aiInsightsGeneratedAt...');
    const card3 = await Card.create({
      hanzi: testHanzi + '_3',
      meaning: 'test'
    });
    
    const updateResult = await Card.updateOne(
      { _id: card3._id },
      {
        $set: {
          aiInsights: {
            etymology: { origin: 'test origin' },
            mnemonics: { visual: 'test visual' },
            learningTips: { forBeginners: ['test tip'] }
          },
          aiInsightsGeneratedAt: new Date()
        }
      }
    );
    
    console.log('Update result:', updateResult);
    
    const dbCard3 = await Card.findById(card3._id);
    console.log('aiInsightsGeneratedAt from DB:', dbCard3?.aiInsightsGeneratedAt);
    
    // Test 4: Using findByIdAndUpdate
    console.log('\nTest 4: Using findByIdAndUpdate...');
    const card4 = await Card.create({
      hanzi: testHanzi + '_4',
      meaning: 'test'
    });
    
    const updatedCard4 = await Card.findByIdAndUpdate(
      card4._id,
      {
        aiInsights: {
          etymology: { origin: 'test origin' },
          mnemonics: { visual: 'test visual' },
          learningTips: { forBeginners: ['test tip'] }
        },
        aiInsightsGeneratedAt: new Date()
      },
      { new: true }
    );
    
    console.log('aiInsightsGeneratedAt from update:', updatedCard4?.aiInsightsGeneratedAt);
    
    // Test 5: Check schema paths
    console.log('\nTest 5: Checking schema paths...');
    const schemaPaths = Card.schema.paths;
    console.log('Has aiInsightsGeneratedAt path?', 'aiInsightsGeneratedAt' in schemaPaths);
    if ('aiInsightsGeneratedAt' in schemaPaths) {
      const pathType = schemaPaths.aiInsightsGeneratedAt;
      console.log('Path type:', pathType.instance);
      console.log('Path options:', pathType.options);
    }
    
    // Test 6: Using markModified
    console.log('\nTest 6: Using markModified...');
    const card6 = new Card({
      hanzi: testHanzi + '_6',
      meaning: 'test'
    });
    
    card6.aiInsights = {
      etymology: { origin: 'test origin' },
      mnemonics: { visual: 'test visual' },
      learningTips: { forBeginners: ['test tip'] }
    };
    card6.aiInsightsGeneratedAt = new Date();
    card6.markModified('aiInsightsGeneratedAt');
    
    await card6.save();
    
    const dbCard6 = await Card.findById(card6._id);
    console.log('aiInsightsGeneratedAt from DB:', dbCard6?.aiInsightsGeneratedAt);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Card.deleteMany({ hanzi: { $regex: testHanzi } });
    console.log('✅ Test cards deleted');
    
    // Summary
    console.log('\n📊 Summary:');
    const results = [
      { test: 'Constructor', saved: !!dbCard1?.aiInsightsGeneratedAt },
      { test: 'After creation', saved: !!dbCard2?.aiInsightsGeneratedAt },
      { test: 'updateOne', saved: !!dbCard3?.aiInsightsGeneratedAt },
      { test: 'findByIdAndUpdate', saved: !!updatedCard4?.aiInsightsGeneratedAt },
      { test: 'markModified', saved: !!dbCard6?.aiInsightsGeneratedAt }
    ];
    
    results.forEach(r => {
      console.log(`${r.test}: ${r.saved ? '✅ Saved' : '❌ Not saved'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

main();