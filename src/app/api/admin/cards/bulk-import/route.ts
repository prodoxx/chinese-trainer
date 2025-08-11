import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Card from '@/lib/db/models/Card'
import { validateTraditionalChinese } from '@/lib/utils/chinese-validation'
import { getCardEnrichmentQueue } from '@/lib/queue/queues'
import { checkSharedMediaExists } from '@/lib/enrichment/shared-media'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { characters, enrichImmediately, aiProvider } = await request.json()

    if (!characters || !Array.isArray(characters)) {
      return NextResponse.json(
        { error: 'Invalid input. Expected array of characters.' },
        { status: 400 }
      )
    }

    await connectDB()

    const results = {
      created: [] as any[],
      skipped: [] as any[],
      errors: [] as any[],
      enrichmentJobs: [] as any[]
    }

    // Process each character
    for (const hanzi of characters) {
      try {
        // Validate Traditional Chinese
        const validation = validateTraditionalChinese(hanzi)
        if (!validation.isValid) {
          results.errors.push({
            hanzi,
            error: validation.errors[0] || 'Invalid Traditional Chinese'
          })
          continue
        }

        const cleanedHanzi = validation.cleanedText

        // Check if card already exists
        const existingCard = await Card.findOne({ hanzi: cleanedHanzi })
        
        if (existingCard) {
          results.skipped.push({
            hanzi: cleanedHanzi,
            reason: 'Already exists',
            cardId: existingCard._id
          })
          continue
        }

        // Create new card
        const newCard = new Card({
          hanzi: cleanedHanzi,
          cached: false
        })

        await newCard.save()

        results.created.push({
          hanzi: cleanedHanzi,
          cardId: newCard._id
        })

        // Queue for enrichment if requested
        if (enrichImmediately) {
          // Check if shared media already exists
          const { audioExists, imageExists } = await checkSharedMediaExists(cleanedHanzi)
          
          // Only queue if we actually need enrichment
          if (!audioExists || !imageExists || !newCard.pinyin || !newCard.meaning) {
            const queue = getCardEnrichmentQueue()
            const job = await queue.add(
              'enrich-card',
              {
                cardId: newCard._id.toString(),
                userId: session.user.id,
                deckId: null, // No deck association for bulk import
                force: false,
                aiProvider: aiProvider || 'openai' // Default to OpenAI if not specified
              }
            )

            results.enrichmentJobs.push({
              hanzi: cleanedHanzi,
              cardId: newCard._id,
              jobId: job.id
            })
          }
        }
      } catch (error) {
        console.error(`Error processing character ${hanzi}:`, error)
        results.errors.push({
          hanzi,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: characters.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
        enrichmentQueued: results.enrichmentJobs.length
      },
      results
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    )
  }
}