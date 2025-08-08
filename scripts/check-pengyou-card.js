/**
 * Script to find and display the 朋友 card to check if it has the character confusion issue
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Card from '../src/lib/db/models/Card.js';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis.js';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-cards');
    console.log('✅ Connected to MongoDB');

    // Find the 朋友 card
    const card = await Card.findOne({ hanzi: '朋友' }).lean();
    
    if (!card) {
      console.log('❌ No card found for 朋友');
      return;
    }

    console.log('\n📇 Card found for 朋友:');
    console.log('   ID:', card._id);
    console.log('   Hanzi:', card.hanzi);
    console.log('   Pinyin:', card.pinyin);
    console.log('   English:', card.english);
    console.log('   Enriched:', card.isEnriched ? 'Yes' : 'No');
    console.log('   Enrichment Status:', card.enrichmentStatus);
    
    if (card.mnemonics && card.mnemonics.length > 0) {
      console.log('\n🧠 Memory Aids:');
      card.mnemonics.forEach((mnemonic, i) => {
        console.log(`   ${i + 1}. ${mnemonic}`);
      });
    }
    
    if (card.etymology) {
      console.log('\n📚 Etymology:');
      console.log('   ', card.etymology);
    }

    // Check CharacterAnalysis collection
    const analysis = await CharacterAnalysis.findOne({ character: '朋友' }).lean();
    if (analysis) {
      console.log('\n📊 Character Analysis found:');
      console.log('   Created:', analysis.createdAt);
      console.log('   Updated:', analysis.updatedAt);
      
      if (analysis.aiInsights?.mnemonics && analysis.aiInsights.mnemonics.length > 0) {
        console.log('\n🤖 AI Mnemonics:');
        analysis.aiInsights.mnemonics.forEach((mnemonic, i) => {
          console.log(`   ${i + 1}. ${mnemonic}`);
        });
      }
      
      if (analysis.aiInsights?.etymology) {
        console.log('\n🤖 AI Etymology:');
        console.log('   ', analysis.aiInsights.etymology);
      }
    } else {
      console.log('\n❌ No CharacterAnalysis found for 朋友');
    }

    // Check for confusion with 有
    console.log('\n🔍 Checking for 友/有 confusion:');
    
    const checkConfusion = (text) => {
      if (!text) return false;
      // Check if 有 is mentioned when discussing 友
      return text.includes('有') && (text.includes('friend') || text.includes('友'));
    };
    
    let hasConfusion = false;
    
    if (card.mnemonics) {
      card.mnemonics.forEach((mnemonic, i) => {
        if (checkConfusion(mnemonic)) {
          console.log(`   ⚠️ Potential confusion in card mnemonic ${i + 1}: mentions both 友 and 有`);
          hasConfusion = true;
        }
      });
    }
    
    if (card.etymology && checkConfusion(card.etymology)) {
      console.log('   ⚠️ Potential confusion in card etymology: mentions both 友 and 有');
      hasConfusion = true;
    }
    
    if (analysis?.aiInsights?.mnemonics) {
      analysis.aiInsights.mnemonics.forEach((mnemonic, i) => {
        if (checkConfusion(mnemonic)) {
          console.log(`   ⚠️ Potential confusion in AI mnemonic ${i + 1}: mentions both 友 and 有`);
          hasConfusion = true;
        }
      });
    }
    
    if (analysis?.aiInsights?.etymology && checkConfusion(analysis.aiInsights.etymology)) {
      console.log('   ⚠️ Potential confusion in AI etymology: mentions both 友 and 有');
      hasConfusion = true;
    }
    
    if (!hasConfusion) {
      console.log('   ✅ No obvious 友/有 confusion detected');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

main();