#!/usr/bin/env bun

/**
 * Script to fix MongoDB card collection indexes
 * Removes the old unique index on hanzi field that's causing duplicate key errors
 * The correct index should be a compound unique index on hanzi + pinyin
 */

import mongoose from 'mongoose';
import { Collection, IndexDescription } from 'mongodb';

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

interface IndexInfo extends IndexDescription {
  name?: string;
  unique?: boolean;
}

async function fixCardIndexes(): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/danbing';
    console.log('🔗 Connecting to MongoDB...');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the cards collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const collection: Collection = db.collection('cards');

    // List all current indexes
    console.log('\n📋 Current indexes on cards collection:');
    const currentIndexes = await collection.indexes() as IndexInfo[];
    currentIndexes.forEach((index: IndexInfo) => {
      console.log(`  - ${index.name}:`, index.key, index.unique ? '(unique)' : '');
    });

    // Check if the problematic hanzi_1 unique index exists
    const hanziUniqueIndex = currentIndexes.find(
      (idx: IndexInfo) => idx.name === 'hanzi_1' && idx.unique === true
    );

    if (hanziUniqueIndex) {
      console.log('\n⚠️  Found problematic unique index on hanzi field');
      console.log('🔧 Dropping hanzi_1 unique index...');
      
      try {
        await collection.dropIndex('hanzi_1');
        console.log('✅ Successfully dropped hanzi_1 unique index');
      } catch (dropError) {
        console.error('❌ Error dropping index:', (dropError as Error).message);
      }
    } else {
      console.log('\n✅ No problematic unique index on hanzi field found');
    }

    // Ensure the correct indexes exist
    console.log('\n🔧 Ensuring correct indexes exist...');
    
    // Create compound unique index on hanzi + pinyin if it doesn't exist
    const compoundIndex = currentIndexes.find(
      (idx: IndexInfo) => idx.name === 'hanzi_1_pinyin_1' && idx.unique === true
    );
    
    if (!compoundIndex) {
      console.log('📝 Creating compound unique index on hanzi + pinyin...');
      await collection.createIndex(
        { hanzi: 1, pinyin: 1 }, 
        { unique: true }
      );
      console.log('✅ Created compound unique index');
    } else {
      console.log('✅ Compound unique index already exists');
    }

    // Create non-unique index on hanzi for efficient lookups
    const hanziIndex = currentIndexes.find(
      (idx: IndexInfo) => idx.name === 'hanzi_1' && !idx.unique
    );
    
    if (!hanziIndex) {
      console.log('📝 Creating non-unique index on hanzi for lookups...');
      await collection.createIndex({ hanzi: 1 });
      console.log('✅ Created non-unique hanzi index');
    } else {
      console.log('✅ Non-unique hanzi index already exists');
    }

    // List final indexes
    console.log('\n📋 Final indexes on cards collection:');
    const finalIndexes = await collection.indexes() as IndexInfo[];
    finalIndexes.forEach((index: IndexInfo) => {
      console.log(`  - ${index.name}:`, index.key, index.unique ? '(unique)' : '');
    });

    console.log('\n✨ Index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
fixCardIndexes();