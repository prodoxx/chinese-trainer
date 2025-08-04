import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Deck from '@/lib/db/models/Deck';
import DeckCard from '@/lib/db/models/DeckCard';
import Review from '@/lib/db/models/Review';
import { cardEnrichmentQueue } from '@/lib/queue/queues';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Verify user owns this deck
    const deck = await Deck.findOne({ _id: deckId, userId: session.user.id });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Find all card associations for this deck
    const deckCards = await DeckCard.find({ deckId });
    const cardIds = deckCards.map(dc => dc.cardId);
    
    // Fetch the actual cards
    let cards = await Card.find({ _id: { $in: cardIds } });
    
    // Get reviews for current user to filter out studied cards
    const reviews = await Review.find({ 
      userId: session.user.id,
      cardId: { $in: cardIds },
      firstStudiedAt: { $exists: true }
    }).select('cardId');
    
    // Create set of studied card IDs
    const studiedCardIds = new Set(reviews.map(r => r.cardId.toString()));
    
    // Filter out cards that have been studied
    cards = cards.filter(card => !studiedCardIds.has(card._id.toString()));
    
    // Limit to 50 cards
    cards = cards.slice(0, 50);
    
    return NextResponse.json({
      cards: cards.map(card => ({
        id: card._id,
        hanzi: card.hanzi,
        meaning: card.meaning,
        pinyin: card.pinyin,
        imageUrl: card.imageUrl,
        imageAttribution: card.imageAttribution,
        imageAttributionUrl: card.imageAttributionUrl,
        audioUrl: card.audioUrl,
        cached: card.cached,
      }))
    });
    
  } catch (error) {
    console.error('Get cards error:', error);
    return NextResponse.json({ error: 'Failed to get cards' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { characters, disambiguation } = body;
    
    if (!characters || typeof characters !== 'string') {
      return NextResponse.json(
        { error: 'Invalid characters' }, 
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Verify user owns this deck
    const deck = await Deck.findOne({ _id: deckId, userId: session.user.id });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Check if card already exists
    let card = await Card.findOne({ hanzi: characters });
    
    if (!card) {
      // Create new card
      card = await Card.create({
        hanzi: characters,
        enrichmentStatus: 'pending'
      });
    }
    
    // Check if card is already in deck
    const existingDeckCard = await DeckCard.findOne({ 
      deckId: deck._id, 
      cardId: card._id 
    });
    
    if (existingDeckCard) {
      return NextResponse.json(
        { error: 'Card already exists in deck' }, 
        { status: 400 }
      );
    }
    
    // Add card to deck
    await DeckCard.create({
      deckId: deck._id,
      cardId: card._id
    });
    
    // Update deck card count
    await Deck.findByIdAndUpdate(deck._id, {
      $inc: { cardsCount: 1 }
    });
    
    // Queue enrichment job if card needs enrichment
    let jobId = null;
    if (!card.pinyin || !card.imageUrl || !card.audioUrl) {
      const job = await cardEnrichmentQueue().add(
        `enrich-card-${card._id}`,
        {
          cardId: card._id.toString(),
          hanzi: card.hanzi,
          deckId: deck._id.toString(),
          userId: session.user.id,
          force: false,
          disambiguationSelection: disambiguation || undefined
        }
      );
      jobId = job.id;
    }
    
    return NextResponse.json({
      success: true,
      cardId: card._id.toString(),
      jobId,
      message: `Added "${characters}" to deck`
    });
    
  } catch (error) {
    console.error('Add card error:', error);
    return NextResponse.json(
      { error: 'Failed to add card' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { cardId } = body;
    
    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' }, 
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Verify user owns this deck
    const deck = await Deck.findOne({ _id: deckId, userId: session.user.id });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Check if card exists in deck
    const deckCard = await DeckCard.findOne({ 
      deckId: deck._id, 
      cardId 
    });
    
    if (!deckCard) {
      return NextResponse.json(
        { error: 'Card not found in deck' }, 
        { status: 404 }
      );
    }
    
    // Remove card from deck (but keep in cards collection)
    await DeckCard.deleteOne({ 
      deckId: deck._id, 
      cardId 
    });
    
    // Update deck card count
    await Deck.findByIdAndUpdate(deck._id, {
      $inc: { cardsCount: -1 }
    });
    
    // Also remove any reviews for this card in this deck for this user
    await Review.deleteMany({
      userId: session.user.id,
      deckId: deck._id,
      cardId
    });
    
    return NextResponse.json({
      success: true,
      message: 'Card removed from deck'
    });
    
  } catch (error) {
    console.error('Remove card error:', error);
    return NextResponse.json(
      { error: 'Failed to remove card' }, 
      { status: 500 }
    );
  }
}