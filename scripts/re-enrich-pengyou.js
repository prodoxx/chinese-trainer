/**
 * Script to re-enrich the 朋友 card to test the improved prompts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Card from '../src/lib/db/models/Card.js';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis.js';
import { cardEnrichmentQueue } from '../src/lib/queue/queues.js';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-cards');
    console.log('✅ Connected to MongoDB');

    // Find the 朋友 card
    const card = await Card.findOne({ hanzi: '朋友' });
    
    if (!card) {
      console.log('❌ No card found for 朋友');
      return;
    }

    console.log('\n📇 Found card for 朋友:');
    console.log('   ID:', card._id);
    console.log('   Current enrichment status:', card.enrichmentStatus);
    
    // Delete existing character analysis to force regeneration
    const deleted = await CharacterAnalysis.deleteOne({ character: '朋友' });
    if (deleted.deletedCount > 0) {
      console.log('   ✅ Deleted existing character analysis');
    }

    // Update card to pending enrichment
    card.enrichmentStatus = 'pending';
    card.lastEnriched = new Date();
    await card.save();
    console.log('   ✅ Updated card status to pending');

    // Queue the enrichment job
    const queue = cardEnrichmentQueue();
    const job = await queue.add(
      `re-enrich-card-${card._id}`,
      {
        cardId: card._id.toString(),
        hanzi: card.hanzi,
        deckId: null, // Not specifying deck ID
        userId: 'system-test',
        force: true // Force re-enrichment
      }
    );

    console.log('\n🚀 Enrichment job queued:');
    console.log('   Job ID:', job.id);
    console.log('   Job Name:', job.name);
    
    console.log('\n⏳ Waiting for enrichment to complete...');
    
    // Poll job status
    let attempts = 0;
    const maxAttempts = 60; // 1 minute timeout
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const jobState = await job.getState();
      
      if (jobState === 'completed') {
        console.log('   ✅ Enrichment completed!');
        break;
      } else if (jobState === 'failed') {
        console.log('   ❌ Enrichment failed!');
        const failedReason = job.failedReason;
        console.log('   Error:', failedReason);
        break;
      } else {
        process.stdout.write(`   Status: ${jobState} (${attempts}s)\r`);
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('\n   ⏱️ Timeout waiting for enrichment');
    }

    // Check the results
    console.log('\n📊 Checking enrichment results...');
    
    const updatedCard = await Card.findById(card._id).lean();
    const newAnalysis = await CharacterAnalysis.findOne({ character: '朋友' }).lean();
    
    if (updatedCard.mnemonics && updatedCard.mnemonics.length > 0) {
      console.log('\n🧠 New Memory Aids:');
      updatedCard.mnemonics.forEach((mnemonic, i) => {
        console.log(`   ${i + 1}. ${mnemonic}`);
      });
    }
    
    if (updatedCard.etymology) {
      console.log('\n📚 New Etymology:');
      console.log('   ', updatedCard.etymology);
    }
    
    // Check for 友/有 confusion
    console.log('\n🔍 Checking for 友/有 confusion in new content:');
    
    const checkConfusion = (text) => {
      if (!text) return false;
      // Check if 有 (yǒu - to have) is mentioned when discussing 友 (yǒu - friend)
      const hasYou = text.includes('有');
      const hasFriendContext = text.includes('friend') || text.includes('友');
      return hasYou && hasFriendContext;
    };
    
    let hasConfusion = false;
    
    if (updatedCard.mnemonics) {
      updatedCard.mnemonics.forEach((mnemonic, i) => {
        if (checkConfusion(mnemonic)) {
          console.log(`   ⚠️ Still has confusion in mnemonic ${i + 1}`);
          console.log(`      "${mnemonic}"`);
          hasConfusion = true;
        }
      });
    }
    
    if (updatedCard.etymology && checkConfusion(updatedCard.etymology)) {
      console.log('   ⚠️ Still has confusion in etymology');
      console.log(`      "${updatedCard.etymology}"`);
      hasConfusion = true;
    }
    
    if (!hasConfusion) {
      console.log('   ✅ No 友/有 confusion detected in new content!');
    }
    
    // Check for proper pinyin annotations
    console.log('\n📝 Checking for pinyin annotations:');
    
    const checkPinyinAnnotations = (text) => {
      if (!text) return { count: 0, examples: [] };
      // Look for pattern: Chinese character(pinyin)
      const pattern = /[\u4e00-\u9fa5]+\([a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+\)/g;
      const matches = text.match(pattern) || [];
      return {
        count: matches.length,
        examples: matches.slice(0, 3) // First 3 examples
      };
    };
    
    let totalAnnotations = 0;
    
    if (updatedCard.mnemonics) {
      updatedCard.mnemonics.forEach((mnemonic, i) => {
        const check = checkPinyinAnnotations(mnemonic);
        if (check.count > 0) {
          totalAnnotations += check.count;
          console.log(`   ✅ Mnemonic ${i + 1} has ${check.count} pinyin annotations`);
          console.log(`      Examples: ${check.examples.join(', ')}`);
        }
      });
    }
    
    if (updatedCard.etymology) {
      const check = checkPinyinAnnotations(updatedCard.etymology);
      if (check.count > 0) {
        totalAnnotations += check.count;
        console.log(`   ✅ Etymology has ${check.count} pinyin annotations`);
        console.log(`      Examples: ${check.examples.join(', ')}`);
      }
    }
    
    if (totalAnnotations === 0) {
      console.log('   ⚠️ No pinyin annotations found in new content');
    } else {
      console.log(`   📊 Total pinyin annotations: ${totalAnnotations}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

main();