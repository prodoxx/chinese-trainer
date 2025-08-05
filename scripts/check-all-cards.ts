#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function checkAllCards() {
  try {
    await connectDB();
    
    const totalCards = await Card.countDocuments();
    console.log(`\n📊 Total cards in database: ${totalCards}`);
    
    if (totalCards > 0) {
      const sampleCards = await Card.find().limit(5);
      console.log('\n📋 Sample cards:');
      sampleCards.forEach(card => {
        console.log(`  ${card.hanzi}: ${card.meaning || 'No meaning'}`);
        console.log(`    Audio: ${card.audioUrl ? 'Yes' : 'No'}`);
        console.log(`    Image: ${card.imageUrl ? 'Yes' : 'No'}`);
        console.log(`    Cached: ${card.cached ? 'Yes' : 'No'}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllCards();