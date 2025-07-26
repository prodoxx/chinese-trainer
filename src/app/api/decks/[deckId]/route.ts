import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import DeckCard from '@/lib/db/models/DeckCard';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Find the deck
    const deck = await Deck.findById(deckId);
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