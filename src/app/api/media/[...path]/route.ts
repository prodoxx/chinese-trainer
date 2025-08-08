import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { downloadFromR2 } from '@/lib/r2-storage';

/**
 * Secure media access endpoint
 * Only authenticated users can access media files
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { path } = await context.params;
    const fullPath = path.join('/');
    
    // Only allow access to shared paths
    if (!fullPath.startsWith('shared/')) {
      return NextResponse.json(
        { error: 'Invalid media path' }, 
        { status: 403 }
      );
    }
    
    // Prepend 'media/' for R2 storage path
    const r2Path = `media/${fullPath}`;
    
    // Download from R2
    try {
      const data = await downloadFromR2(r2Path);
      
      // Determine content type
      let contentType = 'application/octet-stream';
      if (fullPath.endsWith('.mp3')) {
        contentType = 'audio/mpeg';
      } else if (fullPath.endsWith('.jpg') || fullPath.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (fullPath.endsWith('.png')) {
        contentType = 'image/png';
      }
      
      // Check if this is a cache-busting request (has timestamp parameter)
      const url = new URL(request.url);
      const hasTimestamp = url.searchParams.has('t');
      
      // Return the file with proper headers
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          // If URL has timestamp parameter, the content is fresh (just generated)
          // Use short cache to prevent excessive R2 requests while allowing updates
          // If no timestamp, use longer cache since media is immutable once generated
          'Cache-Control': hasTimestamp 
            ? 'public, max-age=3600, stale-while-revalidate=86400' // 1 hour cache, 1 day stale
            : 'public, max-age=31536000, immutable', // 1 year cache for immutable content
          'ETag': `"${Buffer.from(data).length}-${fullPath}"`,
        },
      });
    } catch (error) {
      console.error('Error downloading from R2:', error);
      return NextResponse.json(
        { error: 'Media not found' }, 
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Media access error:', error);
    return NextResponse.json(
      { error: 'Failed to access media' }, 
      { status: 500 }
    );
  }
}