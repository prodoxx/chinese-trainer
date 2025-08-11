#!/usr/bin/env bun
/**
 * Fix AI insights for a specific card
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function main() {
  const targetHanzi = '房間';
  
  console.log(`🔧 Fixing AI Insights for "${targetHanzi}"\n`);
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Find the specific card
    const card = await Card.findOne({ hanzi: targetHanzi });
    
    if (!card) {
      console.log(`❌ Card not found: ${targetHanzi}`);
      process.exit(1);
    }
    
    console.log(`Found card: ${card.hanzi}`);
    console.log(`Current AI insights structure:`);
    console.log(`  - Has etymology.origin: ${!!card.aiInsights?.etymology?.origin}`);
    console.log(`  - Has mnemonics.visual: ${!!card.aiInsights?.mnemonics?.visual}`);
    console.log(`  - Has learningTips: ${card.aiInsights?.learningTips?.forBeginners?.length || 0} tips`);
    console.log(`  - Has root mnemonics: ${card.mnemonics?.length || 0}`);
    console.log(`  - Has root etymology: ${!!card.etymology}\n`);
    
    // Build proper AI insights from existing data
    const properAiInsights = {
      etymology: {
        origin: card.etymology || '房間 (fáng jiān) means "room". The character 房 (fáng) refers to a house or building, while 間 (jiān) indicates a space or interval. Together, they describe a space within a building.',
        evolution: [
          '房 originally depicted a house structure with a roof',
          '間 showed a door (門) with the sun (日) shining through, indicating a space',
          'Combined, they represent a defined space within a building'
        ],
        culturalContext: 'Commonly used in everyday Taiwan Mandarin to refer to any room in a house or building'
      },
      mnemonics: {
        visual: card.mnemonics?.[0] || 'Picture a house (房) with a door (間) - this is your room! The roof shape of 房 reminds you of a house, and 間 has a door shape showing the entrance to your room.',
        story: card.mnemonics?.[1] || 'Imagine walking into a house (房) and opening a door (間) to enter your room. The combination creates the perfect image of a "room" - a space within a house.',
        components: '房 (house) + 間 (space/interval) = 房間 (room). Break it down: a house with defined spaces inside equals rooms!'
      },
      commonErrors: {
        similarCharacters: ['房子 (fáng zi) - house', '時間 (shí jiān) - time', '空間 (kōng jiān) - space'],
        wrongContexts: ['Don\'t confuse with 房子 which means the whole house, not just a room'],
        toneConfusions: ['Be careful with the tones: fáng (2nd tone) jiān (1st tone)']
      },
      usage: {
        commonCollocations: ['臥房 (bedroom)', '客廳 (living room)', '浴室 (bathroom)', '廚房 (kitchen)'],
        registerLevel: 'neutral',
        frequency: 'high',
        domains: ['daily life', 'housing', 'architecture']
      },
      learningTips: {
        forBeginners: [
          'Remember: 房 looks like a house with a roof, 間 has a door inside',
          'Practice saying "fáng jiān" with correct tones: rising then flat',
          'Use it in simple sentences: 我的房間 (wǒ de fáng jiān) - my room'
        ],
        forIntermediate: [
          'Learn room types: 臥房間 (bedroom), 書房 (study room)',
          'Practice describing rooms: 房間很大 (the room is big), 房間很亮 (the room is bright)'
        ],
        forAdvanced: [
          'Explore related vocabulary: 房租 (rent), 房東 (landlord), 房客 (tenant)',
          'Study the measure word usage: 一間房間 (one room), 兩間房間 (two rooms)'
        ]
      }
    };
    
    // Update the card
    card.aiInsights = properAiInsights;
    card.aiInsightsGeneratedAt = card.aiInsightsGeneratedAt || new Date();
    
    await card.save();
    
    console.log('✅ Fixed AI insights structure!');
    console.log('\nNew structure:');
    console.log(`  - Etymology: ✅`);
    console.log(`  - Mnemonics: ✅`);
    console.log(`  - Learning Tips: ✅ (${properAiInsights.learningTips.forBeginners.length} beginner tips)`);
    console.log(`  - Common Errors: ✅`);
    console.log(`  - Usage Info: ✅`);
    console.log('\n🎉 The Character Insights modal should now display all sections properly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();