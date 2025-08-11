import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
// Removed: CharacterAnalysis deprecated - all data now in Cards collection
import { deleteFromR2 } from '@/lib/r2-storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    const { cardId } = await params;

    // Find the card
    const card = await Card.findById(cardId);
    
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Check if card is used in any deck
    const deckUsage = await DeckCard.countDocuments({ cardId });
    
    if (deckUsage > 0) {
      return NextResponse.json({
        error: 'Cannot delete card',
        message: `This card is currently being used in ${deckUsage} deck${deckUsage > 1 ? 's' : ''}`,
        deckCount: deckUsage
      }, { status: 400 });
    }

    // Delete media files from R2 if they exist
    const mediaDeleted = {
      image: false,
      audio: false
    };

    if (card.imagePath) {
      try {
        await deleteFromR2(card.imagePath);
        mediaDeleted.image = true;
        console.log(`Deleted image from R2: ${card.imagePath}`);
      } catch (error) {
        console.error(`Failed to delete image from R2: ${card.imagePath}`, error);
      }
    }

    if (card.audioPath) {
      try {
        await deleteFromR2(card.audioPath);
        mediaDeleted.audio = true;
        console.log(`Deleted audio from R2: ${card.audioPath}`);
      } catch (error) {
        console.error(`Failed to delete audio from R2: ${card.audioPath}`, error);
      }
    }

    // Delete the card from database
    await Card.findByIdAndDelete(cardId);

    // Character analysis data is now stored directly in the Card model
    // No separate collection to clean up

    console.log(`Card ${card.hanzi} (${cardId}) deleted by admin ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Card deleted successfully',
      deletedCard: {
        id: cardId,
        hanzi: card.hanzi,
        mediaDeleted
      }
    });

  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}