import mongoose from 'mongoose';
import Card from '../src/lib/db/models/Card';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/danbing';

async function checkImages() {
  await mongoose.connect(MONGODB_URI);
  
  const cards = await Card.find({}).sort({ hanzi: 1 });
  
  let unsplashCount = 0;
  let placeholderCount = 0;
  let noImageCount = 0;
  
  console.log('\nCard Image Status:');
  console.log('==================\n');
  
  for (const card of cards) {
    if (!card.imageUrl) {
      noImageCount++;
      console.log(`❌ ${card.hanzi} (${card.pinyin}) - ${card.meaning} - NO IMAGE`);
    } else if (card.imageUrl.includes('unsplash')) {
      unsplashCount++;
      console.log(`✅ ${card.hanzi} (${card.pinyin}) - ${card.meaning} - UNSPLASH`);
    } else if (card.imageUrl.includes('placeholder')) {
      placeholderCount++;
      console.log(`⚪ ${card.hanzi} (${card.pinyin}) - ${card.meaning} - PLACEHOLDER`);
    }
  }
  
  console.log('\nSummary:');
  console.log(`Total cards: ${cards.length}`);
  console.log(`Unsplash images: ${unsplashCount} (${Math.round(unsplashCount/cards.length*100)}%)`);
  console.log(`Placeholder images: ${placeholderCount} (${Math.round(placeholderCount/cards.length*100)}%)`);
  console.log(`No images: ${noImageCount}`);
  
  await mongoose.connection.close();
}

checkImages().catch(console.error);