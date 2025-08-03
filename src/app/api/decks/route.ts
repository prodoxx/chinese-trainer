import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import { nanoid } from 'nanoid';

export async function GET() {
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
    
    // Only return decks for the current user
    const decks = await Deck.find({ userId: session.user.id }).sort({ updatedAt: -1 });
    
    return NextResponse.json({
      decks: decks.map(deck => ({
        id: deck._id,
        name: deck.name,
        slug: deck.slug,
        cardsCount: deck.cardsCount,
        status: deck.status || 'ready',
        enrichmentProgress: deck.enrichmentProgress,
        updatedAt: deck.updatedAt,
      }))
    });
    
  } catch (error) {
    console.error('Get decks error:', error);
    return NextResponse.json({ error: 'Failed to get decks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { name, description } = body;
    
    // Validate deck name
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Deck name is required' }, 
        { status: 400 }
      );
    }
    
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return NextResponse.json(
        { error: 'Deck name cannot be empty' }, 
        { status: 400 }
      );
    }
    
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Deck name must be at least 2 characters' }, 
        { status: 400 }
      );
    }
    
    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: 'Deck name must be less than 50 characters' }, 
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if deck with same name exists for this user
    const existingDeck = await Deck.findOne({
      userId: session.user.id,
      name: trimmedName,
    });
    
    if (existingDeck) {
      return NextResponse.json(
        { error: 'A deck with this name already exists' }, 
        { status: 400 }
      );
    }
    
    // Create slug from name
    const baseSlug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Make slug unique by adding a random suffix
    const slug = `${baseSlug}-${nanoid(6)}`;
    
    // Create the deck
    const deck = await Deck.create({
      userId: session.user.id,
      name: trimmedName,
      slug,
      description: description || `Manually created deck: ${trimmedName}`,
      cardsCount: 0,
      status: 'ready',
      enrichmentProgress: {
        enriched: 0,
        total: 0,
        failed: 0,
      },
    });
    
    return NextResponse.json({
      success: true,
      deck: {
        id: deck._id,
        name: deck.name,
        slug: deck.slug,
        cardsCount: deck.cardsCount,
        status: deck.status,
        enrichmentProgress: deck.enrichmentProgress,
        updatedAt: deck.updatedAt,
      },
    });
    
  } catch (error) {
    console.error('Create deck error:', error);
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 });
  }
}