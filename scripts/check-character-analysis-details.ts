#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

async function checkCharacterAnalysisDetails() {
  try {
    await connectDB();
    
    // Get all character analyses
    const analyses = await CharacterAnalysis.find().limit(5);
    
    console.log(`\n📊 Checking ${analyses.length} character analyses for mnemonics/etymology:\n`);
    
    analyses.forEach(analysis => {
      console.log(`Character: ${analysis.character} (${analysis.pinyin})`);
      console.log(`  Semantic Category: ${analysis.semanticCategory}`);
      console.log(`  Has mnemonics: ${analysis.mnemonics && analysis.mnemonics.length > 0 ? 'Yes' : 'No'}`);
      if (analysis.mnemonics && analysis.mnemonics.length > 0) {
        console.log(`  Mnemonics (${analysis.mnemonics.length}):`);
        analysis.mnemonics.forEach((m: string, i: number) => {
          console.log(`    ${i + 1}. ${m.substring(0, 60)}...`);
        });
      }
      console.log(`  Has etymology: ${analysis.etymology ? 'Yes' : 'No'}`);
      if (analysis.etymology) {
        console.log(`  Etymology: ${analysis.etymology.substring(0, 80)}...`);
      }
      console.log(`  Common confusions: ${analysis.commonConfusions?.length || 0}`);
      console.log(`  Context examples: ${analysis.contextExamples?.length || 0}`);
      console.log(`  Last analyzed: ${analysis.lastAnalyzedAt}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCharacterAnalysisDetails();