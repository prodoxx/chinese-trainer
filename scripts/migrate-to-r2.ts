#!/usr/bin/env bun
/**
 * Migration script to move existing media from MongoDB GridFS to Cloudflare R2
 * 
 * Usage: bun run scripts/migrate-to-r2.ts [--dry-run] [--deck-id=xxx]
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
import { uploadToR2, existsInR2, generateMediaKeys } from '@/lib/r2-storage';

interface MigrationStats {
  totalCards: number;
  migratedImages: number;
  migratedAudio: number;
  skippedImages: number;
  skippedAudio: number;
  errors: number;
}

async function downloadFromGridFS(
  bucket: mongoose.mongo.GridFSBucket,
  fileId: string
): Promise<Buffer | null> {
  try {
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    const chunks: Uint8Array[] = [];
    
    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => chunks.push(chunk));
      downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
      downloadStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading from GridFS:', error);
    return null;
  }
}

async function migrateCard(
  card: any,
  deckId: string,
  imagesBucket: mongoose.mongo.GridFSBucket,
  audioBucket: mongoose.mongo.GridFSBucket,
  dryRun: boolean
): Promise<{ imageSuccess: boolean; audioSuccess: boolean }> {
  const cardId = card._id.toString();
  const { image: imageKey, audio: audioKey } = generateMediaKeys(deckId, cardId);
  
  let imageSuccess = false;
  let audioSuccess = false;
  
  // Migrate image if it's a GridFS URL
  if (card.imageUrl && card.imageUrl.startsWith('/api/images/')) {
    const imageId = card.imageUrl.split('/').pop();
    
    // Check if already exists in R2
    if (await existsInR2(imageKey)) {
      console.log(`   ✓ Image already in R2: ${card.hanzi}`);
      imageSuccess = true;
    } else if (!dryRun) {
      // Download from GridFS
      const imageBuffer = await downloadFromGridFS(imagesBucket, imageId);
      
      if (imageBuffer) {
        // Upload to R2
        const newUrl = await uploadToR2(imageKey, imageBuffer, {
          contentType: 'image/png',
          metadata: {
            hanzi: card.hanzi,
            migratedFrom: 'gridfs',
            migratedAt: new Date().toISOString(),
          }
        });
        
        // Update card with new URL
        card.imageUrl = newUrl;
        imageSuccess = true;
        console.log(`   ✓ Migrated image: ${card.hanzi}`);
      }
    } else {
      console.log(`   [DRY RUN] Would migrate image: ${card.hanzi}`);
      imageSuccess = true;
    }
  }
  
  // Migrate audio if it's a GridFS URL
  if (card.audioUrl && card.audioUrl.startsWith('/api/audio/')) {
    const audioId = card.audioUrl.split('/').pop();
    
    // Check if already exists in R2
    if (await existsInR2(audioKey)) {
      console.log(`   ✓ Audio already in R2: ${card.hanzi}`);
      audioSuccess = true;
    } else if (!dryRun) {
      // Download from GridFS
      const audioBuffer = await downloadFromGridFS(audioBucket, audioId);
      
      if (audioBuffer) {
        // Upload to R2
        const newUrl = await uploadToR2(audioKey, audioBuffer, {
          contentType: 'audio/mpeg',
          metadata: {
            hanzi: card.hanzi,
            migratedFrom: 'gridfs',
            migratedAt: new Date().toISOString(),
          }
        });
        
        // Update card with new URL
        card.audioUrl = newUrl;
        audioSuccess = true;
        console.log(`   ✓ Migrated audio: ${card.hanzi}`);
      }
    } else {
      console.log(`   [DRY RUN] Would migrate audio: ${card.hanzi}`);
      audioSuccess = true;
    }
  }
  
  // Save card if not dry run and something was migrated
  if (!dryRun && (imageSuccess || audioSuccess)) {
    await card.save();
  }
  
  return { imageSuccess, audioSuccess };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const deckIdArg = args.find(arg => arg.startsWith('--deck-id='));
  const specificDeckId = deckIdArg ? deckIdArg.split('=')[1] : null;
  
  console.log('🚀 Cloudflare R2 Migration Script');
  console.log('=================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  if (specificDeckId) {
    console.log(`Deck: ${specificDeckId}`);
  } else {
    console.log('Deck: ALL DECKS');
  }
  console.log('');
  
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const imagesBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
    const audioBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'audio' });
    
    const stats: MigrationStats = {
      totalCards: 0,
      migratedImages: 0,
      migratedAudio: 0,
      skippedImages: 0,
      skippedAudio: 0,
      errors: 0,
    };
    
    // Find all deck cards
    const deckCardQuery = specificDeckId ? { deckId: specificDeckId } : {};
    const deckCards = await DeckCard.find(deckCardQuery).populate('cardId');
    
    console.log(`Found ${deckCards.length} cards to process\n`);
    
    // Group by deck for better organization
    const cardsByDeck = new Map<string, any[]>();
    for (const dc of deckCards) {
      if (!dc.cardId) continue;
      
      const deckId = dc.deckId.toString();
      if (!cardsByDeck.has(deckId)) {
        cardsByDeck.set(deckId, []);
      }
      cardsByDeck.get(deckId)!.push(dc.cardId);
    }
    
    // Process each deck
    for (const [deckId, cards] of cardsByDeck) {
      console.log(`\n📁 Processing deck: ${deckId}`);
      console.log(`   Cards: ${cards.length}`);
      
      for (const card of cards) {
        stats.totalCards++;
        
        try {
          const { imageSuccess, audioSuccess } = await migrateCard(
            card,
            deckId,
            imagesBucket,
            audioBucket,
            dryRun
          );
          
          if (imageSuccess) {
            if (card.imageUrl && card.imageUrl.startsWith('/api/images/')) {
              stats.migratedImages++;
            } else {
              stats.skippedImages++;
            }
          }
          
          if (audioSuccess) {
            if (card.audioUrl && card.audioUrl.startsWith('/api/audio/')) {
              stats.migratedAudio++;
            } else {
              stats.skippedAudio++;
            }
          }
        } catch (error) {
          console.error(`   ❌ Error migrating ${card.hanzi}:`, error);
          stats.errors++;
        }
      }
    }
    
    // Print summary
    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`Total cards processed: ${stats.totalCards}`);
    console.log(`Images migrated: ${stats.migratedImages}`);
    console.log(`Images skipped: ${stats.skippedImages}`);
    console.log(`Audio migrated: ${stats.migratedAudio}`);
    console.log(`Audio skipped: ${stats.skippedAudio}`);
    console.log(`Errors: ${stats.errors}`);
    
    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no actual changes were made');
      console.log('Run without --dry-run to perform the migration');
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the migration
main().catch(console.error);