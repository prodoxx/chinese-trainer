import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Dictionary from '@/lib/db/models/Dictionary';
import { generateSharedAudio, generateSharedImage } from '@/lib/enrichment/shared-media';
import { getPreferredEntry } from '@/lib/enrichment/multi-pronunciation-handler';
import { convertPinyinToneNumbersToMarks } from '@/lib/utils/pinyin';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { cardId, force = false, deckId } = await request.json();
    
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
    }
    
    // Find the card
    const card = await Card.findById(cardId);
    
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    
    console.log(`Re-enriching card: ${card.hanzi} (force: ${force})`);
    
    // Look up in CEDICT if meaning/pinyin is missing
    if (!card.meaning || !card.pinyin || card.meaning === 'Unknown character' || force) {
      // Find ALL dictionary entries for this character (for multiple pronunciations)
      const dictEntries = await Dictionary.find({ 
        traditional: card.hanzi 
      });
      
      if (dictEntries.length > 0) {
        // Use the multi-pronunciation handler to get the preferred entry
        const selectedEntry = getPreferredEntry(card.hanzi, dictEntries);
        
        // Use the selected entry
        card.meaning = selectedEntry.definitions[0] || 'No definition';
        card.pinyin = convertPinyinToneNumbersToMarks(selectedEntry.pinyin);
        
        // Log if there are multiple pronunciations
        if (dictEntries.length > 1) {
          console.log(`Multiple pronunciations found for ${card.hanzi}:`);
          dictEntries.forEach(entry => {
            console.log(`  ${entry.pinyin}: ${entry.definitions.join(', ')}`);
          });
          console.log(`Selected: ${card.pinyin} - ${card.meaning}`);
        }
      }
    }
    
    // Re-generate image if force=true or no image exists
    if (force || !card.imageUrl || card.imageUrl === '') {
      console.log(`Generating new image for ${card.hanzi}`);
      
      // Use shared media generation with force flag
      const imageResult = await generateSharedImage(
        card.hanzi, 
        card.meaning, 
        card.pinyin,
        force
      );
      
      if (imageResult.imageUrl) {
        card.imageUrl = imageResult.imageUrl;
        card.imageSource = 'dalle';
        card.imageSourceId = imageResult.cached ? 'cached' : 'generated';
        card.imageAttribution = 'AI Generated';
        card.imageAttributionUrl = '';
      }
    }
    
    // Re-generate audio if missing
    if (!card.audioUrl) {
      console.log(`Generating audio for ${card.hanzi}`);
      try {
        const audioResult = await generateSharedAudio(card.hanzi);
        card.audioUrl = audioResult.audioUrl;
      } catch (audioError) {
        console.error(`Audio generation failed for ${card.hanzi}:`, audioError);
      }
    }
    
    // Save the updated card
    await card.save();
    
    // Return the updated card data
    return NextResponse.json({
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
    });
    
  } catch (error) {
    console.error('Re-enrichment error:', error);
    return NextResponse.json({ 
      error: 'Re-enrichment failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}