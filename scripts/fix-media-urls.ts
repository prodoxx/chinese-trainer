#!/usr/bin/env bun

import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';

async function fixMediaUrls() {
  await connectDB();
  
  console.log('Checking for cards with double media paths...\n');
  
  // Find all cards with media URLs
  const cards = await Card.find({
    $or: [
      { audioUrl: { $regex: /\/api\/media\/media\// } },
      { imageUrl: { $regex: /\/api\/media\/media\// } }
    ]
  });
  
  console.log(`Found ${cards.length} cards with double media paths`);
  
  if (cards.length === 0) {
    console.log('No cards need fixing!');
    return;
  }
  
  // Fix each card
  let fixed = 0;
  for (const card of cards) {
    let updated = false;
    
    if (card.audioUrl && card.audioUrl.includes('/api/media/media/')) {
      console.log(`Fixing audio URL for ${card.hanzi}:`);
      console.log(`  Before: ${card.audioUrl}`);
      card.audioUrl = card.audioUrl.replace('/api/media/media/', '/api/media/');
      console.log(`  After:  ${card.audioUrl}`);
      updated = true;
    }
    
    if (card.imageUrl && card.imageUrl.includes('/api/media/media/')) {
      console.log(`Fixing image URL for ${card.hanzi}:`);
      console.log(`  Before: ${card.imageUrl}`);
      card.imageUrl = card.imageUrl.replace('/api/media/media/', '/api/media/');
      console.log(`  After:  ${card.imageUrl}`);
      updated = true;
    }
    
    if (updated) {
      await card.save();
      fixed++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} cards`);
  process.exit(0);
}

fixMediaUrls().catch(console.error);