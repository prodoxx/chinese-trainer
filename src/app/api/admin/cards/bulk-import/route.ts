import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBulkImportQueue } from '@/lib/queue/queues'
import crypto from 'crypto'

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

    // Generate a unique session ID for this import
    const sessionId = crypto.randomUUID()

    // Queue the bulk import job
    const queue = getBulkImportQueue()
    const job = await queue.add(
      'bulk-import',
      {
        characters,
        userId: session.user.id,
        sessionId,
        enrichImmediately: enrichImmediately ?? true,
        aiProvider: aiProvider || 'openai'
      },
      {
        // Job options
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    )

    console.log(`📋 Bulk import job queued: ${job.id}`)
    console.log(`   Characters: ${characters.length}`)
    console.log(`   Session: ${sessionId}`)
    console.log(`   Enrich: ${enrichImmediately}`);

    // Return immediately with job information
    return NextResponse.json({
      success: true,
      jobId: job.id,
      sessionId,
      message: `Bulk import started for ${characters.length} characters`,
      status: 'queued',
      totalCharacters: characters.length
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to start bulk import' },
      { status: 500 }
    )
  }
}

// New endpoint to check job status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const queue = getBulkImportQueue()
    const job = await queue.getJob(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const state = await job.getState()
    const progress = job.progress

    // Get the result if job is completed
    let result = null
    if (state === 'completed') {
      result = job.returnvalue
    } else if (state === 'failed') {
      result = {
        error: job.failedReason,
        attemptsMade: job.attemptsMade,
        attemptsMax: job.opts.attempts
      }
    }

    return NextResponse.json({
      jobId: job.id,
      state,
      progress,
      result,
      createdAt: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}