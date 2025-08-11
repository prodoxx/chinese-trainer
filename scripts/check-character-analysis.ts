#!/usr/bin/env bun

/**
 * Check the current state of a character's analysis
 */

import dotenv from 'dotenv';
import connectDB from '../src/lib/db/mongodb';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

dotenv.config();

async function checkCharacter(character: string) {
  await connectDB();
  
  const analysis = await CharacterAnalysis.findOne({ character });
  
  if (!analysis) {
    console.log(`No analysis found for: ${character}`);
    return;
  }
  
  console.log(`\nCharacter: ${analysis.character}`);
  console.log(`Pinyin: ${analysis.pinyin}`);
  console.log(`Last analyzed: ${analysis.lastAnalyzedAt}`);
  console.log(`\nCommon Confusions (${analysis.commonConfusions?.length || 0}):`);
  
  if (analysis.commonConfusions && analysis.commonConfusions.length > 0) {
    analysis.commonConfusions.forEach((conf, idx) => {
      console.log(`  ${idx + 1}. ${conf.character}`);
      console.log(`     Reason: ${conf.reason}`);
      console.log(`     Similarity: ${conf.similarity}`);
    });
  } else {
    console.log('  None');
  }
  
  // Check for issues
  console.log('\nIssue Check:');
  
  // Check for self-reference
  const hasSelfRef = analysis.commonConfusions?.some(c => c.character === character);
  console.log(`  Self-reference: ${hasSelfRef ? '❌ YES' : '✅ NO'}`);
  
  // Check for components (if multi-character)
  if (character.length > 1) {
    const components = character.split('');
    const hasComponents = analysis.commonConfusions?.some(c => 
      c.character.length === 1 && components.includes(c.character)
    );
    console.log(`  Has components as confusions: ${hasComponents ? '❌ YES' : '✅ NO'}`);
    
    if (hasComponents) {
      const componentConfusions = analysis.commonConfusions?.filter(c => 
        c.character.length === 1 && components.includes(c.character)
      );
      console.log(`  Component confusions found: ${componentConfusions?.map(c => c.character).join(', ')}`);
    }
  }
  
  process.exit(0);
}

const character = process.argv[2];
if (!character) {
  console.log('Usage: bun run scripts/check-character-analysis.ts <character>');
  process.exit(1);
}

checkCharacter(character).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});