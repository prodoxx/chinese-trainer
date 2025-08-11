#!/usr/bin/env bun

/**
 * Fix existing CharacterAnalysis data that incorrectly lists component characters as confusions
 */

import dotenv from 'dotenv';
import connectDB from '../src/lib/db/mongodb';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

dotenv.config();

async function fixCharacterAnalysisConfusions() {
  console.log('='.repeat(60));
  console.log('FIX CHARACTER ANALYSIS CONFUSIONS');
  console.log('='.repeat(60));
  console.log('This script will remove component characters from confusion lists\n');

  await connectDB();

  // Find all multi-character entries (length > 1)
  const analyses = await CharacterAnalysis.find({
    $expr: { $gt: [{ $strLenCP: '$character' }, 1] }
  });

  console.log(`Found ${analyses.length} multi-character entries to check\n`);

  let fixed = 0;
  let alreadyCorrect = 0;

  for (const analysis of analyses) {
    const character = analysis.character;
    const components = character.split('');
    
    console.log(`\nChecking: ${character}`);
    console.log(`  Components: ${components.join(', ')}`);
    
    if (!analysis.commonConfusions || analysis.commonConfusions.length === 0) {
      console.log('  No confusions found');
      alreadyCorrect++;
      continue;
    }

    const originalCount = analysis.commonConfusions.length;
    
    // Filter out component characters and self-references
    const filteredConfusions = analysis.commonConfusions.filter(conf => {
      // Remove self-reference
      if (conf.character === character) {
        console.log(`  ❌ Removing self-reference: ${conf.character}`);
        return false;
      }
      
      // Remove component characters (single characters that are part of the word)
      const confChar = conf.character.replace(/[()（）\s]/g, '').split(/[,，]/)[0]; // Clean up character
      if (confChar.length === 1 && components.includes(confChar)) {
        console.log(`  ❌ Removing component: ${conf.character}`);
        return false;
      }
      
      return true;
    });

    if (filteredConfusions.length < originalCount) {
      analysis.commonConfusions = filteredConfusions;
      await analysis.save();
      
      console.log(`  ✅ Fixed: Removed ${originalCount - filteredConfusions.length} invalid confusions`);
      console.log(`  Remaining confusions: ${filteredConfusions.map(c => c.character).join(', ')}`);
      fixed++;
    } else {
      console.log('  ✅ Already correct');
      alreadyCorrect++;
    }
  }

  // Also check single characters for self-references
  console.log('\n' + '-'.repeat(60));
  console.log('Checking single characters for self-references...\n');
  
  const singleCharAnalyses = await CharacterAnalysis.find({
    $expr: { $eq: [{ $strLenCP: '$character' }, 1] }
  });

  console.log(`Found ${singleCharAnalyses.length} single-character entries to check\n`);

  for (const analysis of singleCharAnalyses) {
    const character = analysis.character;
    
    if (!analysis.commonConfusions || analysis.commonConfusions.length === 0) {
      continue;
    }

    const originalCount = analysis.commonConfusions.length;
    
    // Filter out self-references
    const filteredConfusions = analysis.commonConfusions.filter(conf => {
      if (conf.character === character || conf.character.includes(character)) {
        console.log(`${character}: Removing self-reference: ${conf.character}`);
        return false;
      }
      return true;
    });

    if (filteredConfusions.length < originalCount) {
      analysis.commonConfusions = filteredConfusions;
      await analysis.save();
      
      console.log(`  ✅ Fixed ${character}: Removed ${originalCount - filteredConfusions.length} self-references`);
      fixed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total entries checked: ${analyses.length + singleCharAnalyses.length}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Already correct: ${alreadyCorrect}`);
  
  if (fixed > 0) {
    console.log('\n✅ Successfully cleaned up incorrect confusion data');
    console.log('The fixed characters will now generate correct confusions on next enrichment');
  } else {
    console.log('\n✅ All character analyses are already correct');
  }
  
  console.log('='.repeat(60));
  
  process.exit(0);
}

fixCharacterAnalysisConfusions().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});