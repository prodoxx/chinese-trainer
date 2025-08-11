#!/usr/bin/env bun
/**
 * Final comprehensive test for AI insights generation
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';
import { getCardEnrichmentQueue } from '../src/lib/queue/queues';
import { Queue } from 'bullmq';
import getRedis from '../src/lib/queue/redis';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function waitForJob(jobId: string | undefined, timeout = 60000): Promise<boolean> {
  if (!jobId) return false;
  
  const queue = new Queue('card-enrichment', { connection: getRedis() });
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const job = await queue.getJob(jobId);
    if (!job) return false;
    
    const state = await job.getState();
    
    if (state === 'completed') {
      await queue.close();
      return true;
    } else if (state === 'failed') {
      const reason = job.failedReason;
      log(`Job failed: ${reason}`, 'red');
      await queue.close();
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await queue.close();
  return false;
}

async function testCharacterEnrichment(hanzi: string, testName: string): Promise<boolean> {
  log(`\n${testName}`, 'cyan');
  log('='.repeat(50), 'cyan');
  
  try {
    // Clean up any existing data
    await Card.deleteMany({ hanzi });
    await CharacterAnalysis.deleteMany({ character: hanzi });
    
    // Create card
    log(`Creating card: ${hanzi}`, 'blue');
    const card = new Card({
      hanzi,
      meaning: 'test character',
      cached: false
    });
    await card.save();
    log(`✅ Card created: ${card._id}`, 'green');
    
    // Queue enrichment
    log('Queueing enrichment...', 'yellow');
    const queue = getCardEnrichmentQueue();
    const job = await queue.add('enrich-card', {
      cardId: card._id.toString(),
      userId: 'test-user',
      deckId: null,
      force: false,
      aiProvider: 'openai'
    });
    
    // Wait for completion
    log('Waiting for enrichment...', 'yellow');
    const success = await waitForJob(job.id, 60000);
    
    if (!success) {
      log('❌ Enrichment failed or timed out', 'red');
      return false;
    }
    
    // Check results
    const enrichedCard = await Card.findById(card._id);
    if (!enrichedCard) {
      log('❌ Card not found after enrichment', 'red');
      return false;
    }
    
    // Validate all fields
    const validations = {
      'AI Insights': !!enrichedCard.aiInsights,
      'Etymology': !!enrichedCard.aiInsights?.etymology,
      'Mnemonics': !!enrichedCard.aiInsights?.mnemonics,
      'Learning Tips': !!enrichedCard.aiInsights?.learningTips,
      'Generation Date': !!enrichedCard.aiInsightsGeneratedAt,
      'Image URL': !!enrichedCard.imageUrl,
      'Audio URL': !!enrichedCard.audioUrl,
      'Pinyin': !!enrichedCard.pinyin,
      'Cached Flag': enrichedCard.cached === true
    };
    
    let allValid = true;
    log('\n📊 Validation Results:', 'bright');
    for (const [field, isValid] of Object.entries(validations)) {
      const icon = isValid ? '✅' : '❌';
      const color = isValid ? 'green' : 'red';
      log(`  ${icon} ${field}`, color);
      if (!isValid) allValid = false;
    }
    
    if (allValid) {
      log(`\n✅ ${testName} PASSED`, 'green');
      
      // Show sample data
      if (enrichedCard.aiInsights?.etymology?.origin) {
        log(`\n📝 Sample Etymology:`, 'cyan');
        log(`  ${enrichedCard.aiInsights.etymology.origin.substring(0, 100)}...`, 'reset');
      }
      if (enrichedCard.aiInsightsGeneratedAt) {
        log(`\n📅 Generated at: ${enrichedCard.aiInsightsGeneratedAt}`, 'cyan');
      }
    } else {
      log(`\n❌ ${testName} FAILED - Missing required fields`, 'red');
    }
    
    // Cleanup
    await Card.deleteOne({ _id: card._id });
    await CharacterAnalysis.deleteMany({ character: hanzi });
    
    return allValid;
    
  } catch (error) {
    log(`❌ Error in ${testName}: ${error}`, 'red');
    return false;
  }
}

async function main() {
  console.log('');
  log('🧪 FINAL AI INSIGHTS VERIFICATION TEST', 'bright');
  log('='.repeat(50), 'bright');
  
  try {
    // Connect to database
    log('\nConnecting to MongoDB...', 'yellow');
    await connectDB();
    log('✅ Connected', 'green');
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    log('✅ OpenAI API key configured', 'green');
    
    // Test different characters
    const tests = [
      { hanzi: '學習', name: 'Test 1: Two-character word' },
      { hanzi: '書', name: 'Test 2: Single character' },
      { hanzi: '電腦', name: 'Test 3: Modern term' }
    ];
    
    const results: boolean[] = [];
    
    for (const test of tests) {
      const passed = await testCharacterEnrichment(test.hanzi, test.name);
      results.push(passed);
    }
    
    // Final summary
    console.log('');
    log('='.repeat(50), 'bright');
    log('📊 FINAL SUMMARY', 'bright');
    log('='.repeat(50), 'bright');
    
    const totalPassed = results.filter(r => r).length;
    const totalTests = results.length;
    
    log(`\nTests Passed: ${totalPassed}/${totalTests}`, totalPassed === totalTests ? 'green' : 'yellow');
    
    if (totalPassed === totalTests) {
      log('\n🎉 SUCCESS! AI insights are 100% working!', 'green');
      log('✅ AI insights are generated during enrichment', 'green');
      log('✅ AI insights are saved with timestamps', 'green');
      log('✅ Cards are properly marked as cached', 'green');
      log('✅ All enrichment data is persisted', 'green');
    } else {
      log('\n⚠️ Some tests failed - please check the logs', 'yellow');
    }
    
    process.exit(totalPassed === totalTests ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Critical error: ${error}`, 'red');
    process.exit(1);
  }
}

main();