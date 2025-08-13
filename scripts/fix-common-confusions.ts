#!/usr/bin/env bun
/**
 * Script to fix the commonConfusions field that's showing hardcoded values
 * This will clear the bad data and allow re-enrichment with the fixed prompt
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

    // Find all cards with the problematic confusions
    const problematicCards = await Card.find({
      'commonConfusions.character': { $in: ['房子', '鞋子', '帽子'] }
    });

    console.log(`Found ${problematicCards.length} cards with problematic confusion data`);

    if (problematicCards.length > 0) {
      // Show sample of affected cards
      console.log('\nSample of affected cards:');
      problematicCards.slice(0, 5).forEach(card => {
        console.log(`  - ${card.hanzi}: ${card.commonConfusions?.map((c: any) => c.character).join(', ')}`);
      });

      // Clear the commonConfusions for these cards
      console.log('\n🧹 Clearing bad confusion data...');
      const result = await Card.updateMany(
        { 'commonConfusions.character': { $in: ['房子', '鞋子', '帽子'] } },
        { $set: { commonConfusions: [] } }
      );

      console.log(`✅ Cleared confusion data for ${result.modifiedCount} cards`);
      console.log('\nThese cards will get proper confusion analysis on next enrichment.');
    } else {
      console.log('✅ No cards found with the problematic confusion data');
    }

    // Also check if any cards have confusions that include themselves
    // Note: Using simple approach due to MongoDB query limitations
    const allCardsWithConfusions = await Card.find({
      commonConfusions: { $exists: true, $ne: [] }
    });
    
    let selfReferencingCount = 0;
    for (const card of allCardsWithConfusions) {
      const hasSelfReference = card.commonConfusions?.some(
        (conf: any) => conf.character === card.hanzi
      );
      
      if (hasSelfReference) {
        selfReferencingCount++;
        const filteredConfusions = card.commonConfusions?.filter(
          (conf: any) => conf.character !== card.hanzi
        ) || [];
        
        card.commonConfusions = filteredConfusions;
        await card.save();
        console.log(`  Fixed self-reference: ${card.hanzi}`);
      }
    }

    if (selfReferencingCount > 0) {
      console.log(`\n⚠️ Fixed ${selfReferencingCount} cards with self-referencing confusions`);
    } else {
      console.log('\n✅ No self-referencing confusions found');
    }

    console.log('\n✅ Script completed successfully');
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