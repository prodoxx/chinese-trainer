import { Worker, Job } from 'bullmq';
import redis from '../redis';
import { CardEnrichmentJobData } from '../queues';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Dictionary from '@/lib/db/models/Dictionary';
import { generateSharedAudio, generateSharedImage } from '@/lib/enrichment/shared-media';
import { getPreferredEntry } from '@/lib/enrichment/multi-pronunciation-handler';
import { convertPinyinToneNumbersToMarks } from '@/lib/utils/pinyin';

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
      } else if (!card.meaning || !card.pinyin || card.meaning === 'Unknown character' || force) {
        // Look up in dictionary if not already disambiguated
        const dictEntries = await Dictionary.find({ 
          traditional: card.hanzi 
        });
        
        if (dictEntries.length > 0) {
          const selectedEntry = getPreferredEntry(card.hanzi, dictEntries);
          card.meaning = selectedEntry.definitions[0] || 'No definition';
          card.pinyin = convertPinyinToneNumbersToMarks(selectedEntry.pinyin);
          
          if (dictEntries.length > 1) {
            console.log(`   Multiple pronunciations found, selected: ${card.pinyin} - ${card.meaning}`);
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
      await job.updateProgress(90);
      
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