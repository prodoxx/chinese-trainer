#!/usr/bin/env bun

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function main() {
  await connectDB();
  
  // Delete test card if exists
  await Card.deleteOne({ hanzi: 'TEST123' });
  
  // Create new card with minimal data
  const card = await Card.create({
    hanzi: 'TEST123',
    meaning: 'test',
    pinyin: 'test'
  });
  
  console.log('Created card:');
  console.log('  aiInsights exists:', !!card.aiInsights);
  console.log('  aiInsights type:', typeof card.aiInsights);
  
  if (card.aiInsights) {
    console.log('  aiInsights.etymology:', card.aiInsights.etymology);
    console.log('  aiInsights.mnemonics:', card.aiInsights.mnemonics);
    console.log('  aiInsights.learningTips:', card.aiInsights.learningTips);
  }
  
  // Clean up
  await Card.deleteOne({ hanzi: 'TEST123' });
  
  process.exit(0);
}

main();