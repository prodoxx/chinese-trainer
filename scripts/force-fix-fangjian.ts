#!/usr/bin/env bun

/**
 * Force fix the 房間 character analysis
 */

import dotenv from 'dotenv';
import connectDB from '../src/lib/db/mongodb';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

dotenv.config();

async function forceFix() {
  await connectDB();
  
  const analysis = await CharacterAnalysis.findOne({ character: '房間' });
  
  if (!analysis) {
    console.log('No analysis found for 房間');
    return;
  }
  
  console.log('Current confusions:');
  analysis.commonConfusions?.forEach(c => {
    console.log(`  - ${c.character}: ${c.reason}`);
  });
  
  // Filter out 房 and 間
  const filtered = analysis.commonConfusions?.filter(c => {
    // Extract just the character part (remove pinyin in parentheses)
    const charOnly = c.character.split('(')[0].trim();
    const isComponent = charOnly === '房' || charOnly === '間';
    
    if (isComponent) {
      console.log(`\nRemoving component: ${c.character}`);
    }
    
    return !isComponent;
  }) || [];
  
  analysis.commonConfusions = filtered;
  await analysis.save();
  
  console.log('\nAfter fix:');
  if (filtered.length > 0) {
    filtered.forEach(c => {
      console.log(`  - ${c.character}: ${c.reason}`);
    });
  } else {
    console.log('  No confusions (will regenerate on next enrichment)');
  }
  
  console.log('\n✅ Fixed 房間 analysis');
  process.exit(0);
}

forceFix().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});