import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
import Dictionary from '@/lib/db/models/Dictionary';
import { searchForImage } from '@/lib/enrichment/unified-image-search';
import { generateTTSAudio } from '@/lib/enrichment/azure-tts';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    await connectDB();
    
    const { deckId } = await context.params;
    const { force = false } = await request.json();
    
    // Find cards in this deck through DeckCard relationship
    const deckCards = await DeckCard.find({ deckId }).populate('cardId');
    
    // Extract the actual card documents
    let cards = deckCards.map(dc => dc.cardId).filter(card => card);
    
    // If not forcing, only re-enrich cards with placeholders or missing images
    if (!force) {
      cards = cards.filter(card => 
        card.imageSource === 'placeholder' ||
        !card.imageUrl ||
        card.imageUrl === '' ||
        !card.audioUrl ||
        card.audioUrl === ''
      );
    }
    
    console.log(`Re-enriching ${cards.length} cards from deck ${deckId}`);
    
    let enrichedCount = 0;
    const enrichmentResults = [];
    
    for (const card of cards) {
      try {
        // Re-fetch dictionary data in case it's improved
        const dictEntry = await Dictionary.findOne({ 
          traditional: card.hanzi 
        });
        
        if (dictEntry) {
          card.meaning = dictEntry.definitions[0] || 'No definition';
          card.pinyin = dictEntry.pinyin;
        }
        
        // Search for better image using the new AI system
        const image = await searchForImage(card.hanzi, card.meaning, card.pinyin);
        
        // Only update if we found a better image (not placeholder)
        if (image.source !== 'placeholder' || !card.imageUrl) {
          card.imageUrl = image.url;
          card.imageSource = image.source;
          card.imageSourceId = image.sourceId;
          card.imageAttribution = image.attribution;
          card.imageAttributionUrl = image.attributionUrl;
          
          if (image.source === 'unsplash') {
            card.unsplashImageId = image.sourceId;
          }
          
          // Generate TTS audio only if missing (never force re-generate audio)
          if (!card.audioUrl) {
            try {
              const ttsResult = await generateTTSAudio(card.hanzi);
              if (ttsResult.audioUrl) {
                card.audioUrl = ttsResult.audioUrl;
              }
            } catch (ttsError) {
              console.error(`TTS generation failed for ${card.hanzi}:`, ttsError);
            }
          }
          
          await card.save();
          enrichedCount++;
          
          enrichmentResults.push({
            hanzi: card.hanzi,
            oldSource: card.imageSource,
            newSource: image.source,
            hasAudio: !!card.audioUrl,
            success: true
          });
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Failed to re-enrich ${card.hanzi}:`, error);
        enrichmentResults.push({
          hanzi: card.hanzi,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }
    
    return NextResponse.json({
      totalCards: cards.length,
      enrichedCount,
      results: enrichmentResults
    });
    
  } catch (error) {
    console.error('Re-enrichment error:', error);
    return NextResponse.json({ error: 'Re-enrichment failed' }, { status: 500 });
  }
}