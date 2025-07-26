#!/usr/bin/env bun

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import Deck from '../src/lib/db/models/Deck';
import DeckCard from '../src/lib/db/models/DeckCard';

async function checkCards() {
  try {
    await connectDB();
    
    // Get all decks
    const decks = await Deck.find();
    console.log(`\n📚 Found ${decks.length} decks\n`);
    
    for (const deck of decks) {
      console.log(`\n📖 Deck: ${deck.name} (${deck.status})`);
      console.log(`   ID: ${deck._id}`);
      
      // Get cards in this deck
      const deckCards = await DeckCard.find({ deckId: deck._id });
      const cardIds = deckCards.map(dc => dc.cardId);
      const cards = await Card.find({ _id: { $in: cardIds } });
      
      console.log(`   Total cards: ${cards.length}`);
      
      const stats = {
        withAudio: 0,
        withImage: 0,
        cached: 0,
        complete: 0
      };
      
      for (const card of cards) {
        if (card.audioUrl) stats.withAudio++;
        if (card.imageUrl) stats.withImage++;
        if (card.cached) stats.cached++;
        if (card.audioUrl && card.imageUrl) stats.complete++;
      }
      
      console.log(`   With audio: ${stats.withAudio}`);
      console.log(`   With image: ${stats.withImage}`);
      console.log(`   Cached: ${stats.cached}`);
      console.log(`   Complete (audio + image): ${stats.complete}`);
      
      // Show sample cards
      if (cards.length > 0) {
        console.log(`\n   Sample cards:`);
        for (const card of cards.slice(0, 3)) {
          console.log(`   - ${card.hanzi}:`);
          console.log(`     Audio: ${card.audioUrl ? '✓' : '✗'}`);
          console.log(`     Image: ${card.imageUrl ? '✓' : '✗'} ${card.imageSource || ''}`);
          console.log(`     Cached: ${card.cached ? '✓' : '✗'}`);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCards();