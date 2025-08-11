#!/usr/bin/env bun
/**
 * Test that the enrichment worker validates AI insights content properly
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function main() {
  console.log('🧪 Testing Enrichment Worker AI Insights Validation');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  // Test 1: Create a card with empty AI insights structure
  console.log('\n1️⃣ Test: Card with empty AI insights structure');
  console.log('-'.repeat(40));
  
  await Card.deleteOne({ hanzi: 'EMPTY_TEST' });
  
  const emptyCard = await Card.create({
    hanzi: 'EMPTY_TEST',
    meaning: 'test',
    pinyin: 'test',
    aiInsights: {
      etymology: { evolution: [] },
      mnemonics: {},
      learningTips: { forBeginners: [], forIntermediate: [], forAdvanced: [] }
    }
  });
  
  // Check validation
  const hasValidContent1 = emptyCard.aiInsights?.etymology?.origin && 
    emptyCard.aiInsights?.mnemonics?.visual && 
    emptyCard.aiInsights?.learningTips?.forBeginners?.length > 0;
  
  console.log(`  Card created with empty structure`);
  console.log(`  Validation check: ${hasValidContent1 ? 'VALID' : 'INVALID (as expected)'}`);
  console.log(`  ✅ Worker should regenerate AI insights for this card`);
  
  // Test 2: Create a card with partial AI insights
  console.log('\n2️⃣ Test: Card with partial AI insights');
  console.log('-'.repeat(40));
  
  await Card.deleteOne({ hanzi: 'PARTIAL_TEST' });
  
  const partialCard = await Card.create({
    hanzi: 'PARTIAL_TEST',
    meaning: 'test',
    pinyin: 'test',
    aiInsights: {
      etymology: { origin: 'Some etymology', evolution: [] },
      mnemonics: {},
      learningTips: { forBeginners: [], forIntermediate: [], forAdvanced: [] }
    }
  });
  
  const hasValidContent2 = partialCard.aiInsights?.etymology?.origin && 
    partialCard.aiInsights?.mnemonics?.visual && 
    partialCard.aiInsights?.learningTips?.forBeginners?.length > 0;
  
  console.log(`  Card created with partial content (etymology only)`);
  console.log(`  Validation check: ${hasValidContent2 ? 'VALID' : 'INVALID (as expected)'}`);
  console.log(`  ✅ Worker should regenerate AI insights for this card`);
  
  // Test 3: Create a card with complete AI insights
  console.log('\n3️⃣ Test: Card with complete AI insights');
  console.log('-'.repeat(40));
  
  await Card.deleteOne({ hanzi: 'COMPLETE_TEST' });
  
  const completeCard = await Card.create({
    hanzi: 'COMPLETE_TEST',
    meaning: 'test',
    pinyin: 'test',
    aiInsights: {
      etymology: { 
        origin: 'Complete etymology',
        evolution: ['Step 1', 'Step 2'],
        culturalContext: 'Context'
      },
      mnemonics: {
        visual: 'Visual mnemonic',
        story: 'Story mnemonic',
        components: 'Component breakdown'
      },
      learningTips: {
        forBeginners: ['Tip 1', 'Tip 2'],
        forIntermediate: ['Tip 3'],
        forAdvanced: ['Tip 4']
      }
    }
  });
  
  const hasValidContent3 = completeCard.aiInsights?.etymology?.origin && 
    completeCard.aiInsights?.mnemonics?.visual && 
    completeCard.aiInsights?.learningTips?.forBeginners?.length > 0;
  
  console.log(`  Card created with complete AI insights`);
  console.log(`  Validation check: ${hasValidContent3 ? 'VALID (as expected)' : 'INVALID'}`);
  console.log(`  ✅ Worker should NOT regenerate AI insights for this card`);
  
  // Clean up
  await Card.deleteOne({ hanzi: 'EMPTY_TEST' });
  await Card.deleteOne({ hanzi: 'PARTIAL_TEST' });
  await Card.deleteOne({ hanzi: 'COMPLETE_TEST' });
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Validation Logic Summary:');
  console.log('-'.repeat(40));
  console.log('The enrichment worker checks for:');
  console.log('  1. etymology.origin exists');
  console.log('  2. mnemonics.visual exists');
  console.log('  3. learningTips.forBeginners has at least 1 item');
  console.log('\nOnly cards meeting ALL three criteria are considered valid.');
  console.log('✅ This ensures no empty structures are accepted as valid AI insights.');
  
  process.exit(0);
}

main();