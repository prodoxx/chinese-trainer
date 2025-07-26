import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
import Review from '@/lib/db/models/Review';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const deckName = formData.get('name') as string;
    
    if (!file || !deckName) {
      return NextResponse.json({ error: 'File and deck name required' }, { status: 400 });
    }
    
    const text = await file.text();
    const lines = text.trim().split('\n');
    
    if (lines.length === 0 || !lines[0].toLowerCase().includes('hanzi')) {
      return NextResponse.json({ error: 'CSV must have "hanzi" header' }, { status: 400 });
    }
    
    const hanziList: string[] = [];
    const errors: { row: number; error: string }[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const hanzi = lines[i].trim();
      
      if (!hanzi) continue;
      
      if (!/^[\u4e00-\u9fff]+$/.test(hanzi)) {
        errors.push({ row: i + 1, error: 'Not a valid Chinese character or word' });
        continue;
      }
      
      // Optionally limit word length (e.g., max 4 characters)
      if (hanzi.length > 4) {
        errors.push({ row: i + 1, error: 'Word too long (max 4 characters)' });
        continue;
      }
      
      hanziList.push(hanzi);
    }
    
    const slug = deckName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const deck = await Deck.findOneAndUpdate(
      { slug },
      { name: deckName, slug, cardsCount: hanziList.length },
      { upsert: true, new: true }
    );
    
    let newCardsCount = 0;
    let existingCardsCount = 0;
    
    const cardPromises = hanziList.map(async (hanzi) => {
      // Find or create the card (shared across all decks)
      let card = await Card.findOne({ hanzi });
      
      if (!card) {
        // New character - create it
        card = await Card.create({ hanzi });
        newCardsCount++;
        
        // Create review record for new card
        await Review.create({ cardId: card._id });
      } else {
        existingCardsCount++;
      }
      
      // Link card to this deck (many-to-many relationship)
      await DeckCard.findOneAndUpdate(
        { deckId: deck._id, cardId: card._id },
        { deckId: deck._id, cardId: card._id },
        { upsert: true }
      );
      
      return card;
    });
    
    await Promise.all(cardPromises);
    
    return NextResponse.json({
      deck: {
        id: deck._id,
        name: deck.name,
        slug: deck.slug,
        cardsCount: deck.cardsCount,
      },
      imported: hanziList.length,
      newCards: newCardsCount,
      existingCards: existingCardsCount,
      errors,
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}