import { Worker, Job } from 'bullmq';
import redis from '../redis';
import { CardEnrichmentJobData } from '../queues';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Dictionary from '@/lib/db/models/Dictionary';
import { generateSharedAudio, generateSharedImage } from '@/lib/enrichment/shared-media';
import { getPreferredEntry } from '@/lib/enrichment/multi-pronunciation-handler';
import { convertPinyinToneNumbersToMarks } from '@/lib/utils/pinyin';
import { interpretChinese } from '@/lib/enrichment/openai-interpret';
import { analyzeCharacterWithOpenAI } from '@/lib/analytics/openai-linguistic-analysis';

export const cardEnrichmentWorker = new Worker<CardEnrichmentJobData>(
  'card-enrichment',
  async (job: Job<CardEnrichmentJobData>) => {
    const { cardId, userId, deckId, force, disambiguationSelection } = job.data;
    
    console.log(`\n🔄 Starting single card enrichment for card ${cardId}`);
    console.log(`   Force: ${force}`);
    console.log(`   User: ${userId}`);
    
    try {
      await connectDB();
      
      // Find the card
      const card = await Card.findById(cardId);
      
      if (!card) {
        throw new Error('Card not found');
      }
      
      console.log(`   Character: ${card.hanzi}`);
      
      // Update meaning/pinyin if disambiguation was provided
      if (disambiguationSelection) {
        console.log(`   Using disambiguation selection: ${disambiguationSelection.pinyin} - ${disambiguationSelection.meaning}`);
        card.meaning = disambiguationSelection.meaning;
        card.pinyin = convertPinyinToneNumbersToMarks(disambiguationSelection.pinyin);
        card.disambiguated = true;
      }
      
      // Look up in dictionary for meaning
      let dictEntries: any[] = [];
      if (!card.meaning || card.meaning === 'Unknown character' || force) {
        dictEntries = await Dictionary.find({ 
          traditional: card.hanzi 
        });
        
        if (dictEntries.length > 0) {
          const selectedEntry = getPreferredEntry(card.hanzi, dictEntries);
          card.meaning = selectedEntry.definitions[0] || 'No definition';
          
          if (dictEntries.length > 1) {
            console.log(`   Multiple entries found, selected meaning: ${card.meaning}`);
          }
        }
      }
      
      // Use AI interpretation to get Taiwan-specific pronunciation and student-friendly meanings
      if (!card.pinyin || !card.meaning || card.meaning === 'Unknown character' || force) {
        console.log(`   🤖 Using AI interpretation for Taiwan pronunciation and meaning...`);
        
        const interpretation = await interpretChinese(card.hanzi);
        
        if (interpretation) {
          // Always use AI pinyin for Taiwan pronunciation
          card.pinyin = interpretation.pinyin || card.pinyin;
          
          // Always use AI meaning for clearer, student-friendly explanations
          card.meaning = interpretation.meaning || card.meaning;
          
          console.log(`   ✓ AI provided: ${card.pinyin} - ${card.meaning}`);
        } else {
          console.log(`   ⚠️ AI interpretation failed`);
          // Fallback to dictionary if available
          if (!card.pinyin && dictEntries.length > 0) {
            const selectedEntry = getPreferredEntry(card.hanzi, dictEntries);
            card.pinyin = convertPinyinToneNumbersToMarks(selectedEntry.pinyin);
            console.log(`   Falling back to dictionary pinyin: ${card.pinyin}`);
          }
        }
      }
      
      // Update progress
      await job.updateProgress(30);
      
      // Re-generate image if force=true or no image exists
      if (force || !card.imageUrl || card.imageUrl === '') {
        console.log(`   Generating new image...`);
        
        // Ensure we have valid values before calling generateSharedImage
        const meaning = card.meaning || '';
        const pinyin = card.pinyin || '';
        
        console.log(`   Calling generateSharedImage with:`);
        console.log(`   - hanzi: ${card.hanzi}`);
        console.log(`   - meaning: ${meaning}`);
        console.log(`   - pinyin: ${pinyin}`);
        console.log(`   - force: ${force}`);
        
        const imageResult = await generateSharedImage(
          card.hanzi, 
          meaning, 
          pinyin,
          force
        );
        
        if (imageResult.imageUrl) {
          card.imageUrl = imageResult.imageUrl;
          card.imageSource = 'dalle';
          card.imageSourceId = imageResult.cached ? 'cached' : 'generated';
          card.imageAttribution = 'AI Generated';
          card.imageAttributionUrl = '';
          console.log(`   ✓ Image generated (cached: ${imageResult.cached}, force: ${force})`);
          console.log(`   Image URL saved: ${card.imageUrl}`);
        }
      }
      
      // Update progress
      await job.updateProgress(60);
      
      // Re-generate audio if missing
      if (!card.audioUrl || force) {
        console.log(`   Generating audio...`);
        
        try {
          const audioResult = await generateSharedAudio(card.hanzi);
          card.audioUrl = audioResult.audioUrl;
          console.log(`   ✓ Audio generated (cached: ${audioResult.cached})`);
        } catch (audioError) {
          console.error(`   ✗ Audio generation failed:`, audioError);
        }
      }
      
      // Update progress
      await job.updateProgress(80);
      
      // Generate AI insights if they don't exist or if forced
      if (!card.aiInsights || force) {
        console.log(`   Generating AI insights...`);
        
        try {
          const aiInsights = await analyzeCharacterWithOpenAI(card.hanzi);
          card.aiInsights = aiInsights;
          card.aiInsightsGeneratedAt = new Date();
          console.log(`   ✓ AI insights generated`);
        } catch (aiError) {
          console.error(`   ✗ AI insights generation failed:`, aiError);
          // Continue without AI insights - it's not critical for basic functionality
        }
      }
      
      // Update progress
      await job.updateProgress(95);
      
      // Save the updated card
      await card.save();
      
      console.log(`✅ Card enrichment completed for ${card.hanzi}`);
      
      // Return the updated card data
      return {
        success: true,
        card: {
          _id: card._id,
          hanzi: card.hanzi,
          meaning: card.meaning,
          english: card.meaning ? [card.meaning] : [],
          pinyin: card.pinyin,
          imageUrl: card.imageUrl,
          audioUrl: card.audioUrl,
          imageAttribution: card.imageAttribution,
          imageAttributionUrl: card.imageAttributionUrl,
        }
      };
      
    } catch (error) {
      console.error('Card enrichment error:', error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3, // Process up to 3 cards at once
  }
);