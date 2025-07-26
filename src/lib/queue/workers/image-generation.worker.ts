import { Worker, Job } from 'bullmq';
import redis from '../redis';
import { ImageGenerationJobData } from '../queues';
import { generateDALLEImage } from '@/lib/enrichment/openai-dalle';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';

export const imageGenerationWorker = new Worker<ImageGenerationJobData>(
  'image-generation',
  async (job: Job<ImageGenerationJobData>) => {
    const { cardId, hanzi, meaning, pinyin, deckId, sessionId } = job.data;
    
    console.log(`\n🎨 Starting image generation for: ${hanzi}`);
    console.log(`   Meaning: ${meaning}`);
    console.log(`   Pinyin: ${pinyin}`);
    console.log(`   Card ID: ${cardId}`);
    
    try {
      // Connect to DB
      await connectDB();
      
      // Log progress update
      console.log(`   Status: processing`);
      console.log(`   Session: ${sessionId}`);
      
      const progressData = {
        cardId,
        hanzi,
        meaning,
        pinyin,
        status: 'processing',
        progress: 0,
        operation: 'Preparing to generate image...',
      };
      
      // Generate image using DALL-E
      console.log(`   🤖 Calling DALL-E API for ${hanzi}...`);
      const result = await generateDALLEImage(hanzi, meaning, pinyin);
      
      if (!result.url) {
        console.log(`   ⏭️  Skipped image generation for ${hanzi} (grammatical particle or no visual representation)`);
      } else if (result.cached) {
        console.log(`   ♻️  Using cached image for ${hanzi}`);
      } else {
        console.log(`   ✨ Generated new image for ${hanzi}`);
      }
      
      // Update progress
      await job.updateProgress(50);
      console.log(`   Progress: 50% - Saving image to database...`);
      
      // Update card in database
      if (result.url) {
        console.log(`   💾 Saving image URL to database...`);
        const card = await Card.findById(cardId);
        if (card) {
          card.imageUrl = result.url;
          card.imageSource = 'dalle';
          card.imageSourceId = result.cached ? 'cached' : 'generated';
          card.imageAttribution = 'AI Generated';
          card.imageAttributionUrl = '';
          await card.save();
          console.log(`   ✓ Card updated successfully`);
        } else {
          console.error(`   ✗ Card not found: ${cardId}`);
        }
      }
      
      // Complete
      await job.updateProgress(100);
      console.log(`   ✅ Image generation completed for ${hanzi}`);
      
      console.log(`   Progress: 100% - Complete!`);
      console.log(`   Image URL: ${result.url}`);
      console.log(`   Cached: ${result.cached}`);
      
      return {
        success: true,
        imageUrl: result.url,
        cached: result.cached,
      };
      
    } catch (error) {
      console.error(`   ❌ Error generating image for ${hanzi}:`, error);
      
      // Log error
      console.error(`   Status: failed`);
      console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`   Operation: Failed`);
      
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1, // Process 1 image at a time to avoid rate limits
    limiter: {
      max: 5,
      duration: 60000, // 5 images per minute to respect OpenAI rate limits
    },
  }
);

imageGenerationWorker.on('completed', (job) => {
  console.log(`✅ Image generation completed for ${job.data.hanzi}`);
});

imageGenerationWorker.on('failed', (job, err) => {
  console.error(`❌ Image generation failed for ${job?.data.hanzi}:`, err);
});