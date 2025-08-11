#!/usr/bin/env bun

/**
 * Test script for bulk delete functionality
 */

import dotenv from 'dotenv';
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import DeckCard from '../src/lib/db/models/DeckCard';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

dotenv.config();

async function testBulkDelete() {
  console.log('='.repeat(60));
  console.log('BULK DELETE TEST');
  console.log('='.repeat(60));
  
  await connectDB();
  
  // Create test cards
  console.log('\n1. Creating test cards...');
  const testCards = [];
  
  for (let i = 1; i <= 5; i++) {
    const card = await Card.create({
      hanzi: `測試${i}`,
      meaning: `Test ${i}`,
      pinyin: `cè shì ${i}`,
    });
    testCards.push(card);
    console.log(`   Created: ${card.hanzi} (${card._id})`);
    
    // Create character analysis for some cards
    if (i <= 3) {
      await CharacterAnalysis.create({
        character: card.hanzi,
        pinyin: card.pinyin,
        semanticCategory: 'test',
        lastAnalyzedAt: new Date()
      });
      console.log(`   Created analysis for: ${card.hanzi}`);
    }
  }
  
  // Simulate that card 3 is in a deck (should be skipped)
  console.log(`\n2. Simulating card "${testCards[2].hanzi}" is in a deck...`);
  await DeckCard.create({
    deckId: '507f1f77bcf86cd799439011', // Fake deck ID
    cardId: testCards[2]._id,
    order: 1
  });
  
  // Test bulk delete
  console.log('\n3. Testing bulk delete API...');
  const cardIds = testCards.map(c => c._id.toString());
  
  console.log(`   Attempting to delete ${cardIds.length} cards...`);
  
  // Simulate the bulk delete logic
  const results = {
    deleted: [] as any[],
    skipped: [] as any[],
    errors: [] as any[]
  };
  
  for (const cardId of cardIds) {
    try {
      const card = await Card.findById(cardId);
      if (!card) {
        results.errors.push({ id: cardId, error: 'Card not found' });
        continue;
      }
      
      // Check deck usage
      const deckUsage = await DeckCard.countDocuments({ cardId });
      
      if (deckUsage > 0) {
        results.skipped.push({
          id: cardId,
          hanzi: card.hanzi,
          reason: `Used in ${deckUsage} deck(s)`
        });
        console.log(`   ⏭️ Skipped: ${card.hanzi} (in deck)`);
        continue;
      }
      
      // Delete character analysis
      const analysisDeleted = await CharacterAnalysis.findOneAndDelete({ 
        character: card.hanzi 
      });
      
      // Delete card
      await Card.findByIdAndDelete(cardId);
      
      results.deleted.push({
        id: cardId,
        hanzi: card.hanzi,
        analysisDeleted: !!analysisDeleted
      });
      
      console.log(`   ✅ Deleted: ${card.hanzi}${analysisDeleted ? ' (with analysis)' : ''}`);
      
    } catch (error: any) {
      results.errors.push({ id: cardId, error: error.message });
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Requested: ${cardIds.length} cards`);
  console.log(`Deleted: ${results.deleted.length} cards`);
  console.log(`Skipped: ${results.skipped.length} cards (in use by decks)`);
  console.log(`Errors: ${results.errors.length}`);
  
  if (results.skipped.length > 0) {
    console.log('\nSkipped cards:');
    results.skipped.forEach(card => {
      console.log(`  - ${card.hanzi}: ${card.reason}`);
    });
  }
  
  // Verify deletions
  console.log('\n4. Verifying deletions...');
  for (const deleted of results.deleted) {
    const card = await Card.findById(deleted.id);
    const analysis = await CharacterAnalysis.findOne({ character: deleted.hanzi });
    
    if (card) {
      console.log(`   ❌ Card ${deleted.hanzi} still exists!`);
    } else {
      console.log(`   ✅ Card ${deleted.hanzi} confirmed deleted`);
    }
    
    if (deleted.analysisDeleted && analysis) {
      console.log(`   ❌ Analysis for ${deleted.hanzi} still exists!`);
    } else if (deleted.analysisDeleted) {
      console.log(`   ✅ Analysis for ${deleted.hanzi} confirmed deleted`);
    }
  }
  
  // Clean up any remaining test data
  console.log('\n5. Cleaning up test data...');
  await Card.deleteMany({ hanzi: { $regex: '^測試[0-9]+$' } });
  await CharacterAnalysis.deleteMany({ character: { $regex: '^測試[0-9]+$' } });
  await DeckCard.deleteMany({ cardId: { $in: cardIds } });
  console.log('   ✅ Test data cleaned up');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ BULK DELETE TEST COMPLETED');
  console.log('='.repeat(60));
  
  process.exit(0);
}

testBulkDelete().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});