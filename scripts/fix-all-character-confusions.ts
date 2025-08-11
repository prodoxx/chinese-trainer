#!/usr/bin/env bun

/**
 * Comprehensive fix for all character analysis confusion issues
 */

import dotenv from 'dotenv';
import connectDB from '../src/lib/db/mongodb';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

dotenv.config();

async function fixAllConfusions() {
  console.log('='.repeat(70));
  console.log('COMPREHENSIVE CHARACTER ANALYSIS FIX');
  console.log('='.repeat(70));
  console.log('Fixing all self-references and component issues in confusion lists\n');

  await connectDB();

  // Get all character analyses
  const allAnalyses = await CharacterAnalysis.find({});
  console.log(`Found ${allAnalyses.length} total character analyses to check\n`);

  let fixed = 0;
  let alreadyCorrect = 0;
  const issues: string[] = [];

  for (const analysis of allAnalyses) {
    const character = analysis.character;
    const isMultiChar = character.length > 1;
    
    if (!analysis.commonConfusions || analysis.commonConfusions.length === 0) {
      alreadyCorrect++;
      continue;
    }

    const originalCount = analysis.commonConfusions.length;
    const components = character.split('');
    
    // Filter out problematic confusions
    const filteredConfusions = analysis.commonConfusions.filter(conf => {
      // Extract the character without pinyin/parentheses
      const confChar = conf.character.split('(')[0].split('（')[0].trim();
      
      // Check for self-reference
      if (confChar === character) {
        issues.push(`${character}: Removed self-reference "${conf.character}"`);
        return false;
      }
      
      // For multi-character words, check for component characters
      if (isMultiChar) {
        // Check if it's a single component character
        if (confChar.length === 1 && components.includes(confChar)) {
          issues.push(`${character}: Removed component "${conf.character}"`);
          return false;
        }
        
        // Also check without spaces (sometimes formatted as "房 (fáng)")
        const cleanChar = conf.character.replace(/\s+/g, '').split('(')[0];
        if (cleanChar.length === 1 && components.includes(cleanChar)) {
          issues.push(`${character}: Removed component "${conf.character}"`);
          return false;
        }
      }
      
      return true;
    });

    if (filteredConfusions.length < originalCount) {
      analysis.commonConfusions = filteredConfusions;
      await analysis.save();
      
      fixed++;
      console.log(`✅ Fixed ${character}: ${originalCount} → ${filteredConfusions.length} confusions`);
      
      if (filteredConfusions.length === 0) {
        console.log(`   Note: No confusions left, will regenerate on next enrichment`);
      }
    } else {
      alreadyCorrect++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('DETAILED ISSUES FIXED:');
  console.log('='.repeat(70));
  
  if (issues.length > 0) {
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('  No issues found');
  }

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total analyses checked: ${allAnalyses.length}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Already correct: ${alreadyCorrect}`);
  console.log(`Success rate: ${((alreadyCorrect / allAnalyses.length) * 100).toFixed(1)}%`);
  
  if (fixed > 0) {
    console.log('\n✅ Successfully cleaned up incorrect confusion data');
    console.log('Characters with cleared confusions will regenerate them on next enrichment');
  } else {
    console.log('\n✅ All character analyses are already correct!');
  }
  
  console.log('='.repeat(70));
  
  // List characters that now need regeneration (have 0 confusions)
  const needsRegeneration = await CharacterAnalysis.find({
    $or: [
      { commonConfusions: { $size: 0 } },
      { commonConfusions: { $exists: false } }
    ]
  }).select('character');
  
  if (needsRegeneration.length > 0) {
    console.log(`\nCharacters needing confusion regeneration (${needsRegeneration.length}):`);
    console.log(needsRegeneration.map(a => a.character).join(', '));
  }
  
  process.exit(0);
}

fixAllConfusions().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});