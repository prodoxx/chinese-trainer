#!/usr/bin/env bun
/**
 * Test that the Character Insights API returns AI insights
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function main() {
  console.log('🧪 Testing Character Insights API\n');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Find a card with AI insights
    const cardWithInsights = await Card.findOne({ 
      aiInsights: { $exists: true, $ne: null }
    });
    
    if (!cardWithInsights) {
      console.log('❌ No cards with AI insights found in database');
      process.exit(1);
    }
    
    console.log(`Found card with AI insights: ${cardWithInsights.hanzi}`);
    console.log(`Card ID: ${cardWithInsights._id}`);
    console.log(`Has AI insights: ${!!cardWithInsights.aiInsights}`);
    console.log(`Has timestamp: ${!!cardWithInsights.aiInsightsGeneratedAt}`);
    
    // Test the API endpoint
    console.log('\n📡 Testing API endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/analytics/character-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        characterId: cardWithInsights._id.toString()
      })
    });
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('❌ API returned error:', data.error);
      process.exit(1);
    }
    
    // Check the response
    console.log('API Response Analysis:');
    console.log('='.repeat(50));
    console.log(`Success: ${data.success}`);
    console.log(`Has insights object: ${!!data.insights}`);
    console.log(`Has character data: ${!!data.insights?.character}`);
    console.log(`Has complexity data: ${!!data.insights?.complexity}`);
    console.log(`Has AI insights: ${!!data.insights?.aiInsights}`);
    
    if (data.insights?.aiInsights) {
      console.log('\n✅ AI Insights Content:');
      console.log(`  Etymology: ${!!data.insights.aiInsights.etymology}`);
      console.log(`  Mnemonics: ${!!data.insights.aiInsights.mnemonics}`);
      console.log(`  Learning Tips: ${!!data.insights.aiInsights.learningTips}`);
      console.log(`  Common Errors: ${!!data.insights.aiInsights.commonErrors}`);
      console.log(`  Usage: ${!!data.insights.aiInsights.usage}`);
      
      // Show sample
      if (data.insights.aiInsights.mnemonics?.visual) {
        console.log(`\n📝 Sample Mnemonic:`);
        console.log(`  ${data.insights.aiInsights.mnemonics.visual.substring(0, 100)}...`);
      }
    } else {
      console.log('\n❌ No AI insights in API response!');
      console.log('This is why they are not showing in the UI.');
    }
    
    console.log('\n' + '='.repeat(50));
    if (data.insights?.aiInsights) {
      console.log('✅ API is returning AI insights correctly');
      console.log('The UI should display Memory Aids, Etymology, and Learning Tips sections');
    } else {
      console.log('❌ API is not returning AI insights');
      console.log('Check the server logs for error messages');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();