import { Worker, Job } from "bullmq";
import getRedis from "../redis";
import { BulkImportJobData, getCardEnrichmentQueue } from "../queues";
import connectDB from "@/lib/db/mongodb";
import Card from "@/lib/db/models/Card";
import { validateTraditionalChinese } from "@/lib/utils/chinese-validation";
import { checkSharedMediaExists } from "@/lib/enrichment/shared-media";
import { registerWorker } from "../worker-monitor";
import {
	BATCH_CONFIG,
	PARALLEL_CONFIG,
	WORKER_CONCURRENCY,
	JOB_CONFIG,
	JOB_PRIORITIES,
	getWorkerConcurrency,
} from "../config";

// Rate limiter for API calls
class RateLimiter {
  private lastCallTime: number = 0;
  private minDelayMs: number;

  constructor(callsPerSecond: number) {
    this.minDelayMs = 1000 / callsPerSecond;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCallTime = Date.now();
  }
}

// Create rate limiters for different services
const openAIRateLimiter = new RateLimiter(2); // 2 calls per second for OpenAI
const falRateLimiter = new RateLimiter(1); // 1 call per second for fal.ai

export const bulkImportWorker = new Worker<BulkImportJobData>(
  "bulk-import",
  async (job: Job<BulkImportJobData>) => {
    const { characters, userId, sessionId, enrichImmediately, aiProvider } = job.data;

    console.log(`\n🚀 Starting bulk import job ${job.id}`);
    console.log(`   Total characters: ${characters.length}`);
    console.log(`   Enrich immediately: ${enrichImmediately}`);
    console.log(`   AI Provider: ${aiProvider || 'openai'}`);
    console.log(`   Batch size: ${BATCH_CONFIG.BULK_IMPORT_BATCH_SIZE}`);

    const results = {
      created: [] as any[],
      skipped: [] as any[],
      errors: [] as any[],
      enrichmentJobs: [] as any[]
    };

    try {
      await connectDB();

      // Process characters in batches
      const totalBatches = Math.ceil(characters.length / BATCH_CONFIG.BULK_IMPORT_BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * BATCH_CONFIG.BULK_IMPORT_BATCH_SIZE;
        const end = Math.min(start + BATCH_CONFIG.BULK_IMPORT_BATCH_SIZE, characters.length);
        const batch = characters.slice(start, end);
        
        console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} characters)`);

        // Update job progress
        await job.updateProgress({
          stage: "processing",
          message: `Processing batch ${batchIndex + 1} of ${totalBatches}`,
          processed: start,
          total: characters.length,
          batchIndex: batchIndex + 1,
          totalBatches,
          results: {
            created: results.created.length,
            skipped: results.skipped.length,
            errors: results.errors.length
          }
        });

        // Process each character in the batch
        // Split batch into sub-groups for enrichment concurrency control
        const enrichmentQueue: Array<() => Promise<void>> = [];
        
        const batchPromises = batch.map(async (hanzi) => {
          try {
            // Validate Traditional Chinese
            const validation = validateTraditionalChinese(hanzi);
            if (!validation.isValid) {
              results.errors.push({
                hanzi,
                error: validation.errors[0] || 'Invalid Traditional Chinese'
              });
              return;
            }

            const cleanedHanzi = validation.cleanedText;

            // Check if card already exists
            const existingCard = await Card.findOne({ hanzi: cleanedHanzi });
            
            if (existingCard) {
              results.skipped.push({
                hanzi: cleanedHanzi,
                reason: 'Already exists',
                cardId: existingCard._id
              });
              
              // If card exists but needs enrichment, add to queue
              if (enrichImmediately && (!existingCard.cached || !existingCard.imageUrl || !existingCard.audioUrl)) {
                enrichmentQueue.push(() => queueEnrichmentWithRateLimit(
                  existingCard._id.toString(),
                  cleanedHanzi,
                  userId,
                  aiProvider,
                  results
                ));
              }
              return;
            }

            // Create new card
            const newCard = new Card({
              hanzi: cleanedHanzi,
              cached: false
            });

            await newCard.save();

            results.created.push({
              hanzi: cleanedHanzi,
              cardId: newCard._id
            });

            // Queue for enrichment if requested
            if (enrichImmediately) {
              enrichmentQueue.push(() => queueEnrichmentWithRateLimit(
                newCard._id.toString(),
                cleanedHanzi,
                userId,
                aiProvider,
                results
              ));
            }
          } catch (error) {
            console.error(`Error processing character ${hanzi}:`, error);
            results.errors.push({
              hanzi,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        });

        // Wait for all characters in batch to be processed
        await Promise.all(batchPromises);
        
        // Process enrichment queue with concurrency limit
        if (enrichmentQueue.length > 0) {
          console.log(`   📤 Queueing ${enrichmentQueue.length} enrichment jobs (max ${PARALLEL_CONFIG.ENRICHMENT_CONCURRENCY} concurrent)`);
          
          // Process enrichments in groups of ENRICHMENT_CONCURRENCY
          for (let i = 0; i < enrichmentQueue.length; i += PARALLEL_CONFIG.ENRICHMENT_CONCURRENCY) {
            const chunk = enrichmentQueue.slice(i, i + PARALLEL_CONFIG.ENRICHMENT_CONCURRENCY);
            await Promise.all(chunk.map(fn => fn()));
          }
        }

        // Add delay between batches to prevent overwhelming the system
        if (batchIndex < totalBatches - 1) {
          console.log(`   ⏱️ Waiting ${BATCH_CONFIG.BULK_IMPORT_BATCH_DELAY}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.BULK_IMPORT_BATCH_DELAY));
        }
      }

      // Final progress update
      await job.updateProgress({
        stage: "completed",
        message: "Bulk import completed",
        processed: characters.length,
        total: characters.length,
        batchIndex: totalBatches,
        totalBatches,
        results: {
          created: results.created.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
          enrichmentQueued: results.enrichmentJobs.length
        }
      });

      console.log(`\n✅ Bulk import completed:`);
      console.log(`   Created: ${results.created.length}`);
      console.log(`   Skipped: ${results.skipped.length}`);
      console.log(`   Errors: ${results.errors.length}`);
      console.log(`   Enrichment jobs queued: ${results.enrichmentJobs.length}`);

      return {
        success: true,
        summary: {
          total: characters.length,
          created: results.created.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
          enrichmentQueued: results.enrichmentJobs.length
        },
        results
      };
    } catch (error) {
      console.error('Bulk import job error:', error);
      
      // Update progress with error
      await job.updateProgress({
        stage: "failed",
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: {
          created: results.created.length,
          skipped: results.skipped.length,
          errors: results.errors.length
        }
      });

      throw error;
    }
  },
  {
    connection: getRedis(),
    concurrency: getWorkerConcurrency('BULK_IMPORT'),
    lockDuration: JOB_CONFIG.BULK_IMPORT_LOCK,
    lockRenewTime: JOB_CONFIG.LOCK_RENEW_TIME,
  }
);

// Helper function to queue enrichment with rate limiting
async function queueEnrichmentWithRateLimit(
  cardId: string,
  hanzi: string,
  userId: string,
  aiProvider: 'openai' | undefined,
  results: any
): Promise<void> {
  try {
    // Check if shared media already exists
    const { audioExists, imageExists } = await checkSharedMediaExists(hanzi);
    
    // Only queue if we actually need enrichment
    const card = await Card.findById(cardId);
    if (!card) return;
    
    const needsEnrichment = !audioExists || !imageExists || !card.pinyin || !card.meaning;
    
    if (needsEnrichment) {
      // Apply rate limiting based on what will be generated
      // OpenAI is used for text interpretation and image prompts
      if (!card.pinyin || !card.meaning) {
        await openAIRateLimiter.waitIfNeeded();
      }
      
      // Fal.ai is used for image generation
      if (!imageExists) {
        await falRateLimiter.waitIfNeeded();
      }
      
      // Queue the enrichment job with priority
      const queue = getCardEnrichmentQueue();
      const job = await queue.add(
        'enrich-card',
        {
          cardId: cardId,
          userId: userId,
          deckId: null, // No deck association for bulk import
          force: false,
          aiProvider: aiProvider || 'openai'
        },
        {
          priority: JOB_PRIORITIES.BULK_IMPORT_ENRICHMENT,
          delay: Math.random() * 5000 // Random delay up to 5 seconds to spread load
        }
      );

      results.enrichmentJobs.push({
        hanzi: hanzi,
        cardId: cardId,
        jobId: job.id
      });
      
      console.log(`   📝 Queued enrichment for ${hanzi} (job: ${job.id})`);
    } else {
      console.log(`   ⏭️ Skipping enrichment for ${hanzi} (already complete)`);
    }
  } catch (error) {
    console.error(`Failed to queue enrichment for ${hanzi}:`, error);
    // Don't throw - continue with other cards
  }
}

// Register worker for monitoring
registerWorker(bulkImportWorker, "bulk-import");

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing bulk import worker...');
  await bulkImportWorker.close();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing bulk import worker...');
  await bulkImportWorker.close();
});