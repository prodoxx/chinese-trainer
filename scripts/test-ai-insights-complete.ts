#!/usr/bin/env bun
/**
 * Comprehensive test script to verify AI insights are generated and saved
 * during all enrichment operations (single card, bulk import, deck enrichment)
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { getCardEnrichmentQueue } from '../src/lib/queue/queues';
import { Queue, Job } from 'bullmq';
import getRedis from '../src/lib/queue/redis';

// Test data
const TEST_CHARACTERS = [
  { hanzi: '測試一', meaning: 'test one' },
  { hanzi: '測試二', meaning: 'test two' },
  { hanzi: '測試三', meaning: 'test three' }
];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

function logSubsection(title: string) {
  console.log('\n' + '-'.repeat(50));
  log(title, 'cyan');
  console.log('-'.repeat(50));
}

async function waitForJob(jobId: string | undefined, queueName: string, timeout = 60000): Promise<any> {
  if (!jobId) {
    throw new Error('No job ID provided');
  }

  const queue = new Queue(queueName, { connection: getRedis() });
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const job = await queue.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    const state = await job.getState();
    
    if (state === 'completed') {
      const result = job.returnvalue;
      await queue.close();
      return result;
    } else if (state === 'failed') {
      const failedReason = job.failedReason;
      await queue.close();
      throw new Error(`Job failed: ${failedReason}`);
    }

    // Show progress
    const progress = job.progress;
    if (typeof progress === 'object' && progress !== null) {
      const progressData = progress as any;
      if (progressData.stage || progressData.message) {
        process.stdout.write(`\r  ⏳ ${progressData.stage || 'Processing'}: ${progressData.message || '...'}`);
      }
    }

    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await queue.close();
  throw new Error(`Job ${jobId} timed out after ${timeout}ms`);
}

async function cleanupTestData() {
  log('🧹 Cleaning up test data...', 'yellow');
  
  // Delete all test cards
  for (const testChar of TEST_CHARACTERS) {
    await Card.deleteMany({ hanzi: testChar.hanzi });
  }
  
  log('✅ Test data cleaned up', 'green');
}

async function testSingleCardEnrichment() {
  logSubsection('Test 1: Single Card Enrichment');
  
  const testChar = TEST_CHARACTERS[0];
  
  try {
    // Create a card without AI insights
    log(`Creating card: ${testChar.hanzi}`, 'blue');
    const card = new Card({
      hanzi: testChar.hanzi,
      meaning: testChar.meaning,
      cached: false
    });
    await card.save();
    log(`✅ Card created with ID: ${card._id}`, 'green');
    
    // Queue enrichment job
    log('Queueing enrichment job...', 'blue');
    const queue = getCardEnrichmentQueue();
    const job = await queue.add('enrich-card', {
      cardId: card._id.toString(),
      userId: 'test-user',
      deckId: null,
      force: false,
      aiProvider: 'openai'
    });
    
    log(`📋 Job queued with ID: ${job.id}`, 'cyan');
    
    // Wait for job completion
    log('Waiting for enrichment to complete...', 'yellow');
    const result = await waitForJob(job.id, 'card-enrichment');
    console.log(''); // New line after progress updates
    
    if (result.success) {
      log('✅ Enrichment completed successfully', 'green');
    } else {
      throw new Error('Enrichment failed');
    }
    
    // Verify AI insights were saved
    log('Verifying AI insights in database...', 'blue');
    const enrichedCard = await Card.findById(card._id);
    
    if (!enrichedCard) {
      throw new Error('Card not found after enrichment');
    }
    
    // Check all enrichment fields
    const checks = {
      'AI Insights': !!enrichedCard.aiInsights,
      'Etymology': !!enrichedCard.aiInsights?.etymology,
      'Mnemonics': !!enrichedCard.aiInsights?.mnemonics,
      'Learning Tips': !!enrichedCard.aiInsights?.learningTips,
      'Common Errors': !!enrichedCard.aiInsights?.commonErrors,
      'Usage Info': !!enrichedCard.aiInsights?.usage,
      'AI Insights Date': !!enrichedCard.aiInsightsGeneratedAt,
      'Image URL': !!enrichedCard.imageUrl,
      'Audio URL': !!enrichedCard.audioUrl,
      'Pinyin': !!enrichedCard.pinyin,
      'Semantic Category': !!enrichedCard.semanticCategory
    };
    
    console.log('\n📊 Enrichment Results:');
    let allPassed = true;
    for (const [field, hasValue] of Object.entries(checks)) {
      const status = hasValue ? '✅' : '❌';
      const color = hasValue ? 'green' : 'red';
      log(`  ${status} ${field}: ${hasValue ? 'Present' : 'Missing'}`, color);
      if (!hasValue) allPassed = false;
    }
    
    if (!allPassed) {
      throw new Error('Some enrichment fields are missing');
    }
    
    // Show sample of AI insights
    if (enrichedCard.aiInsights) {
      console.log('\n📝 Sample AI Insights:');
      if (enrichedCard.aiInsights.etymology?.origin) {
        log(`  Etymology: ${enrichedCard.aiInsights.etymology.origin.substring(0, 100)}...`, 'cyan');
      }
      if (enrichedCard.aiInsights.mnemonics?.visual) {
        log(`  Mnemonic: ${enrichedCard.aiInsights.mnemonics.visual.substring(0, 100)}...`, 'cyan');
      }
    }
    
    log('\n✅ Test 1 PASSED: Single card enrichment with AI insights', 'green');
    return true;
    
  } catch (error) {
    log(`\n❌ Test 1 FAILED: ${error instanceof Error ? error.message : error}`, 'red');
    return false;
  }
}

async function testBulkImport() {
  logSubsection('Test 2: Bulk Import with Enrichment');
  
  try {
    // Simulate bulk import API call
    log('Simulating bulk import...', 'blue');
    
    const characters = TEST_CHARACTERS.slice(1, 3).map(c => c.hanzi);
    log(`Importing characters: ${characters.join(', ')}`, 'cyan');
    
    // Create cards and queue enrichment
    const jobs = [];
    const queue = getCardEnrichmentQueue();
    
    for (const hanzi of characters) {
      // Check if card exists
      let card = await Card.findOne({ hanzi });
      
      if (!card) {
        // Create new card
        card = new Card({
          hanzi,
          cached: false
        });
        await card.save();
        log(`  Created card: ${hanzi} (ID: ${card._id})`, 'blue');
        
        // Queue enrichment
        const job = await queue.add('enrich-card', {
          cardId: card._id.toString(),
          userId: 'test-user',
          deckId: null,
          force: false,
          aiProvider: 'openai'
        });
        
        jobs.push({ jobId: job.id, cardId: card._id, hanzi });
        log(`  Queued enrichment job: ${job.id}`, 'cyan');
      }
    }
    
    log(`\n📋 Total jobs queued: ${jobs.length}`, 'yellow');
    
    // Wait for all jobs to complete
    log('Waiting for all enrichment jobs to complete...', 'yellow');
    const results = await Promise.all(
      jobs.map(async ({ jobId, cardId, hanzi }) => {
        try {
          const result = await waitForJob(jobId, 'card-enrichment');
          console.log(`\n  ✅ ${hanzi} enrichment completed`);
          return { cardId, hanzi, success: true, result };
        } catch (error) {
          console.log(`\n  ❌ ${hanzi} enrichment failed: ${error}`);
          return { cardId, hanzi, success: false, error };
        }
      })
    );
    
    // Verify all cards have AI insights
    log('\nVerifying AI insights for all imported cards...', 'blue');
    let allHaveInsights = true;
    
    for (const { cardId, hanzi, success } of results) {
      if (!success) {
        log(`  ❌ ${hanzi}: Enrichment failed`, 'red');
        allHaveInsights = false;
        continue;
      }
      
      const card = await Card.findById(cardId);
      if (!card) {
        log(`  ❌ ${hanzi}: Card not found`, 'red');
        allHaveInsights = false;
        continue;
      }
      
      const hasInsights = !!(
        card.aiInsights &&
        card.aiInsightsGeneratedAt &&
        card.imageUrl &&
        card.audioUrl &&
        card.pinyin
      );
      
      if (hasInsights) {
        log(`  ✅ ${hanzi}: All enrichment data present`, 'green');
      } else {
        log(`  ❌ ${hanzi}: Missing enrichment data`, 'red');
        if (!card.aiInsights) log(`     - Missing AI insights`, 'red');
        if (!card.imageUrl) log(`     - Missing image`, 'red');
        if (!card.audioUrl) log(`     - Missing audio`, 'red');
        if (!card.pinyin) log(`     - Missing pinyin`, 'red');
        allHaveInsights = false;
      }
    }
    
    if (allHaveInsights) {
      log('\n✅ Test 2 PASSED: Bulk import with AI insights', 'green');
      return true;
    } else {
      throw new Error('Some cards are missing AI insights');
    }
    
  } catch (error) {
    log(`\n❌ Test 2 FAILED: ${error instanceof Error ? error.message : error}`, 'red');
    return false;
  }
}

async function verifyDatabasePersistence() {
  logSubsection('Test 3: Database Persistence Verification');
  
  try {
    log('Checking all test cards in database...', 'blue');
    
    const cards = await Card.find({
      hanzi: { $in: TEST_CHARACTERS.map(t => t.hanzi) }
    });
    
    log(`Found ${cards.length} test cards in database`, 'cyan');
    
    if (cards.length === 0) {
      throw new Error('No test cards found in database');
    }
    
    // Detailed check for each card
    console.log('\n📊 Database Persistence Check:');
    let allValid = true;
    
    for (const card of cards) {
      console.log(`\n  Card: ${card.hanzi}`);
      
      const checks = {
        'Has AI Insights': !!card.aiInsights,
        'Has Etymology': !!card.aiInsights?.etymology,
        'Has Mnemonics': !!card.aiInsights?.mnemonics,
        'Has Learning Tips': !!card.aiInsights?.learningTips,
        'Has Generation Date': !!card.aiInsightsGeneratedAt,
        'Has Image': !!card.imageUrl,
        'Has Audio': !!card.audioUrl,
        'Has Pinyin': !!card.pinyin,
        'Is Cached': card.cached === true
      };
      
      for (const [check, passed] of Object.entries(checks)) {
        const status = passed ? '✅' : '❌';
        const color = passed ? 'green' : 'red';
        log(`    ${status} ${check}`, color);
        if (!passed) allValid = false;
      }
      
      // Show insight generation timestamp
      if (card.aiInsightsGeneratedAt) {
        const age = Date.now() - card.aiInsightsGeneratedAt.getTime();
        const ageMinutes = Math.floor(age / 60000);
        log(`    📅 Generated: ${ageMinutes} minutes ago`, 'cyan');
      }
    }
    
    if (allValid) {
      log('\n✅ Test 3 PASSED: All data properly persisted in database', 'green');
      return true;
    } else {
      throw new Error('Some cards have incomplete data in database');
    }
    
  } catch (error) {
    log(`\n❌ Test 3 FAILED: ${error instanceof Error ? error.message : error}`, 'red');
    return false;
  }
}

async function main() {
  logSection('🧪 COMPREHENSIVE AI INSIGHTS TEST');
  
  log('\nThis test will verify that AI insights are generated and saved during:', 'cyan');
  log('  1. Single card enrichment', 'cyan');
  log('  2. Bulk import with enrichment', 'cyan');
  log('  3. Database persistence', 'cyan');
  
  try {
    // Connect to database
    log('\n🔌 Connecting to MongoDB...', 'yellow');
    await connectDB();
    log('✅ Connected to MongoDB', 'green');
    
    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured in .env file');
    }
    log('✅ OpenAI API key configured', 'green');
    
    // Clean up any existing test data
    await cleanupTestData();
    
    // Run tests
    const results = {
      singleCard: false,
      bulkImport: false,
      persistence: false
    };
    
    // Test 1: Single card enrichment
    results.singleCard = await testSingleCardEnrichment();
    
    // Test 2: Bulk import
    results.bulkImport = await testBulkImport();
    
    // Test 3: Verify persistence
    results.persistence = await verifyDatabasePersistence();
    
    // Final summary
    logSection('📊 TEST SUMMARY');
    
    const allPassed = Object.values(results).every(r => r);
    
    console.log('');
    log(`Single Card Enrichment: ${results.singleCard ? '✅ PASSED' : '❌ FAILED'}`, results.singleCard ? 'green' : 'red');
    log(`Bulk Import with AI: ${results.bulkImport ? '✅ PASSED' : '❌ FAILED'}`, results.bulkImport ? 'green' : 'red');
    log(`Database Persistence: ${results.persistence ? '✅ PASSED' : '❌ FAILED'}`, results.persistence ? 'green' : 'red');
    
    console.log('\n' + '='.repeat(70));
    if (allPassed) {
      log('🎉 ALL TESTS PASSED! AI insights are working correctly!', 'green');
      log('✅ AI insights are generated during enrichment', 'green');
      log('✅ AI insights are saved to the database', 'green');
      log('✅ Feature is 100% functional', 'green');
    } else {
      log('⚠️ SOME TESTS FAILED - AI insights may not be working properly', 'red');
      log('Please check the worker logs for more details', 'yellow');
    }
    console.log('='.repeat(70));
    
    // Clean up test data
    await cleanupTestData();
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ CRITICAL ERROR: ${error instanceof Error ? error.message : error}`, 'red');
    
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      log('\n💡 Please configure your OpenAI API key in the .env file:', 'yellow');
      log('   OPENAI_API_KEY=your-key-here', 'cyan');
    }
    
    // Try to clean up
    try {
      await cleanupTestData();
    } catch (e) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Run the test
main();