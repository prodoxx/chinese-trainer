#!/usr/bin/env bun
/**
 * Check AI insights for specific cards
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function main() {
  console.log('🔍 Checking AI Insights in Cards\n');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  // Check specific card
  const testCharacters = ['房間', '電腦', '朋友', '學生'];
  
  for (const hanzi of testCharacters) {
    const card = await Card.findOne({ hanzi });
    
    if (card) {
      console.log(`\n📝 Card: ${hanzi} (${card.pinyin})`);
      console.log('-'.repeat(40));
      
      if (card.aiInsights) {
        console.log('✅ Has AI insights');
        
        // Check structure
        console.log('\nStructure check:');
        console.log(`  Etymology: ${card.aiInsights.etymology ? '✓' : '✗'}`);
        console.log(`    - origin: ${card.aiInsights.etymology?.origin ? '✓ ' + card.aiInsights.etymology.origin.substring(0, 50) + '...' : '✗'}`);
        console.log(`    - evolution: ${card.aiInsights.etymology?.evolution?.length || 0} items`);
        console.log(`    - culturalContext: ${card.aiInsights.etymology?.culturalContext ? '✓' : '✗'}`);
        
        console.log(`  Mnemonics: ${card.aiInsights.mnemonics ? '✓' : '✗'}`);
        console.log(`    - visual: ${card.aiInsights.mnemonics?.visual ? '✓' : '✗'}`);
        console.log(`    - story: ${card.aiInsights.mnemonics?.story ? '✓' : '✗'}`);
        console.log(`    - components: ${card.aiInsights.mnemonics?.components ? '✓' : '✗'}`);
        
        console.log(`  Common Errors: ${card.aiInsights.commonErrors ? '✓' : '✗'}`);
        console.log(`    - similarCharacters: ${card.aiInsights.commonErrors?.similarCharacters?.length || 0} items`);
        if (card.aiInsights.commonErrors?.similarCharacters?.length > 0) {
          card.aiInsights.commonErrors.similarCharacters.slice(0, 3).forEach((char: string) => {
            console.log(`      • ${char}`);
          });
        }
        console.log(`    - wrongContexts: ${card.aiInsights.commonErrors?.wrongContexts?.length || 0} items`);
        console.log(`    - toneConfusions: ${card.aiInsights.commonErrors?.toneConfusions?.length || 0} items`);
        
        console.log(`  Usage: ${card.aiInsights.usage ? '✓' : '✗'}`);
        console.log(`    - commonCollocations: ${card.aiInsights.usage?.commonCollocations?.length || 0} items`);
        if (card.aiInsights.usage?.commonCollocations?.length > 0) {
          card.aiInsights.usage.commonCollocations.slice(0, 3).forEach((col: string) => {
            console.log(`      • ${col}`);
          });
        }
        console.log(`    - registerLevel: ${card.aiInsights.usage?.registerLevel || '✗'}`);
        console.log(`    - frequency: ${card.aiInsights.usage?.frequency || '✗'}`);
        console.log(`    - domains: ${card.aiInsights.usage?.domains?.length || 0} items`);
        
        console.log(`  Learning Tips: ${card.aiInsights.learningTips ? '✓' : '✗'}`);
        console.log(`    - forBeginners: ${card.aiInsights.learningTips?.forBeginners?.length || 0} tips`);
        console.log(`    - forIntermediate: ${card.aiInsights.learningTips?.forIntermediate?.length || 0} tips`);
        console.log(`    - forAdvanced: ${card.aiInsights.learningTips?.forAdvanced?.length || 0} tips`);
        
        // Check if it's just empty structure
        const hasActualContent = card.aiInsights.etymology?.origin && 
          card.aiInsights.mnemonics?.visual && 
          card.aiInsights.learningTips?.forBeginners?.length > 0;
        
        if (!hasActualContent) {
          console.log('\n⚠️  WARNING: AI insights exist but have no actual content (empty structure)');
        } else {
          console.log('\n✅ AI insights have actual content');
        }
        
      } else {
        console.log('❌ No AI insights found');
      }
      
      // Also check other relevant fields
      console.log('\nOther analysis fields:');
      console.log(`  semanticCategory: ${card.semanticCategory || '✗'}`);
      console.log(`  tonePattern: ${card.tonePattern || '✗'}`);
      console.log(`  strokeCount: ${card.strokeCount || '✗'}`);
      console.log(`  visualComplexity: ${card.visualComplexity || '✗'}`);
      console.log(`  overallDifficulty: ${card.overallDifficulty || '✗'}`);
      console.log(`  conceptType: ${card.conceptType || '✗'}`);
      console.log(`  frequency: ${card.frequency || '✗'}`);
      
    } else {
      console.log(`\n❌ Card not found: ${hanzi}`);
    }
  }
  
  // Get stats on all cards
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Overall AI Insights Statistics\n');
  
  const totalCards = await Card.countDocuments();
  const cardsWithAI = await Card.countDocuments({ aiInsights: { $exists: true } });
  const cardsWithValidAI = await Card.countDocuments({
    'aiInsights.etymology.origin': { $exists: true, $ne: '' },
    'aiInsights.mnemonics.visual': { $exists: true, $ne: '' },
    'aiInsights.learningTips.forBeginners.0': { $exists: true }
  });
  
  console.log(`Total cards: ${totalCards}`);
  console.log(`Cards with AI insights field: ${cardsWithAI} (${(cardsWithAI/totalCards*100).toFixed(1)}%)`);
  console.log(`Cards with valid AI insights: ${cardsWithValidAI} (${(cardsWithValidAI/totalCards*100).toFixed(1)}%)`);
  console.log(`Cards with empty AI structure: ${cardsWithAI - cardsWithValidAI}`);
  
  process.exit(0);
}

main();