import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import Deck from '../src/lib/db/models/Deck';
import Card from '../src/lib/db/models/Card';
import Review from '../src/lib/db/models/Review';
import DeckCard from '../src/lib/db/models/DeckCard';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese_app';

async function cleanDatabase() {
  console.log('🗑️  Database Cleanup Script\n');
  console.log('This will delete all decks, cards, and reviews from the database.');
  console.log('The dictionary data will be preserved.\n');
  
  // Simple confirmation
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  
  try {
    // Count current data
    const deckCount = await Deck.countDocuments();
    const cardCount = await Card.countDocuments();
    const reviewCount = await Review.countDocuments();
    
    console.log('\nCurrent data:');
    console.log(`- Decks: ${deckCount}`);
    console.log(`- Cards: ${cardCount}`);
    console.log(`- Reviews: ${reviewCount}`);
    
    if (deckCount === 0 && cardCount === 0 && reviewCount === 0) {
      console.log('\n✅ Database is already clean!');
      return;
    }
    
    console.log('\nDeleting data...');
    
    // Delete all reviews first (foreign key constraint)
    await Review.deleteMany({});
    console.log('✓ Reviews deleted');
    
    // Delete all deck-card associations
    await DeckCard.deleteMany({});
    console.log('✓ Deck-Card associations deleted');
    
    // Delete all cards
    await Card.deleteMany({});
    console.log('✓ Cards deleted');
    
    // Delete all decks
    await Deck.deleteMany({});
    console.log('✓ Decks deleted');
    
    // Clean up GridFS files
    const db = mongoose.connection.db;
    const imagesBucket = new GridFSBucket(db, { bucketName: 'images' });
    const audiosBucket = new GridFSBucket(db, { bucketName: 'audios' });
    
    // Delete all images
    const imageFiles = await imagesBucket.find({}).toArray();
    for (const file of imageFiles) {
      await imagesBucket.delete(file._id);
    }
    console.log(`✓ ${imageFiles.length} images deleted from GridFS`);
    
    // Delete all audio files
    const audioFiles = await audiosBucket.find({}).toArray();
    for (const file of audioFiles) {
      await audiosBucket.delete(file._id);
    }
    console.log(`✓ ${audioFiles.length} audio files deleted from GridFS`);
    
    console.log('\n✅ Database cleaned successfully!');
    console.log('\nYou can now re-import your decks with the improved enrichment system.');
    
  } catch (error) {
    console.error('\n❌ Error cleaning database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Add option to clean specific deck
async function cleanDeck(deckName: string) {
  console.log(`🗑️  Cleaning deck: ${deckName}\n`);
  
  await mongoose.connect(MONGODB_URI);
  
  try {
    const deck = await Deck.findOne({ name: deckName });
    
    if (!deck) {
      console.log(`❌ Deck "${deckName}" not found`);
      return;
    }
    
    // Find all cards in this deck
    const cards = await Card.find({ deckId: deck._id });
    const cardIds = cards.map(c => c._id);
    
    // Delete reviews for these cards
    await Review.deleteMany({ cardId: { $in: cardIds } });
    console.log(`✓ Deleted reviews for ${cardIds.length} cards`);
    
    // Delete cards
    await Card.deleteMany({ deckId: deck._id });
    console.log(`✓ Deleted ${cards.length} cards`);
    
    // Delete deck
    await Deck.deleteOne({ _id: deck._id });
    console.log(`✓ Deleted deck "${deckName}"`);
    
    console.log('\n✅ Deck cleaned successfully!');
    
  } catch (error) {
    console.error('\n❌ Error cleaning deck:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args[0] === '--deck' && args[1]) {
  cleanDeck(args[1]).catch(console.error);
} else {
  cleanDatabase().catch(console.error);
}