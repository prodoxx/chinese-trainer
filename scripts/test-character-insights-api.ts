#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function testCharacterInsightsAPI() {
  try {
    await connectDB();
    
    // Find a card that has been analyzed
    const card = await Card.findOne({ hanzi: '行' });
    
    if (!card) {
      console.log('No card found for 行');
      process.exit(1);
    }
    
    console.log(`\n🧪 Testing character insights API for: ${card.hanzi} (${card._id})\n`);
    
    // Simulate API call
    const response = await fetch('http://localhost:3000/api/analytics/character-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        characterId: card._id.toString(),
        includeAI: false
      }),
    });
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const insights = data.insights;
      console.log('✅ API returned insights successfully\n');
      console.log('Character:', insights.character.hanzi);
      console.log('Pinyin:', insights.character.pinyin);
      console.log('Meaning:', insights.character.meaning);
      console.log('\nComplexity Analysis:');
      console.log('  Semantic Category:', insights.complexity.semanticCategory);
      console.log('  Overall Difficulty:', insights.complexity.overallDifficulty);
      console.log('  Has mnemonics:', insights.complexity.mnemonics ? 'Yes' : 'No');
      if (insights.complexity.mnemonics) {
        console.log('  Mnemonics count:', insights.complexity.mnemonics.length);
        insights.complexity.mnemonics.forEach((m: string, i: number) => {
          console.log(`    ${i + 1}. ${m.substring(0, 60)}...`);
        });
      }
      console.log('  Has etymology:', insights.complexity.etymology ? 'Yes' : 'No');
      if (insights.complexity.etymology) {
        console.log('  Etymology:', insights.complexity.etymology.substring(0, 80) + '...');
      }
    } else {
      console.error('❌ API returned error:', data.error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Note: This requires the Next.js dev server to be running
console.log('Note: Make sure the Next.js dev server is running on http://localhost:3000');
testCharacterInsightsAPI();