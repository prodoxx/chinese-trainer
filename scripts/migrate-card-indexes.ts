import mongoose from 'mongoose';
import 'dotenv/config';
import Card from '../src/lib/db/models/Card';

async function migrateCardIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log(`✓ Using database: ${db.databaseName}`);

    // Get the cards collection
    const collection = db.collection('cards');

    // List existing indexes
    console.log('\nExisting indexes:');
    const existingIndexes = await collection.indexes();
    existingIndexes.forEach(index => {
      console.log(`- ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });

    // Drop the old unique index on hanzi if it exists
    try {
      await collection.dropIndex({ hanzi: 1 });
      console.log('\n✓ Dropped old unique index on hanzi');
    } catch (error: any) {
      if (error.code === 27) {
        console.log('\n- No unique index on hanzi found (already dropped)');
      } else {
        throw error;
      }
    }

    // Create the new compound unique index
    await collection.createIndex(
      { hanzi: 1, pinyin: 1 }, 
      { unique: true }
    );
    console.log('✓ Created compound unique index on hanzi + pinyin');

    // Create non-unique index on hanzi for efficient lookups
    await collection.createIndex({ hanzi: 1 });
    console.log('✓ Created non-unique index on hanzi');

    // List indexes after migration
    console.log('\nIndexes after migration:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`- ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrateCardIndexes();