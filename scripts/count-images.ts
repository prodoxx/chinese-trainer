import mongoose from 'mongoose';
import Card from '../src/lib/db/models/Card';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/danbing';

async function countImages() {
  await mongoose.connect(MONGODB_URI);
  
  const totalCards = await Card.countDocuments({});
  const unsplashCards = await Card.countDocuments({ imageUrl: { $regex: /unsplash/ } });
  const placeholderCards = await Card.countDocuments({ imageUrl: { $regex: /placeholder/ } });
  
  console.log(`Total cards: ${totalCards}`);
  console.log(`Unsplash images: ${unsplashCards} (${Math.round(unsplashCards/totalCards*100)}%)`);
  console.log(`Placeholder images: ${placeholderCards} (${Math.round(placeholderCards/totalCards*100)}%)`);
  
  await mongoose.connection.close();
}

countImages().catch(console.error);