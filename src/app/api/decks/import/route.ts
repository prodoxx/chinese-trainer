import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import { deckImportQueue } from '@/lib/queue/queues';
import { extractTraditionalChinese } from '@/lib/utils/chinese-validation';
import { checkEnrichmentLimit, incrementEnrichmentCount } from '@/lib/enrichment-limits';

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
    
    // If first line contains "hanzi" or has no Traditional Chinese characters, skip it
    const firstLineExtracted = extractTraditionalChinese(firstLine);
    if (firstLine.toLowerCase().includes('hanzi') || 
        firstLine.toLowerCase().includes('character') ||
        !firstLineExtracted) {
      startIndex = 1;
    }
    
    const hanziList: string[] = [];
    const errors: { row: number; error: string }[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const rawText = lines[i].trim();
      if (!rawText) continue;
      
      // Extract only Traditional Chinese characters
      const hanzi = extractTraditionalChinese(rawText);
      
      if (!hanzi) {
        errors.push({ row: i + 1, error: 'No valid Traditional Chinese characters found' });
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
        { error: 'No valid Traditional Chinese characters found in CSV. Please ensure your file contains Traditional Chinese characters only.' }, 
        { status: 400 }
      );
    }
    
    // Connect to DB
    await connectDB();
    
    // Check enrichment limits for non-admin users (temporary until paywall)
    const isAdmin = session.user.role === 'admin';
    const limitCheck = await checkEnrichmentLimit(session.user.id, isAdmin);
    
    if (!limitCheck.canEnrich) {
      return NextResponse.json(
        { 
          error: 'Daily enrichment limit reached', 
          message: `You have reached your daily limit of ${limitCheck.limit} card enrichments. Please try again tomorrow or upgrade to Pro for unlimited enrichments.`,
          remaining: 0,
          limit: limitCheck.limit,
          used: limitCheck.used
        }, 
        { status: 429 }
      );
    }
    
    // Check if user has enough enrichments remaining for this deck
    if (limitCheck.remaining !== -1 && hanziList.length > limitCheck.remaining) {
      return NextResponse.json(
        { 
          error: 'Insufficient enrichments remaining', 
          message: `This deck contains ${hanziList.length} cards but you only have ${limitCheck.remaining} enrichments remaining today. Please reduce the deck size or try again tomorrow.`,
          remaining: limitCheck.remaining,
          limit: limitCheck.limit,
          used: limitCheck.used,
          required: hanziList.length
        }, 
        { status: 429 }
      );
    }
    
    // Create deck
    
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
    const job = await deckImportQueue().add(
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
    
    // Increment enrichment count for non-admin users
    if (!isAdmin) {
      await incrementEnrichmentCount(session.user.id, hanziList.length);
    }
    
    // Return response with enrichment info
    const updatedLimits = isAdmin ? null : {
      remaining: Math.max(0, limitCheck.remaining - hanziList.length),
      limit: limitCheck.limit,
      used: limitCheck.used + hanziList.length
    };
    
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
      enrichmentLimits: updatedLimits
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed' }, 
      { status: 500 }
    );
  }
}