import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
// Removed: CharacterAnalysis deprecated - all data now in Cards collection
import { deleteFromR2 } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
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

    const { cardIds } = await request.json();

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json({ error: 'No cards selected' }, { status: 400 });
    }

    await connectDB();

    const results = {
      deleted: [] as Array<{ id: string; hanzi: string }>,
      skipped: [] as Array<{ id: string; hanzi: string; reason: string; decks: string[] }>,
      errors: [] as Array<{ id: string; error: string }>,
    };

    // Process each card
    for (const cardId of cardIds) {
      try {
        // Find the card
        const card = await Card.findById(cardId);
        
        if (!card) {
          results.errors.push({ id: cardId, error: 'Card not found' });
          continue;
        }

        // Check if card is used in any deck
        const deckUsage = await DeckCard.countDocuments({ cardId });
        
        if (deckUsage > 0) {
          results.skipped.push({
            id: cardId,
            hanzi: card.hanzi,
            reason: `Used in ${deckUsage} deck(s)`,
            decks: []
          });
          continue;
        }

        // Delete media files from R2 if they exist
        const deletePromises = [];
        
        if (card.imagePath) {
          deletePromises.push(
            deleteFromR2(card.imagePath).catch(err => {
              console.error(`Failed to delete image for ${card.hanzi}:`, err);
            })
          );
        }

        if (card.audioPath) {
          deletePromises.push(
            deleteFromR2(card.audioPath).catch(err => {
              console.error(`Failed to delete audio for ${card.hanzi}:`, err);
            })
          );
        }

        // Delete media files in parallel
        await Promise.all(deletePromises);

        // Delete the card from database
        await Card.findByIdAndDelete(cardId);

        // Character analysis data is now stored directly in the Card model
        // No separate collection to clean up

        results.deleted.push({
          id: cardId,
          hanzi: card.hanzi
        });

      } catch (error: any) {
        console.error(`Error processing card ${cardId}:`, error);
        results.errors.push({
          id: cardId,
          error: error.message || 'Unknown error'
        });
      }
    }

    console.log(`Bulk delete by admin ${session.user.email}:`, {
      requested: cardIds.length,
      deleted: results.deleted.length,
      skipped: results.skipped.length,
      errors: results.errors.length
    });

    // Prepare summary message
    let message = '';
    if (results.deleted.length > 0) {
      message += `Successfully deleted ${results.deleted.length} card(s)`;
    }
    if (results.skipped.length > 0) {
      if (message) message += '. ';
      message += `Skipped ${results.skipped.length} card(s) in use by decks`;
    }
    if (results.errors.length > 0) {
      if (message) message += '. ';
      message += `${results.errors.length} error(s) occurred`;
    }

    return NextResponse.json({
      success: true,
      message,
      results,
      summary: {
        requested: cardIds.length,
        deleted: results.deleted.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      }
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk delete' },
      { status: 500 }
    );
  }
}