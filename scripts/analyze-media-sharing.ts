#!/usr/bin/env bun

import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';

async function analyzeMediaSharing() {
  await connectDB();
  
  console.log('Analyzing media sharing potential...\n');
  
  // Get all cards
  const allCards = await Card.find({});
  console.log(`Total unique cards: ${allCards.length}`);
  
  // Group cards by hanzi
  const hanziMap = new Map<string, Array<{cardId: string, audioUrl?: string, imageUrl?: string}>>();
  
  for (const card of allCards) {
    if (!hanziMap.has(card.hanzi)) {
      hanziMap.set(card.hanzi, []);
    }
    hanziMap.get(card.hanzi)!.push({
      cardId: card._id.toString(),
      audioUrl: card.audioUrl,
      imageUrl: card.imageUrl
    });
  }
  
  // Analyze duplicates
  let duplicateHanzi = 0;
  let totalDuplicateCards = 0;
  let cardsWithMedia = 0;
  let potentialSavedMedia = 0;
  
  for (const [hanzi, cards] of hanziMap) {
    if (cards.length > 1) {
      duplicateHanzi++;
      totalDuplicateCards += cards.length;
      
      // Count how many have media
      const cardsWithAudio = cards.filter(c => c.audioUrl).length;
      const cardsWithImage = cards.filter(c => c.imageUrl).length;
      
      if (cardsWithAudio > 1) {
        potentialSavedMedia += (cardsWithAudio - 1); // Could save this many audio files
      }
      if (cardsWithImage > 1) {
        potentialSavedMedia += (cardsWithImage - 1); // Could save this many image files
      }
    }
    
    // Count cards with any media
    cardsWithMedia += cards.filter(c => c.audioUrl || c.imageUrl).length;
  }
  
  console.log(`\nUnique hanzi characters: ${hanziMap.size}`);
  console.log(`Hanzi that appear multiple times: ${duplicateHanzi}`);
  console.log(`Total cards for duplicate hanzi: ${totalDuplicateCards}`);
  console.log(`Cards with media: ${cardsWithMedia}`);
  console.log(`\nPotential media files that could be saved: ${potentialSavedMedia}`);
  
  // Show some examples
  console.log('\nExamples of duplicate hanzi:');
  let count = 0;
  for (const [hanzi, cards] of hanziMap) {
    if (cards.length > 1 && count < 5) {
      console.log(`  ${hanzi}: appears in ${cards.length} cards`);
      count++;
    }
  }
  
  // Check deck associations
  console.log('\nAnalyzing deck associations...');
  const deckCards = await DeckCard.find({}).populate('cardId');
  const cardDeckMap = new Map<string, Set<string>>();
  
  for (const dc of deckCards) {
    const cardId = dc.cardId._id.toString();
    if (!cardDeckMap.has(cardId)) {
      cardDeckMap.set(cardId, new Set());
    }
    cardDeckMap.get(cardId)!.add(dc.deckId.toString());
  }
  
  let cardsInMultipleDecks = 0;
  let maxDecksPerCard = 0;
  
  for (const [cardId, decks] of cardDeckMap) {
    if (decks.size > 1) {
      cardsInMultipleDecks++;
    }
    maxDecksPerCard = Math.max(maxDecksPerCard, decks.size);
  }
  
  console.log(`Cards in multiple decks: ${cardsInMultipleDecks}`);
  console.log(`Maximum decks per card: ${maxDecksPerCard}`);
  
  // Estimate storage savings
  const avgAudioSize = 30 * 1024; // 30KB average
  const avgImageSize = 100 * 1024; // 100KB average
  const potentialSavingsBytes = potentialSavedMedia * ((avgAudioSize + avgImageSize) / 2);
  const potentialSavingsMB = (potentialSavingsBytes / (1024 * 1024)).toFixed(2);
  
  console.log(`\nEstimated storage savings: ${potentialSavingsMB} MB`);
  
  console.log('\n✅ Analysis complete!');
  process.exit(0);
}

analyzeMediaSharing().catch(console.error);