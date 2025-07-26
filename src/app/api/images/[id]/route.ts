import { NextRequest, NextResponse } from 'next/server';
import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoClient } from '@/lib/db/mongodb';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const client = await getMongoClient();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    
    const fileId = new ObjectId(id);
    
    // Check if file exists
    const files = await bucket.find({ _id: fileId }).toArray();
    if (files.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    const file = files[0];
    const contentType = file.contentType || 'image/png';
    
    // Stream the image file
    const downloadStream = bucket.openDownloadStream(fileId);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);
    
    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}