#!/usr/bin/env bun
/**
 * Test Character Insights API to see what data is returned
 */

import connectDB from '../src/lib/db/mongodb';

async function testCharacterInsightsAPI() {
  console.log('🔍 Testing Character Insights API\n');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  // Get a card ID for testing
  const Card = require('../src/lib/db/models/Card').default;
  const testCard = await Card.findOne({ hanzi: '房間' });
  
  if (!testCard) {
    console.error('Test card not found');
    process.exit(1);
  }
  
  console.log(`Testing with card: ${testCard.hanzi} (ID: ${testCard._id})`);
  console.log('-'.repeat(40));
  
  // Simulate the API call
  const { POST } = require('../src/app/api/analytics/character-insights/route');
  
  // Create a mock request
  const mockRequest = {
    json: async () => ({ characterId: testCard._id.toString() })
  };
  
  const response = await POST(mockRequest as any);
  const data = await response.json();
  
  if (data.success) {
    console.log('\n✅ API Response received successfully\n');
    
    const insights = data.insights;
    
    // Check AI insights structure
    console.log('AI Insights Structure:');
    console.log(`  Has aiInsights: ${!!insights.aiInsights}`);
    
    if (insights.aiInsights) {
      console.log(`  aiInsights keys: ${Object.keys(insights.aiInsights).join(', ')}`);
      
      // Check each section
      console.log('\nEtymology:');
      console.log(`  - origin: ${insights.aiInsights.etymology?.origin ? '✓ ' + insights.aiInsights.etymology.origin.substring(0, 50) + '...' : '✗'}`);
      console.log(`  - evolution: ${insights.aiInsights.etymology?.evolution?.length || 0} items`);
      console.log(`  - culturalContext: ${!!insights.aiInsights.etymology?.culturalContext ? '✓' : '✗'}`);
      
      console.log('\nMnemonics:');
      console.log(`  - visual: ${!!insights.aiInsights.mnemonics?.visual ? '✓' : '✗'}`);
      console.log(`  - story: ${!!insights.aiInsights.mnemonics?.story ? '✓' : '✗'}`);
      console.log(`  - components: ${!!insights.aiInsights.mnemonics?.components ? '✓' : '✗'}`);
      
      console.log('\nCommon Errors:');
      console.log(`  - similarCharacters: ${insights.aiInsights.commonErrors?.similarCharacters?.length || 0} items`);
      if (insights.aiInsights.commonErrors?.similarCharacters?.length > 0) {
        insights.aiInsights.commonErrors.similarCharacters.slice(0, 3).forEach((char: string) => {
          console.log(`    • ${char}`);
        });
      }
      console.log(`  - wrongContexts: ${insights.aiInsights.commonErrors?.wrongContexts?.length || 0} items`);
      console.log(`  - toneConfusions: ${insights.aiInsights.commonErrors?.toneConfusions?.length || 0} items`);
      
      console.log('\nUsage:');
      console.log(`  - commonCollocations: ${insights.aiInsights.usage?.commonCollocations?.length || 0} items`);
      if (insights.aiInsights.usage?.commonCollocations?.length > 0) {
        insights.aiInsights.usage.commonCollocations.slice(0, 3).forEach((col: string) => {
          console.log(`    • ${col}`);
        });
      }
      console.log(`  - registerLevel: ${insights.aiInsights.usage?.registerLevel || '✗'}`);
      console.log(`  - frequency: ${insights.aiInsights.usage?.frequency || '✗'}`);
      console.log(`  - domains: ${insights.aiInsights.usage?.domains?.length || 0} items`);
      
      console.log('\nLearning Tips:');
      console.log(`  - forBeginners: ${insights.aiInsights.learningTips?.forBeginners?.length || 0} tips`);
      console.log(`  - forIntermediate: ${insights.aiInsights.learningTips?.forIntermediate?.length || 0} tips`);
      console.log(`  - forAdvanced: ${insights.aiInsights.learningTips?.forAdvanced?.length || 0} tips`);
      
      // Check if sections would be displayed
      console.log('\n' + '=' .repeat(60));
      console.log('UI Display Check:');
      
      const hasCommonErrors = insights.aiInsights.commonErrors && (
        insights.aiInsights.commonErrors.similarCharacters?.length > 0 || 
        insights.aiInsights.commonErrors.wrongContexts?.length > 0 || 
        insights.aiInsights.commonErrors.toneConfusions?.length > 0
      );
      
      const hasUsage = insights.aiInsights.usage && (
        insights.aiInsights.usage.commonCollocations?.length > 0 || 
        insights.aiInsights.usage.registerLevel || 
        insights.aiInsights.usage.frequency || 
        insights.aiInsights.usage.domains?.length > 0
      );
      
      const hasLearningTips = insights.aiInsights.learningTips && (
        insights.aiInsights.learningTips.forBeginners?.length > 0 || 
        insights.aiInsights.learningTips.forIntermediate?.length > 0 || 
        insights.aiInsights.learningTips.forAdvanced?.length > 0
      );
      
      console.log(`  Common Errors section would display: ${hasCommonErrors ? '✓ YES' : '✗ NO'}`);
      console.log(`  Usage section would display: ${hasUsage ? '✓ YES' : '✗ NO'}`);
      console.log(`  Learning Tips section would display: ${hasLearningTips ? '✓ YES' : '✗ NO'}`);
      
    } else {
      console.log('  ❌ No AI insights in response');
    }
    
    // Also check confusion analysis
    console.log('\n' + '=' .repeat(60));
    console.log('Confusion Analysis:');
    console.log(`  Items: ${insights.confusionAnalysis?.length || 0}`);
    if (insights.confusionAnalysis?.length > 0) {
      insights.confusionAnalysis.forEach((item: any) => {
        console.log(`  • ${item.character} (${item.pinyin}) - ${item.meaning}`);
      });
    }
    
  } else {
    console.error('❌ API Error:', data.error);
  }
  
  process.exit(0);
}

testCharacterInsightsAPI();