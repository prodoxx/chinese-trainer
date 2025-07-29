import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
import Dictionary from '@/lib/db/models/Dictionary';
import { searchForImageR2 } from '@/lib/enrichment/unified-image-search-r2';
import { generateTTSAudioR2 } from '@/lib/enrichment/azure-tts-r2';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { deckId, limit = 10 } = await request.json();
    
    if (!deckId) {
      return NextResponse.json({ error: 'Deck ID required' }, { status: 400 });
    }
    
    // Find cards in this deck that aren't enriched yet
    const deckCards = await DeckCard.find({ deckId })
      .populate('cardId')
      .limit(limit);
    
    const cards = deckCards
      .map(dc => dc.cardId)
      .filter(card => card && !(card as any).cached);
    
    const enrichedCards = [];
    
    for (const card of cards) {
      // Get the card's ID for R2 storage
      const cardId = card._id.toString();
      
      // Look up in CEDICT
      const dictEntry = await Dictionary.findOne({ 
        traditional: card.hanzi 
      });
      
      if (dictEntry) {
        // Use the first definition
        card.meaning = dictEntry.definitions[0] || 'No definition';
        card.pinyin = dictEntry.pinyin;
      } else {
        // Fallback for characters not in dictionary
        card.meaning = 'Unknown character';
        card.pinyin = 'Unknown';
      }
      
      // Search for image using unified search with R2
      const image = await searchForImageR2(
        card.hanzi, 
        card.meaning, 
        card.pinyin,
        deckId,
        cardId
      );
      
      // Only set image fields if we got a valid image (not skipped)
      if (image.url) {
        card.imageUrl = image.url;
        card.imageSource = image.source;
        card.imageSourceId = image.sourceId;
        card.imageAttribution = image.attribution;
        card.imageAttributionUrl = image.attributionUrl;
      } else {
        // Clear any existing image data for skipped images
        card.imageUrl = '';
        card.imageSource = undefined;
        card.imageSourceId = undefined;
        card.imageAttribution = undefined;
        card.imageAttributionUrl = undefined;
      }
      
      // Generate TTS audio with R2
      try {
        const ttsResult = await generateTTSAudioR2(card.hanzi, deckId, cardId);
        card.audioUrl = ttsResult.audioUrl;
      } catch (ttsError) {
        console.error(`TTS generation failed for ${card.hanzi}:`, ttsError);
        // Continue without audio - it's not critical
      }
      
      card.cached = true;
      
      await card.save();
      enrichedCards.push({
        id: card._id,
        hanzi: card.hanzi,
        meaning: card.meaning,
        pinyin: card.pinyin,
        imageUrl: card.imageUrl,
        imageAttribution: card.imageAttribution,
        imageAttributionUrl: card.imageAttributionUrl,
        audioUrl: card.audioUrl,
      });
    }
    
    return NextResponse.json({
      enriched: enrichedCards.length,
      cards: enrichedCards,
    });
    
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
  }
}