import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import { createApi } from 'unsplash-js';

export async function GET() {
  try {
    await connectDB();
    
    const debug: any = {
      environment: {
        unsplashKey: process.env.UNSPLASH_ACCESS_KEY ? '✅ Set' : '❌ Not set',
        mongoUri: process.env.MONGODB_URI ? '✅ Set' : '❌ Not set',
      },
      database: {},
      unsplashTest: {},
      sampleCards: [],
    };
    
    // Database statistics
    const totalCards = await Card.countDocuments();
    const cachedCards = await Card.countDocuments({ cached: true });
    const cardsWithImages = await Card.countDocuments({ imageUrl: { $exists: true, $ne: null } });
    const cardsWithUnsplashImages = await Card.countDocuments({ 
      imageUrl: { $exists: true, $regex: /unsplash/ } 
    });
    
    debug.database = {
      totalCards,
      cachedCards,
      cardsWithImages,
      cardsWithUnsplashImages,
      percentageWithImages: totalCards > 0 ? Math.round((cardsWithImages / totalCards) * 100) : 0,
    };
    
    // Sample cards with Unsplash images
    const sampleCards = await Card.find({ 
      imageUrl: { $exists: true, $regex: /unsplash/ } 
    }).limit(3);
    
    debug.sampleCards = sampleCards.map(card => ({
      hanzi: card.hanzi,
      meaning: card.meaning,
      imageUrl: card.imageUrl,
      imageAttribution: card.imageAttribution,
      cached: card.cached,
    }));
    
    // Test Unsplash API
    if (process.env.UNSPLASH_ACCESS_KEY) {
      try {
        const unsplash = createApi({
          accessKey: process.env.UNSPLASH_ACCESS_KEY,
        });
        
        const result = await unsplash.search.getPhotos({
          query: 'cat',
          perPage: 1,
        });
        
        if (result.errors) {
          debug.unsplashTest = {
            status: '❌ Error',
            errors: result.errors,
          };
        } else {
          debug.unsplashTest = {
            status: '✅ Working',
            testResults: result.response?.results?.length || 0,
            rateLimit: result.response?.total || 'Unknown',
          };
        }
      } catch (error: any) {
        debug.unsplashTest = {
          status: '❌ Error',
          error: error.message,
        };
      }
    } else {
      debug.unsplashTest = {
        status: '❌ No API key',
      };
    }
    
    // Find cards with placeholder images
    const placeholderCards = await Card.find({ 
      imageUrl: { $exists: true, $regex: /placeholder/ }
    }).limit(5);
    
    debug.cardsWithPlaceholders = placeholderCards.map(card => ({
      hanzi: card.hanzi,
      meaning: card.meaning,
      cached: card.cached,
    }));
    
    return NextResponse.json(debug, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: error.message 
    }, { status: 500 });
  }
}