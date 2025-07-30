import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import { deckImportQueue } from '@/lib/queue/queues';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const deckName = formData.get('name') as string;
    const sessionId = formData.get('sessionId') as string;
    const disambiguationSelectionsStr = formData.get('disambiguationSelections') as string | null;
    
    if (!file || !deckName || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Parse disambiguation selections if provided
    let disambiguationSelections: Record<string, { pinyin: string; meaning: string }> | null = null;
    if (disambiguationSelectionsStr) {
      try {
        disambiguationSelections = JSON.parse(disambiguationSelectionsStr);
      } catch (e) {
        console.error('Failed to parse disambiguation selections:', e);
      }
    }
    
    // Read file content
    const text = await file.text();
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' }, 
        { status: 400 }
      );
    }
    
    // Parse CSV - check if first line is a header or a character
    let startIndex = 0;
    const firstLine = lines[0].trim();
    
    // If first line contains "hanzi" or doesn't look like Chinese characters, skip it
    if (firstLine.toLowerCase().includes('hanzi') || 
        !/^[\u4e00-\u9fff]+$/.test(firstLine)) {
      startIndex = 1;
    }
    
    const hanziList: string[] = [];
    const errors: { row: number; error: string }[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const hanzi = lines[i].trim();
      if (!hanzi) continue;
      
      if (!/^[\u4e00-\u9fff]+$/.test(hanzi)) {
        errors.push({ row: i + 1, error: 'Not a valid Chinese character or word' });
        continue;
      }
      
      if (hanzi.length > 4) {
        errors.push({ row: i + 1, error: 'Word too long (max 4 characters)' });
        continue;
      }
      
      hanziList.push(hanzi);
    }
    
    if (hanziList.length === 0) {
      return NextResponse.json(
        { error: 'No valid characters found in CSV' }, 
        { status: 400 }
      );
    }
    
    // Connect to DB and create deck
    await connectDB();
    
    const slug = deckName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Create unique slug for this user
    const existingDeck = await Deck.findOne({ userId: session.user.id, slug });
    const finalSlug = existingDeck ? `${slug}-${Date.now()}` : slug;
    
    const deck = await Deck.create({
      userId: session.user.id,
      name: deckName, 
      slug: finalSlug, 
      cardsCount: hanziList.length,
      status: 'importing',
      enrichmentProgress: {
        totalCards: hanziList.length,
        processedCards: 0,
        currentOperation: 'Importing characters...'
      }
    });
    
    // Queue import job with disambiguation selections
    const job = await deckImportQueue.add(
      `import-${deck._id}`,
      {
        deckId: deck._id.toString(),
        userId: session.user.id,
        deckName,
        hanziList,
        sessionId,
        disambiguationSelections,
      }
    );
    
    // Return response
    return NextResponse.json({
      deck: {
        id: deck._id.toString(),
        name: deck.name,
        slug: deck.slug,
        cardsCount: deck.cardsCount,
        status: deck.status,
      },
      jobId: job.id,
      status: 'importing',
      message: `Deck created. Importing ${hanziList.length} characters...`,
      errors,
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed' }, 
      { status: 500 }
    );
  }
}