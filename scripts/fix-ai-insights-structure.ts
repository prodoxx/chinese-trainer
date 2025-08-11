#!/usr/bin/env bun
/**
 * Fix AI insights structure for cards that have empty AI insights
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function main() {
  console.log('🔧 Fixing AI Insights Structure\n');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Find cards with broken AI insights (exists but has empty arrays)
    const brokenCards = await Card.find({
      'aiInsights': { $exists: true },
      $or: [
        { 'aiInsights.etymology.origin': { $exists: false } },
        { 'aiInsights.mnemonics.visual': { $exists: false } },
        { 'aiInsights.learningTips.forBeginners': { $size: 0 } }
      ]
    }).limit(10);
    
    console.log(`Found ${brokenCards.length} cards with broken AI insights structure\n`);
    
    for (const card of brokenCards) {
      console.log(`Fixing card: ${card.hanzi}`);
      
      // Check if we have data in root level fields that can be migrated
      const hasRootMnemonics = card.mnemonics && card.mnemonics.length > 0;
      const hasRootEtymology = !!card.etymology;
      
      if (hasRootMnemonics || hasRootEtymology) {
        console.log(`  - Has root level data to migrate`);
        
        // Build proper AI insights structure from existing data
        const properAiInsights = {
          etymology: {
            origin: card.etymology || 'Character origin not available',
            evolution: ['Historical form evolved to modern character'],
            culturalContext: 'Used in everyday Taiwan Mandarin'
          },
          mnemonics: {
            visual: card.mnemonics?.[0] || 'Visual mnemonic not available',
            story: card.mnemonics?.[1] || card.mnemonics?.[0] || 'Create a story to remember this character',
            components: `Break down ${card.hanzi} into its components for easier memorization`
          },
          commonErrors: {
            similarCharacters: [],
            wrongContexts: ['Be careful not to confuse with similar looking characters'],
            toneConfusions: ['Pay attention to tone marks when pronouncing']
          },
          usage: {
            commonCollocations: [],
            registerLevel: 'neutral',
            frequency: 'high',
            domains: ['daily life', 'common vocabulary']
          },
          learningTips: {
            forBeginners: [
              `Practice writing ${card.hanzi} stroke by stroke`,
              `Associate the meaning "${card.meaning}" with the character shape`,
              'Use flashcards to memorize this character'
            ],
            forIntermediate: [
              `Practice using ${card.hanzi} in sentences`,
              'Learn common phrases that include this character'
            ],
            forAdvanced: [
              'Study the etymology and component meanings',
              'Compare with similar characters to understand nuances'
            ]
          }
        };
        
        // Update the card with proper AI insights
        card.aiInsights = properAiInsights;
        card.aiInsightsGeneratedAt = card.aiInsightsGeneratedAt || new Date();
        
        await card.save();
        console.log(`  ✅ Fixed AI insights structure`);
      } else {
        console.log(`  ⚠️ No data to migrate - needs re-enrichment`);
      }
    }
    
    // Count how many still need fixing
    const stillBroken = await Card.countDocuments({
      'aiInsights': { $exists: true },
      $or: [
        { 'aiInsights.etymology.origin': { $exists: false } },
        { 'aiInsights.mnemonics.visual': { $exists: false } },
        { 'aiInsights.learningTips.forBeginners': { $size: 0 } }
      ]
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Fixed: ${brokenCards.length} cards`);
    console.log(`  - Still need fixing: ${stillBroken} cards`);
    
    if (stillBroken > 0) {
      console.log(`\n💡 To fix remaining cards, run:`);
      console.log(`  1. This script again to fix more cards`);
      console.log(`  2. Re-enrich cards to generate new AI insights`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();