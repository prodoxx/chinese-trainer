#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function checkEnrichedCards() {
  try {
    await connectDB();
    
    // Find cards that have been enriched (have audio/image)
    const enrichedCards = await Card.find({ 
      audioUrl: { $exists: true, $ne: '' },
      imageUrl: { $exists: true, $ne: '' }
    }).limit(10);
    
    console.log(`\n📊 Checking ${enrichedCards.length} enriched cards for character analysis fields:\n`);
    
    enrichedCards.forEach(card => {
      console.log(`Card: ${card.hanzi} (${card.pinyin})`);
      console.log(`  Enriched: ${card.cached ? 'Yes' : 'No'}`);
      console.log(`  Has semantic category: ${!!card.semanticCategory}`);
      console.log(`  Has difficulty: ${card.overallDifficulty !== undefined}`);
      console.log(`  Semantic category: ${card.semanticCategory || 'N/A'}`);
      console.log(`  Overall difficulty: ${card.overallDifficulty || 'N/A'}`);
      console.log(`  Stroke count: ${card.strokeCount || 'N/A'}`);
      console.log('---');
    });
    
    // Count cards with analysis
    const withAnalysis = enrichedCards.filter(c => c.semanticCategory).length;
    console.log(`\n📈 ${withAnalysis}/${enrichedCards.length} enriched cards have character analysis`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEnrichedCards();