import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import DeckCard from '@/lib/db/models/DeckCard';
import Card from '@/lib/db/models/Card';
import Review from '@/lib/db/models/Review';
import { Types } from 'mongoose';
const { ObjectId } = Types;

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
    
    // Find the deck for current user
    const deck = await Deck.findOne({ _id: deckId, userId: session.user.id });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Ensure Card model is registered
    await Card.findOne({}).limit(1);
    
    // Get all deck-card associations
    const deckCards = await DeckCard.find({ deckId }).populate('cardId');
    
    // Get review stats for each card for current user
    const cardIds = deckCards.map(dc => (dc.cardId as any)._id);
    const reviews = await Review.find({ 
      userId: session.user.id,
      cardId: { $in: cardIds },
      deckId: new ObjectId(deckId)
    });
    
    // Create a map of card stats
    const cardStatsMap = new Map();
    
    cardIds.forEach(cardId => {
      const cardReview = reviews.find(r => r.cardId.toString() === cardId.toString());
      
      cardStatsMap.set(cardId.toString(), {
        totalReviews: cardReview ? cardReview.seen : 0,
        correctReviews: cardReview ? cardReview.correct : 0,
        accuracy: cardReview && cardReview.seen > 0 ? (cardReview.correct / cardReview.seen) * 100 : 0,
        lastReviewed: cardReview ? cardReview.lastReviewedAt : null,
        difficulty: cardReview ? cardReview.ease : 2.5
      });
    });
    
    // Format the cards data with stats
    const cards = deckCards.map(dc => {
      const card = dc.cardId as any;
      const cardId = card._id.toString();
      const stats = cardStatsMap.get(cardId);
      
      return {
        _id: cardId,
        hanzi: card.hanzi,
        pinyin: card.pinyin || '',
        english: card.meaning ? [card.meaning] : [],
        imageUrl: card.imageUrl,
        audioUrl: card.audioUrl,
        stats: stats,
        semanticCategory: card.semanticCategory,
        tonePattern: card.tonePattern,
        overallDifficulty: card.overallDifficulty
      };
    });
    
    return NextResponse.json({
      _id: deck._id.toString(),
      name: deck.name,
      cards: cards
    });
    
  } catch (error) {
    console.error('Get deck error:', error);
    return NextResponse.json({ error: 'Failed to fetch deck' }, { status: 500 });
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
    
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Find the deck for current user
    const deck = await Deck.findOne({ _id: deckId, userId: session.user.id });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Delete all deck-card associations
    const deletedAssociations = await DeckCard.deleteMany({ deckId });
    
    // Delete the deck
    await Deck.findByIdAndDelete(deckId);
    
    // Note: We don't delete the cards themselves as they might be used in other decks
    // Reviews are kept as they're associated with the card, not the deck
    
    return NextResponse.json({
      message: 'Deck deleted successfully',
      deletedDeck: deck.name,
      deletedAssociations: deletedAssociations.deletedCount,
      note: 'Cards are preserved as they may be used in other decks',
    });
    
  } catch (error) {
    console.error('Delete deck error:', error);
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid deck name' },
        { status: 400 }
      );
    }
    
    const updatedDeck = await Deck.findOneAndUpdate(
      { _id: deckId, userId: session.user.id },
      { name: name.trim() },
      { new: true }
    );
    
    if (!updatedDeck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      deck: {
        id: updatedDeck._id.toString(),
        name: updatedDeck.name,
        cardsCount: updatedDeck.cardsCount,
        status: updatedDeck.status,
        updatedAt: updatedDeck.updatedAt
      }
    });
  } catch (error) {
    console.error('Update deck error:', error);
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 }
    );
  }
}