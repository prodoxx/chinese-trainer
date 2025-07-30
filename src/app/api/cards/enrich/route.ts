import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
import Dictionary from '@/lib/db/models/Dictionary';
import { searchForImage } from '@/lib/enrichment/unified-image-search';
import { generateTTSAudio } from '@/lib/enrichment/azure-tts';
import { getPreferredEntry } from '@/lib/enrichment/multi-pronunciation-handler';

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
      // Find ALL dictionary entries for this character (for multiple pronunciations)
      const dictEntries = await Dictionary.find({ 
        traditional: card.hanzi 
      });
      
      if (dictEntries.length > 0) {
        // Use the multi-pronunciation handler to get the preferred entry
        const selectedEntry = getPreferredEntry(card.hanzi, dictEntries);
        
        // Use the selected entry
        card.meaning = selectedEntry.definitions[0] || 'No definition';
        card.pinyin = selectedEntry.pinyin;
        
        // Log if there are multiple pronunciations
        if (dictEntries.length > 1) {
          console.log(`Multiple pronunciations found for ${card.hanzi}:`);
          dictEntries.forEach(entry => {
            console.log(`  ${entry.pinyin}: ${entry.definitions.join(', ')}`);
          });
          console.log(`Selected: ${card.pinyin} - ${card.meaning}`);
        }
      } else {
        // Fallback for characters not in dictionary
        card.meaning = 'Unknown character';
        card.pinyin = 'Unknown';
      }
      
      // Search for image using unified search (AI + multiple sources)
      const image = await searchForImage(card.hanzi, card.meaning, card.pinyin);
      
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
      
      // Generate TTS audio
      try {
        const ttsResult = await generateTTSAudio(card.hanzi);
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