#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function fixCoffeeCard() {
  try {
    await connectDB();
    
    const card = await Card.findOne({ hanzi: '咖啡' });
    
    if (!card) {
      console.log('Card not found for 咖啡');
      process.exit(1);
    }
    
    console.log(`\n🔧 Fixing card for 咖啡 (${card._id})`);
    console.log(`Current status:`);
    console.log(`  - Cached: ${card.cached}`);
    console.log(`  - AI insights generated at: ${card.aiInsightsGeneratedAt || 'Never'}`);
    
    // Fix the card
    if (card.aiInsights && !card.aiInsightsGeneratedAt) {
      card.aiInsightsGeneratedAt = new Date();
      card.cached = true;
      await card.save();
      console.log('\n✅ Fixed! Set aiInsightsGeneratedAt and cached=true');
    } else {
      console.log('\n⚠️  Card already has proper timestamps or missing AI insights');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCoffeeCard();