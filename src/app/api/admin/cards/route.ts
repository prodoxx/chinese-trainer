import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const filterStatus = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query: any = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { hanzi: { $regex: search, $options: 'i' } },
        { pinyin: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'enriched') {
        query.imageUrl = { $exists: true, $ne: null, $ne: '' };
        query.audioUrl = { $exists: true, $ne: null, $ne: '' };
      } else if (filterStatus === 'pending') {
        query.$or = [
          { imageUrl: { $exists: false } },
          { imageUrl: null },
          { imageUrl: '' },
          { audioUrl: { $exists: false } },
          { audioUrl: null },
          { audioUrl: '' }
        ];
      } else if (filterStatus === 'partial') {
        query.$or = [
          {
            imageUrl: { $exists: true, $ne: null, $ne: '' },
            $or: [
              { audioUrl: { $exists: false } },
              { audioUrl: null },
              { audioUrl: '' }
            ]
          },
          {
            audioUrl: { $exists: true, $ne: null, $ne: '' },
            $or: [
              { imageUrl: { $exists: false } },
              { imageUrl: null },
              { imageUrl: '' }
            ]
          }
        ];
      }
    }

    // Get total count
    const totalCount = await Card.countDocuments(query);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch cards
    const cards = await Card.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('_id hanzi pinyin meaning imageUrl audioUrl createdAt updatedAt')
      .lean();

    // Get enrichment stats
    const stats = await Card.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          enriched: [
            {
              $match: {
                imageUrl: { $exists: true, $ne: null, $ne: '' },
                audioUrl: { $exists: true, $ne: null, $ne: '' }
              }
            },
            { $count: 'count' }
          ],
          partial: [
            {
              $match: {
                $or: [
                  {
                    imageUrl: { $exists: true, $ne: null, $ne: '' },
                    $or: [
                      { audioUrl: { $exists: false } },
                      { audioUrl: null },
                      { audioUrl: '' }
                    ]
                  },
                  {
                    audioUrl: { $exists: true, $ne: null, $ne: '' },
                    $or: [
                      { imageUrl: { $exists: false } },
                      { imageUrl: null },
                      { imageUrl: '' }
                    ]
                  }
                ]
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const totalCards = stats[0]?.total[0]?.count || 0;
    const enrichedCards = stats[0]?.enriched[0]?.count || 0;
    const partialCards = stats[0]?.partial[0]?.count || 0;
    const pendingCards = totalCards - enrichedCards - partialCards;

    return NextResponse.json({
      success: true,
      cards,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages
      },
      stats: {
        total: totalCards,
        enriched: enrichedCards,
        partial: partialCards,
        pending: pendingCards
      }
    });

  } catch (error) {
    console.error('Admin cards fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}