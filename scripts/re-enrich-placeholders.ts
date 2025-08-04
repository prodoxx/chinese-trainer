import mongoose from 'mongoose';
import Card from '../src/lib/db/models/Card';
import { searchImage, getAttributionText, getAttributionUrl } from '../src/lib/enrichment/unsplash';
import { getVisualSearchTerm } from '../src/lib/enrichment/image-search-mapper';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/danbing';

async function reEnrichPlaceholders() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  
  // Find cards with placeholder images
  const placeholderCards = await Card.find({
    imageUrl: { $regex: /placeholder/ }
  }).sort({ hanzi: 1 });
  
  console.log(`Found ${placeholderCards.length} cards with placeholder images\n`);
  
  let successCount = 0;
  
  for (const card of placeholderCards) {
    const searchQuery = getVisualSearchTerm(card.hanzi, card.meaning);
    console.log(`Re-enriching ${card.hanzi} (${card.meaning}) -> searching: "${searchQuery}"`);
    
    const image = await searchImage(searchQuery);
    
    if (image) {
      card.imageUrl = image.urls.regular;
      card.unsplashImageId = image.id;
      card.imageAttribution = getAttributionText(image);
      card.imageAttributionUrl = getAttributionUrl(image);
      await card.save();
      successCount++;
      console.log(`✅ Found image for ${card.hanzi}`);
    } else {
      console.log(`❌ No image found for ${card.hanzi}`);
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\nRe-enrichment complete!`);
  console.log(`Successfully updated ${successCount} out of ${placeholderCards.length} cards`);
  
  await mongoose.connection.close();
}

// Check if Unsplash key is configured
if (!process.env.UNSPLASH_ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY not found in environment variables');
  console.error('Please add your Unsplash API credentials to .env file');
  process.exit(1);
}

reEnrichPlaceholders().catch(console.error);