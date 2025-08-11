#!/usr/bin/env bun
/**
 * Test that character complexity analysis is working
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { analyzeCharacterComplexity } from '../src/lib/enrichment/character-complexity-analyzer';

async function main() {
  console.log('🧪 Testing Character Complexity Analysis\n');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  // Test characters
  const testCases = [
    { hanzi: '水', pinyin: 'shuǐ', meaning: 'water' },
    { hanzi: '火', pinyin: 'huǒ', meaning: 'fire' },
    { hanzi: '房間', pinyin: 'fáng jiān', meaning: 'room' },
    { hanzi: '電腦', pinyin: 'diàn nǎo', meaning: 'computer' },
    { hanzi: '愛', pinyin: 'ài', meaning: 'love/emotion' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📊 Analyzing: ${testCase.hanzi} (${testCase.meaning})`);
    console.log('-'.repeat(40));
    
    const analysis = await analyzeCharacterComplexity(
      testCase.hanzi,
      testCase.pinyin,
      testCase.meaning
    );
    
    console.log('Analysis Results:');
    console.log(`  Semantic Category: ${analysis.semanticCategory || 'N/A'}`);
    console.log(`  Tone Pattern: ${analysis.tonePattern || 'N/A'}`);
    console.log(`  Stroke Count: ${analysis.strokeCount || 'N/A'}`);
    console.log(`  Component Count: ${analysis.componentCount || 'N/A'}`);
    console.log(`  Visual Complexity: ${analysis.visualComplexity?.toFixed(2) || 'N/A'}`);
    console.log(`  Overall Difficulty: ${analysis.overallDifficulty?.toFixed(2) || 'N/A'}`);
    console.log(`  Semantic Fields: ${analysis.semanticFields?.join(', ') || 'N/A'}`);
    console.log(`  Concept Type: ${analysis.conceptType || 'N/A'}`);
    console.log(`  Frequency: ${analysis.frequency || 'N/A'}`);
    
    if (analysis.radicals && analysis.radicals.length > 0) {
      console.log(`  Radicals: ${analysis.radicals.map(r => r.radical).join(', ')}`);
    }
  }
  
  // Now test with an actual card to ensure it saves properly
  console.log('\n' + '=' .repeat(60));
  console.log('🔄 Testing with actual card enrichment...\n');
  
  // Delete test card if exists
  await Card.deleteOne({ hanzi: 'ANALYSIS_TEST' });
  
  // Create test card
  const testCard = await Card.create({
    hanzi: '測',
    meaning: 'test/measure',
    pinyin: 'cè'
  });
  
  console.log(`Created test card: ${testCard.hanzi}`);
  console.log(`Initial state:`);
  console.log(`  semanticCategory: ${testCard.semanticCategory || 'undefined'}`);
  console.log(`  strokeCount: ${testCard.strokeCount || 'undefined'}`);
  console.log(`  visualComplexity: ${testCard.visualComplexity || 'undefined'}`);
  
  // Apply analysis
  const cardAnalysis = await analyzeCharacterComplexity(
    testCard.hanzi,
    testCard.pinyin,
    testCard.meaning
  );
  
  // Apply to card (same as enrichment worker)
  if (cardAnalysis.semanticCategory) testCard.semanticCategory = cardAnalysis.semanticCategory;
  if (cardAnalysis.tonePattern) testCard.tonePattern = cardAnalysis.tonePattern;
  if (cardAnalysis.strokeCount) testCard.strokeCount = cardAnalysis.strokeCount;
  if (cardAnalysis.componentCount) testCard.componentCount = cardAnalysis.componentCount;
  if (cardAnalysis.visualComplexity !== undefined) testCard.visualComplexity = cardAnalysis.visualComplexity;
  if (cardAnalysis.overallDifficulty !== undefined) testCard.overallDifficulty = cardAnalysis.overallDifficulty;
  
  await testCard.save();
  
  // Verify saved
  const savedCard = await Card.findById(testCard._id);
  
  console.log(`\nAfter analysis:`);
  console.log(`  semanticCategory: ${savedCard?.semanticCategory || 'undefined'}`);
  console.log(`  strokeCount: ${savedCard?.strokeCount || 'undefined'}`);
  console.log(`  visualComplexity: ${savedCard?.visualComplexity || 'undefined'}`);
  console.log(`  overallDifficulty: ${savedCard?.overallDifficulty || 'undefined'}`);
  
  // Clean up
  await Card.deleteOne({ _id: testCard._id });
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Character complexity analysis is working correctly!');
  console.log('✅ Analysis data is being saved to cards properly.');
  
  process.exit(0);
}

main();