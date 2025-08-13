#!/usr/bin/env bun
/**
 * Script to clear bad commonConfusions data that shows generic examples
 * and marks cards for re-enrichment
 */

import mongoose from 'mongoose';
import Card from '../src/lib/db/models/Card';

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Generic examples that shouldn't be in confusions unless the character actually contains 子
    const genericExamples = ['房子', '鞋子', '帽子', '箱子', '孩子', '餃子', '包子'];
    
    // Find all cards that have these generic confusions but don't contain 子
    const problematicCards = await Card.find({
      hanzi: { $not: { $regex: '子' } },
      'commonConfusions.character': { $in: genericExamples }
    });

    console.log(`\n📊 Found ${problematicCards.length} cards with incorrect generic confusions`);

    if (problematicCards.length > 0) {
      // Show sample
      console.log('\n📝 Sample of affected cards:');
      problematicCards.slice(0, 10).forEach(card => {
        const confusions = card.commonConfusions?.map((c: any) => c.character).join(', ') || 'none';
        console.log(`  - ${card.hanzi} (${card.pinyin}): ${confusions}`);
      });

      // Clear commonConfusions for these cards
      console.log('\n🧹 Clearing incorrect confusion data...');
      for (const card of problematicCards) {
        card.commonConfusions = [];
        // Also clear the comprehensiveAnalysisPrompt to trigger re-analysis
        if (card.comprehensiveAnalysisPrompt) {
          card.comprehensiveAnalysisPrompt = undefined;
        }
        await card.save();
      }
      console.log(`✅ Cleared confusion data for ${problematicCards.length} cards`);
    }

    // Also find cards with simplified Chinese in confusions
    const simplifiedChars = ['活', '伙', '货', '过', '会', '说'];
    const cardsWithSimplified = await Card.find({
      'commonConfusions.character': { $in: simplifiedChars }
    });

    if (cardsWithSimplified.length > 0) {
      console.log(`\n⚠️ Found ${cardsWithSimplified.length} cards with simplified Chinese in confusions`);
      
      for (const card of cardsWithSimplified) {
        // Filter out simplified characters
        const filtered = card.commonConfusions?.filter(
          (conf: any) => !simplifiedChars.includes(conf.character)
        ) || [];
        
        if (filtered.length !== card.commonConfusions?.length) {
          card.commonConfusions = filtered;
          await card.save();
          console.log(`  Fixed: ${card.hanzi} - removed simplified characters`);
        }
      }
    }

    // Find all cards with commonConfusions to check for quality
    const allCardsWithConfusions = await Card.find({
      commonConfusions: { $exists: true, $ne: [] }
    }).limit(10); // Check first 10

    console.log('\n📋 Sample of current confusion data:');
    allCardsWithConfusions.forEach(card => {
      const confusions = card.commonConfusions?.slice(0, 2).map((c: any) => 
        `${c.character}${c.reason ? ` (${c.reason.substring(0, 30)}...)` : ''}`
      ).join(', ') || 'none';
      console.log(`  ${card.hanzi}: ${confusions}`);
    });

    console.log('\n✅ Script completed successfully');
    console.log('💡 Run enrichment on affected cards to generate proper confusion analysis');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
main().catch(console.error);