#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';
import Card from '../src/lib/db/models/Card';

async function checkCharacterAnalyses() {
  try {
    await connectDB();
    
    // Count total character analyses
    const totalAnalyses = await CharacterAnalysis.countDocuments();
    console.log(`\n📊 Total character analyses in database: ${totalAnalyses}`);
    
    // Get sample analyses
    const sampleAnalyses = await CharacterAnalysis.find().limit(5);
    console.log('\n📋 Sample character analyses:');
    sampleAnalyses.forEach(analysis => {
      console.log(`   ${analysis.character} (${analysis.pinyin}): ${analysis.semanticCategory}, difficulty: ${analysis.overallDifficulty}`);
    });
    
    // Count cards with analysis fields
    const cardsWithAnalysis = await Card.countDocuments({ 
      semanticCategory: { $exists: true, $ne: null } 
    });
    console.log(`\n🃏 Cards with character analysis fields: ${cardsWithAnalysis}`);
    
    // Get sample cards with analysis
    const sampleCards = await Card.find({ 
      semanticCategory: { $exists: true, $ne: null } 
    }).limit(5);
    console.log('\n📋 Sample cards with analysis:');
    sampleCards.forEach(card => {
      console.log(`   ${card.hanzi}: ${card.semanticCategory}, difficulty: ${card.overallDifficulty}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCharacterAnalyses();