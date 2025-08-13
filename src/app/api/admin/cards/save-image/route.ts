import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Card from '@/lib/db/models/Card'
import { uploadToR2, deleteFromR2, generateUniqueMediaKeys } from '@/lib/r2-storage'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId, imageUrl, prompt } = await req.json()

    if (!cardId || !imageUrl || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Download the image from the temporary URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from temporary URL')
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    
    // Connect to database first to get the old image path
    await connectDB()
    
    // Get the current card to find the old image path and get hanzi/pinyin
    const currentCard = await Card.findById(cardId)
    if (!currentCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    
    // Generate unique storage key using the same pattern as shared images
    // This creates: media/shared/[12-char-hash]/[16-char-random].jpg
    const { image: newImageKey } = generateUniqueMediaKeys(
      currentCard.hanzi, 
      currentCard.pinyin || ''
    )
    
    // Upload new image to R2 using the generated key
    const uploadResult = await uploadToR2(newImageKey, imageBuffer, {
      contentType: 'image/jpeg'  // Use JPEG like shared images
    })

    if (!uploadResult) {
      throw new Error('Failed to upload image to R2')
    }
    
    // Delete old image from R2 if it exists
    if (currentCard.imagePath) {
      try {
        console.log(`Deleting old image from R2: ${currentCard.imagePath}`)
        await deleteFromR2(currentCard.imagePath)
      } catch (error) {
        // Log but don't fail if deletion fails
        console.error('Failed to delete old image from R2:', error)
      }
    }
    
    // Construct the image URL - strip 'media/' prefix for the API endpoint
    const imagePath = newImageKey.replace('media/', '')
    const finalImageUrl = `/api/media/${imagePath}`
    
    // Update the database with the new image URL, path and prompt
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { 
        imageUrl: finalImageUrl,
        imagePrompt: prompt,
        imagePath: newImageKey,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      imageUrl: finalImageUrl,
      imagePath: newImageKey,
      message: 'Image saved successfully'
    })

  } catch (error) {
    console.error('Error saving image:', error)
    return NextResponse.json({ 
      error: 'Failed to save image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}