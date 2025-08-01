import { Worker, Job } from 'bullmq';
import getRedis from '../redis';
import { DeckImportJobData, deckEnrichmentQueue } from '../queues';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
import Review from '@/lib/db/models/Review';

export const deckImportWorker = new Worker<DeckImportJobData>(
  'deck-import',
  async (job: Job<DeckImportJobData>) => {
    const { deckId, userId, deckName, hanziList, sessionId, disambiguationSelections } = job.data;
    
    console.log(`\n📥 Starting deck import for "${deckName}" (${deckId})`);
    console.log(`   Characters to import: ${hanziList.length}`);
    console.log(`   Session: ${sessionId}`);
    
    try {
      await connectDB();
      
      // Get the deck
      const deck = await Deck.findById(deckId);
      if (!deck) {
        throw new Error('Deck not found');
      }
      
      let newCardsCount = 0;
      let existingCardsCount = 0;
      let processedCards = 0;
      
      // Process characters in batches for better performance
      const BATCH_SIZE = 50;
      for (let i = 0; i < hanziList.length; i += BATCH_SIZE) {
        const batch = hanziList.slice(i, i + BATCH_SIZE);
        
        // Update deck status in database
        await Deck.findByIdAndUpdate(deckId, {
          enrichmentProgress: {
            totalCards: hanziList.length,
            processedCards,
            currentOperation: `Processing characters ${i + 1}-${Math.min(i + BATCH_SIZE, hanziList.length)}...`,
          }
        });
        
        const batchPromises = batch.map(async (hanzi) => {
          // Find or create the card
          let card = await Card.findOne({ hanzi });
          
          if (!card) {
            // Check if we have disambiguation selection for this character
            const disambiguationSelection = disambiguationSelections?.[hanzi];
            
            card = await Card.create({ 
              hanzi,
              // If we have a pre-selected meaning, store it
              ...(disambiguationSelection && {
                pinyin: disambiguationSelection.pinyin,
                meaning: disambiguationSelection.meaning,
                disambiguated: true
              })
            });
            newCardsCount++;
          } else {
            existingCardsCount++;
          }
          
          // Create or update review record for this user
          await Review.findOneAndUpdate(
            { userId, cardId: card._id },
            { 
              userId, 
              cardId: card._id, 
              deckId: deck._id 
            },
            { upsert: true }
          )
          
          // Link card to this deck
          await DeckCard.findOneAndUpdate(
            { deckId: deck._id, cardId: card._id },
            { deckId: deck._id, cardId: card._id },
            { upsert: true }
          );
          
          return card;
        });
        
        await Promise.all(batchPromises);
        processedCards += batch.length;
        
        // Update progress
        const progress = Math.round((processedCards / hanziList.length) * 100);
        await job.updateProgress(progress);
        
        console.log(`   Processed batch: ${processedCards}/${hanziList.length}`);
      }
      
      console.log(`\n✅ Import completed!`);
      console.log(`   New cards: ${newCardsCount}`);
      console.log(`   Existing cards: ${existingCardsCount}`);
      
      // Update deck status to enriching
      await Deck.findByIdAndUpdate(deckId, {
        status: 'enriching',
        enrichmentProgress: {
          totalCards: hanziList.length,
          processedCards: 0,
          currentOperation: 'Starting enrichment...',
        }
      });
      
      // Queue enrichment job
      await deckEnrichmentQueue().add(
        `enrich-${deck._id}`,
        {
          deckId: deck._id.toString(),
          userId,
          deckName: deck.name,
          sessionId,
          force: false,
        },
        {
          jobId: `enrich-${deck._id}-${Date.now()}`,
        }
      );
      
      console.log(`   ✓ Enrichment job queued`);
      
      return {
        success: true,
        deckId: deck._id.toString(),
        imported: hanziList.length,
        newCards: newCardsCount,
        existingCards: existingCardsCount,
      };
      
    } catch (error) {
      console.error(`❌ Import error:`, error);
      
      // Update deck status on error
      await Deck.findByIdAndUpdate(deckId, {
        status: 'ready',
        enrichmentProgress: {
          currentOperation: 'Import failed',
        }
      });
      
      throw error;
    }
  },
  {
    connection: getRedis(),
    concurrency: 2, // Process 2 imports at a time
  }
);

deckImportWorker.on('completed', (job) => {
  console.log(`✅ Deck import completed for ${job.data.deckName}`);
});

deckImportWorker.on('failed', (job, err) => {
  console.error(`❌ Deck import failed for ${job?.data.deckName}:`, err);
});