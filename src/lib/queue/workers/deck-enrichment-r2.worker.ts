import { Worker, Job } from 'bullmq';
import getRedis from '../redis';
import { DeckEnrichmentJobData } from '../queues';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Deck from '@/lib/db/models/Deck';
import DeckCard from '@/lib/db/models/DeckCard';
import Dictionary from '@/lib/db/models/Dictionary';
import { generateTTSAudioR2 } from '@/lib/enrichment/azure-tts-r2';
import { generateDALLEImageR2 } from '@/lib/enrichment/openai-dalle-r2';
import { generateSharedAudio, generateSharedImage } from '@/lib/enrichment/shared-media';
import { interpretChinese } from '@/lib/enrichment/openai-interpret';
import { convertPinyinToneNumbersToMarks, hasToneMarks } from '@/lib/utils/pinyin';
import { getPreferredEntry } from '@/lib/enrichment/multi-pronunciation-handler';
import { getCharacterAnalysisWithCache } from '@/lib/analytics/character-analysis-service';
import { EnhancedCharacterComplexity } from '@/lib/analytics/enhanced-linguistic-complexity';
import { registerWorker } from '../worker-monitor';

export const deckEnrichmentR2Worker = new Worker<DeckEnrichmentJobData>(
  'deck-enrichment',
  async (job: Job<DeckEnrichmentJobData>) => {
    const { deckId, deckName, sessionId, force = false } = job.data;
    
    console.log(`\n🚀 Starting deck enrichment (R2) for "${deckName}" (${deckId})`);
    console.log(`   Force mode: ${force}`);
    console.log(`   Session: ${sessionId}`);
    
    try {
      await connectDB();
      
      // Find cards in this deck
      console.log('📋 Fetching cards from deck...');
      const deckCards = await DeckCard.find({ deckId }).populate('cardId');
      let cards = deckCards.map(dc => dc.cardId).filter(card => card);
      console.log(`   Found ${cards.length} total cards`);
      
      // Filter cards that need enrichment
      if (!force) {
        const beforeFilter = cards.length;
        cards = cards.filter(card => 
          !card.cached ||
          card.imageSource === 'placeholder' ||
          !card.imageUrl ||
          !card.audioUrl ||
          // Check if URLs are R2 URLs
          (card.imageUrl && !card.imageUrl.includes(process.env.R2_PUBLIC_URL)) ||
          (card.audioUrl && !card.audioUrl.includes(process.env.R2_PUBLIC_URL))
        );
        console.log(`   Filtered to ${cards.length} cards needing enrichment (${beforeFilter - cards.length} already enriched)`);
      }
      
      const totalCards = cards.length;
      let processedCards = 0;
      
      if (totalCards === 0) {
        console.log('✅ No cards need enrichment');
        
        // Update deck to ready status
        await Deck.findByIdAndUpdate(deckId, {
          status: 'ready',
          enrichmentProgress: {
            totalCards: 0,
            processedCards: 0,
            currentOperation: 'All cards already enriched',
          }
        });
        
        return { success: true, totalCards: 0, processedCards: 0 };
      }
      
      // Update deck status
      await Deck.findByIdAndUpdate(deckId, {
        status: 'enriching',
        enrichmentProgress: {
          totalCards,
          processedCards,
          currentOperation: 'Starting enrichment...',
        }
      });
      
      for (const card of cards) {
        try {
          console.log(`\n🔄 Processing card ${processedCards + 1}/${totalCards}: ${card.hanzi}`);
          const cardId = card._id.toString();
          
          // Update deck status - dictionary lookup
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Looking up dictionary...',
            }
          });
          
          // Check if card was already disambiguated
          if (card.disambiguated && card.meaning && card.pinyin) {
            console.log(`   ✓ Using pre-selected meaning: ${card.pinyin} - ${card.meaning}`);
            
            // Convert tone numbers to marks if needed
            if (!hasToneMarks(card.pinyin)) {
              card.pinyin = convertPinyinToneNumbersToMarks(card.pinyin);
            }
          } else {
            // Look up in CEDICT for meaning only
            const dictEntries = await Dictionary.find({ 
              traditional: card.hanzi 
            });
            
            if (dictEntries.length > 0) {
              console.log(`   ✓ Found in dictionary`);
              
              // Get meaning from dictionary
              if (dictEntries.length > 1) {
                const preferredEntry = getPreferredEntry(card.hanzi, dictEntries);
                card.meaning = preferredEntry.definitions[0] || 'No definition';
                console.log(`   Multiple entries found, selected meaning: ${card.meaning}`);
              } else {
                // Single entry
                card.meaning = dictEntries[0].definitions[0] || 'No definition';
              }
              
              // Don't use dictionary pinyin - we'll get Taiwan pronunciation from AI
              console.log(`   Will use AI for Taiwan-specific pronunciation`);
            } else {
              console.log(`   ✗ Not in dictionary, will use AI interpretation`);
            }
          }
          
          // Always use AI interpretation for student-friendly meanings and Taiwan pronunciation unless already disambiguated
          const needsInterpretation = !card.disambiguated || !card.pinyin || !card.meaning || card.meaning === 'Unknown character';
          
          if (needsInterpretation) {
            console.log(`   🤖 Using AI interpretation for student-friendly meaning...`);
            
            await Deck.findByIdAndUpdate(deckId, {
              enrichmentProgress: {
                totalCards,
                processedCards,
                currentCard: card.hanzi,
                currentOperation: 'AI interpretation...',
              }
            });
            
            const interpretation = await interpretChinese(card.hanzi);
            
            if (interpretation) {
              // Always use AI meaning for clearer, student-friendly explanations
              card.meaning = interpretation.meaning || card.meaning;
              card.pinyin = interpretation.pinyin || card.pinyin;
              console.log(`   ✓ AI provided: ${card.pinyin} - ${card.meaning}`);
            } else {
              // Final fallback
              card.meaning = card.meaning || 'Unknown character';
              card.pinyin = card.pinyin || 'Unknown';
              console.log(`   ⚠️ AI interpretation failed, using fallback`);
            }
          }
          
          // Generate character analysis
          console.log(`   📊 Analyzing character complexity...`);
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Analyzing character...',
            }
          });
          
          const analysis = await getCharacterAnalysisWithCache(card.hanzi);
          if (analysis) {
            card.complexity = analysis; // analysis IS the complexity data
            // Note: linguisticData might not exist on the analysis object
          }
          
          // Generate image with R2
          console.log(`   🎨 Generating image...`);
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Generating image...',
            }
          });
          
          const image = await generateSharedImage(
            card.hanzi, 
            card.meaning, 
            card.pinyin
          );
          
          if (image.imageUrl) {
            card.imageUrl = image.imageUrl;
            card.imageSource = 'dalle';
            card.imageSourceId = image.cached ? 'cached' : 'generated';
            card.imageAttribution = 'AI Generated';
            card.imageAttributionUrl = '';
            console.log(`   ✓ Image ${image.cached ? 'retrieved from cache' : 'generated'}`);
          } else {
            // Clear image fields if generation failed
            card.imageUrl = '';
            card.imageSource = undefined;
            card.imageSourceId = undefined;
            card.imageAttribution = undefined;
            card.imageAttributionUrl = undefined;
            console.log(`   ⚠️ Image generation skipped or failed`);
          }
          
          // Generate TTS audio with R2
          console.log(`   🔊 Generating audio...`);
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Generating audio...',
            }
          });
          
          try {
            const ttsResult = await generateSharedAudio(card.hanzi);
            card.audioUrl = ttsResult.audioUrl;
            console.log(`   ✓ Audio ${ttsResult.cached ? 'retrieved from cache' : 'generated'}`);
          } catch (ttsError) {
            console.error(`   ✗ TTS generation failed:`, ttsError);
            card.audioUrl = '';
          }
          
          // Mark as cached and save
          card.cached = true;
          await card.save();
          
          processedCards++;
          console.log(`   ✅ Card enriched successfully (${processedCards}/${totalCards})`);
          
          // Update progress
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: `Enriched ${card.hanzi}`,
            }
          });
          
          // Report progress
          await job.updateProgress(Math.round((processedCards / totalCards) * 100));
          
        } catch (cardError) {
          console.error(`   ❌ Error enriching card ${card.hanzi}:`, cardError);
          // Continue with next card
        }
      }
      
      // Update deck to ready status
      console.log('\n✅ Deck enrichment completed!');
      await Deck.findByIdAndUpdate(deckId, {
        status: 'ready',
        enrichmentProgress: {
          totalCards,
          processedCards,
          currentOperation: 'Enrichment complete!',
        }
      });
      
      return { 
        success: true, 
        totalCards, 
        processedCards,
        message: `Successfully enriched ${processedCards} out of ${totalCards} cards` 
      };
      
    } catch (error) {
      console.error('❌ Deck enrichment error:', error);
      
      // Update deck status to error
      await Deck.findByIdAndUpdate(deckId, {
        status: 'error',
        enrichmentProgress: {
          currentOperation: 'Enrichment failed',
        }
      });
      
      throw error;
    }
  },
  {
    connection: getRedis(),
    concurrency: 2, // Process 2 decks at a time
  }
);

// Register worker for monitoring
registerWorker(deckEnrichmentR2Worker, 'deck-enrichment');