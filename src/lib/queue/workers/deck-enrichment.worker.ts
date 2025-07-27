import { Worker, Job } from 'bullmq';
import redis from '../redis';
import { DeckEnrichmentJobData } from '../queues';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Deck from '@/lib/db/models/Deck';
import DeckCard from '@/lib/db/models/DeckCard';
import Dictionary from '@/lib/db/models/Dictionary';
import { generateTTSAudio } from '@/lib/enrichment/azure-tts';
import { generateDALLEImage } from '@/lib/enrichment/openai-dalle';
import { interpretChinese } from '@/lib/enrichment/openai-interpret';
import { convertPinyinToneNumbersToMarks, hasToneMarks } from '@/lib/utils/pinyin';
import { getCharacterAnalysisWithCache } from '@/lib/analytics/character-analysis-service';

export const deckEnrichmentWorker = new Worker<DeckEnrichmentJobData>(
  'deck-enrichment',
  async (job: Job<DeckEnrichmentJobData>) => {
    const { deckId, deckName, sessionId, force = false } = job.data;
    
    console.log(`\n🚀 Starting deck enrichment for "${deckName}" (${deckId})`);
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
          !card.audioUrl
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
        
        console.log('   Status: ready');
        console.log('   Message: All cards already enriched');
        
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
      
      // Log initial status
      console.log('📡 Deck status update:', {
        deckId,
        status: 'enriching',
        enrichmentProgress: {
          totalCards,
          processedCards,
          currentCard: null,
          currentOperation: 'Starting enrichment...',
        },
      });
      
      for (const card of cards) {
        try {
          console.log(`\n🔄 Processing card ${processedCards + 1}/${totalCards}: ${card.hanzi}`);
          
          // Update deck status in database - dictionary lookup
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Looking up dictionary...',
            }
          });
          
          // Emit status update
          console.log('📡 Deck status update:', {
            deckId,
            status: 'enriching',
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Looking up dictionary...',
              remainingCards: totalCards - processedCards,
            },
          });
          
          // Enrich dictionary data if missing
          let imagePrompt: string | undefined;
          
          if (!card.meaning || card.meaning === 'Unknown character') {
            console.log(`   📖 Looking up dictionary for ${card.hanzi}...`);
            const dictEntry = await Dictionary.findOne({ 
              traditional: card.hanzi 
            });
            
            if (dictEntry) {
              card.meaning = dictEntry.definitions[0] || 'No definition';
              // Convert pinyin to tone marks if needed
              try {
                card.pinyin = hasToneMarks(dictEntry.pinyin) 
                  ? dictEntry.pinyin 
                  : convertPinyinToneNumbersToMarks(dictEntry.pinyin);
              } catch (pinyinError) {
                console.error(`   ✗ Pinyin conversion error:`, pinyinError);
                card.pinyin = dictEntry.pinyin; // Keep original if conversion fails
              }
              await card.save();
              console.log(`   ✓ Found: ${card.pinyin} - ${card.meaning}`);
            } else {
              console.log(`   ✗ Not found in dictionary`);
              
              // Use AI interpretation for multi-character phrases or unknown characters
              console.log(`   🤖 Using AI interpretation for ${card.hanzi}...`);
              try {
                // Determine context from deck name
                const context = deckName.toLowerCase().includes('emotion') ? 'emotions' : undefined;
                const interpretation = await interpretChinese(card.hanzi, context);
                
                if (interpretation.meaning && interpretation.meaning !== 'Unknown' && interpretation.meaning !== 'Unknown phrase') {
                  card.meaning = interpretation.meaning;
                  card.pinyin = interpretation.pinyin || '';
                  imagePrompt = interpretation.imagePrompt;
                  await card.save();
                  console.log(`   ✓ AI interpreted: ${card.pinyin} - ${card.meaning}`);
                } else {
                  console.log(`   ✗ AI interpretation returned unknown/invalid meaning`);
                }
              } catch (aiError) {
                console.error(`   ✗ AI interpretation failed:`, aiError);
              }
            }
          }
          
          // Check if we should improve meaning/prompt for certain words
          const needsAIImprovement = card.meaning && (
            card.meaning === 'bright' && card.hanzi === '爽' ||
            card.meaning === 'to accumulate' && card.hanzi === '累' ||
            card.meaning.length === 0 ||
            card.hanzi.length > 1 // Multi-character phrases often need better context
          );
          
          if (needsAIImprovement && !imagePrompt) {
            console.log(`   🤖 Improving interpretation for ${card.hanzi} (${card.meaning})...`);
            try {
              const context = deckName.toLowerCase().includes('emotion') ? 'emotions' : undefined;
              const interpretation = await interpretChinese(card.hanzi, context);
              
              if (interpretation.meaning && interpretation.meaning !== 'Unknown' && interpretation.meaning !== 'Unknown phrase') {
                card.meaning = interpretation.meaning;
                card.pinyin = interpretation.pinyin || card.pinyin;
                imagePrompt = interpretation.imagePrompt;
                await card.save();
                console.log(`   ✓ Improved: ${card.pinyin} - ${card.meaning}`);
              } else {
                console.log(`   ✗ AI improvement returned unknown/invalid meaning, keeping original`);
              }
            } catch (aiError) {
              console.error(`   ✗ AI improvement failed:`, aiError);
            }
          }
          
          // Update status - generating audio
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Generating audio...',
            }
          });
          
          console.log('📡 Deck status update:', {
            deckId,
            status: 'enriching',
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Generating audio...',
              remainingCards: totalCards - processedCards,
            },
          });
          
          // Generate TTS audio if missing
          if (!card.audioUrl) {
            try {
              console.log(`   🔊 Generating TTS audio for ${card.hanzi}...`);
              const ttsResult = await generateTTSAudio(card.hanzi);
              if (ttsResult.audioUrl) {
                card.audioUrl = ttsResult.audioUrl;
                await card.save();
                console.log(`   ✓ Audio generated${ttsResult.cached ? ' (cached)' : ''}`);
              }
            } catch (ttsError) {
              console.error(`   ✗ TTS failed:`, ttsError);
            }
          } else {
            console.log(`   ✓ Audio already exists`);
          }
          
          // Update status - generating image
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Generating image...',
            }
          });
          
          console.log('📡 Deck status update:', {
            deckId,
            status: 'enriching',
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Generating image...',
              remainingCards: totalCards - processedCards,
            },
          });
          
          // Generate image if needed
          if (!card.imageUrl || card.imageSource === 'placeholder' || force) {
            try {
              console.log(`   🎨 Generating image for ${card.hanzi}...`);
              const imageResult = await generateDALLEImage(card.hanzi, card.meaning, card.pinyin, imagePrompt, force);
              
              if (imageResult.url) {
                card.imageUrl = imageResult.url;
                card.imageSource = 'dalle';
                card.imageSourceId = imageResult.cached ? 'cached' : 'generated';
                card.imageAttribution = 'AI Generated';
                card.imageAttributionUrl = '';
                await card.save();
                console.log(`   ✓ Image generated${imageResult.cached ? ' (cached)' : ''}`);
              }
            } catch (imageError) {
              console.error(`   ✗ Image generation failed:`, imageError);
              // If rate limited, wait and retry
              if (imageError && typeof imageError === 'object' && 'code' in imageError && imageError.code === 'rate_limit_exceeded') {
                console.log(`   ⏳ Rate limited, waiting 60 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 60000));
                try {
                  const retryResult = await generateDALLEImage(card.hanzi, card.meaning, card.pinyin, imagePrompt, force);
                  if (retryResult.url) {
                    card.imageUrl = retryResult.url;
                    card.imageSource = 'dalle';
                    card.imageSourceId = retryResult.cached ? 'cached' : 'generated';
                    card.imageAttribution = 'AI Generated';
                    card.imageAttributionUrl = '';
                    await card.save();
                    console.log(`   ✓ Image generated on retry`);
                  }
                } catch (retryError) {
                  console.error(`   ✗ Image generation failed on retry:`, retryError);
                }
              }
            }
          } else {
            console.log(`   ✓ Image already exists`);
          }
          
          // Perform linguistic analysis and cache it
          await Deck.findByIdAndUpdate(deckId, {
            enrichmentProgress: {
              totalCards,
              processedCards,
              currentCard: card.hanzi,
              currentOperation: 'Analyzing character...',
            }
          });
          
          try {
            console.log(`   🧠 Analyzing character ${card.hanzi}...`);
            const analysis = await getCharacterAnalysisWithCache(card.hanzi);
            
            // Save analysis data to card
            card.semanticCategory = analysis.semanticCategory;
            card.tonePattern = analysis.tonePattern;
            card.strokeCount = analysis.strokeCount;
            card.componentCount = analysis.componentCount;
            card.visualComplexity = analysis.visualComplexity;
            card.overallDifficulty = analysis.overallDifficulty;
            
            // Save additional data from CharacterAnalysis model if available
            const fullAnalysis = await import('@/lib/db/models/CharacterAnalysis').then(m => m.default);
            const cachedAnalysis = await fullAnalysis.findOne({ character: card.hanzi });
            if (cachedAnalysis) {
              card.mnemonics = cachedAnalysis.mnemonics;
              card.etymology = cachedAnalysis.etymology;
            }
            
            await card.save();
            console.log(`   ✓ Character analyzed: ${analysis.semanticCategory} (${analysis.tonePattern})`);
          } catch (analysisError) {
            console.error(`   ✗ Character analysis failed:`, analysisError);
          }
          
          // Mark as cached
          if (!card.cached) {
            card.cached = true;
            await card.save();
          }
          
          processedCards++;
          console.log(`   ✅ Card ${card.hanzi} processed (${processedCards}/${totalCards})`);
          
          // Update progress
          const progress = Math.round((processedCards / totalCards) * 100);
          await job.updateProgress(progress);
          
        } catch (error) {
          console.error(`Failed to enrich ${card.hanzi}:`, error);
        }
      }
      
      // Complete - update deck to ready status
      console.log(`\n✅ Deck enrichment completed!`);
      console.log(`   Total cards processed: ${processedCards}`);
      console.log(`   Images processed: ${cards.filter(c => c.imageUrl && c.imageSource === 'dalle').length}`);
      
      await Deck.findByIdAndUpdate(deckId, {
        status: 'ready',
        enrichmentProgress: {
          totalCards: processedCards,
          processedCards: processedCards,
          currentOperation: 'Enrichment complete!',
        }
      });
      
      console.log('📡 Deck status update:', {
        deckId,
        status: 'ready',
        message: `Processed ${processedCards} cards. Images are being generated in the background.`,
      });
      
      return {
        success: true,
        totalCards,
        processedCards,
      };
      
    } catch (error) {
      console.error(`❌ Enrichment error:`, error);
      
      // Update deck status to ready (failed but usable)
      await Deck.findByIdAndUpdate(deckId, {
        status: 'ready',
        enrichmentProgress: {
          currentOperation: 'Enrichment failed',
        }
      });
      
      console.error('📡 Deck status update:', {
        deckId,
        status: 'ready',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1, // Process one deck at a time
  }
);

deckEnrichmentWorker.on('completed', (job) => {
  console.log(`✅ Deck enrichment completed for ${job.data.deckName}`);
});

deckEnrichmentWorker.on('failed', (job, err) => {
  console.error(`❌ Deck enrichment failed for ${job?.data.deckName}:`, err);
});