import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cardEnrichmentQueue, deckEnrichmentQueue } from '@/lib/queue/queues';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await context.params;
    
    // Try to get job from card enrichment queue first
    let job = await cardEnrichmentQueue().getJob(jobId);
    let queueType = 'card';
    
    // If not found, try deck enrichment queue
    if (!job) {
      job = await deckEnrichmentQueue().getJob(jobId);
      queueType = 'deck';
    }
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if this job belongs to the user
    const jobUserId = job.data.userId || job.data.sessionId;
    if (jobUserId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    // Format response based on queue type
    const response: any = {
      id: job.id,
      state,
      progress: queueType === 'deck' && typeof progress === 'object' ? progress : { progress: progress || 0 },
      result,
      failedReason,
      queueType
    };
    
    // Add specific data based on queue type
    if (queueType === 'card') {
      response.data = {
        cardId: job.data.cardId,
        hanzi: result?.card?.hanzi,
      };
    } else if (queueType === 'deck') {
      response.data = {
        deckId: job.data.deckId,
        deckName: job.data.deckName,
        cardId: job.data.cardId,
        hanzi: job.data.hanzi
      };
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}