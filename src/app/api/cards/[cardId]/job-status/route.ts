import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import { cardEnrichmentQueue } from '@/lib/queue/queues'
import Card from '@/lib/db/models/Card'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const resolvedParams = await params
    
    // Verify the card exists
    const card = await Card.findById(resolvedParams.cardId)
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    
    // Get the queue to check for jobs
    const enrichmentQueue = cardEnrichmentQueue()
    
    // Check for active jobs for this card
    const jobs = await enrichmentQueue.getJobs(['active', 'waiting', 'delayed'])
    
    // Find any job that's processing this card
    const activeJob = jobs.find(job => {
      const jobData = job.data
      return jobData.cardId === resolvedParams.cardId || 
             (jobData.cardIds && jobData.cardIds.includes(resolvedParams.cardId))
    })
    
    if (activeJob) {
      const state = await activeJob.getState()
      const progress = activeJob.progress
      
      return NextResponse.json({
        jobId: activeJob.id,
        state: state,
        progress: typeof progress === 'object' ? progress : { message: progress }
      })
    }
    
    // No active job found
    return NextResponse.json({
      jobId: null,
      state: 'none'
    })
  } catch (error) {
    console.error('Error checking job status:', error)
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    )
  }
}