import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEnrichmentStats } from '@/lib/enrichment-limits';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Admin users have unlimited enrichments
    if (session.user.role === 'admin') {
      return NextResponse.json({
        unlimited: true,
        isAdmin: true,
        message: 'Admin users have unlimited enrichments'
      });
    }

    // Get enrichment stats for regular users
    const stats = await getEnrichmentStats(session.user.id);
    
    return NextResponse.json({
      ...stats,
      unlimited: false,
      isAdmin: false
    });
    
  } catch (error) {
    console.error('Failed to get enrichment stats:', error);
    return NextResponse.json(
      { error: 'Failed to get enrichment stats' }, 
      { status: 500 }
    );
  }
}