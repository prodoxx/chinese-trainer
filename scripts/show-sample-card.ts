import mongoose from 'mongoose';
import Card from '../src/lib/db/models/Card';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/danbing';

async function showSampleCard() {
  await mongoose.connect(MONGODB_URI);
  
  // Find a card with Unsplash image
  const card = await Card.findOne({ 
    imageUrl: { $regex: /unsplash/ } 
  });
  
  if (card) {
    console.log('Sample Card with Unsplash Image:');
    console.log('================================');
    console.log(`Hanzi: ${card.hanzi}`);
    console.log(`Meaning: ${card.meaning}`);
    console.log(`Pinyin: ${card.pinyin}`);
    console.log(`Image URL: ${card.imageUrl}`);
    console.log(`Unsplash ID: ${card.unsplashImageId}`);
    console.log(`Attribution: ${card.imageAttribution}`);
    console.log(`Attribution URL: ${card.imageAttributionUrl}`);
    console.log(`Cached: ${card.cached}`);
  }
  
  await mongoose.connection.close();
}

showSampleCard().catch(console.error);