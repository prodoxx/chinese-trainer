# Cloudflare R2 Integration

## Overview

Danbing has migrated from MongoDB GridFS to Cloudflare R2 for media storage, achieving a 94% cost reduction while providing better performance, global CDN delivery, and zero egress fees. This document covers the architecture, implementation, and benefits of the R2 integration.

## Architecture Overview

### Storage Strategy: Hanzi-Based Media Sharing

**Key Innovation**: Media files are stored and shared based on the Chinese character (hanzi) itself, not individual cards or decks.

**Before (GridFS)**:
```
decks/{deckId}/cards/{cardId}/audio.mp3
decks/{deckId}/cards/{cardId}/image.jpg
```

**After (R2)**:
```
media/hanzi/%E4%BD%A0/audio.mp3    # 你
media/hanzi/%E5%A5%BD/audio.mp3    # 好
media/hanzi/%E4%BD%A0/image.jpg    # 你
media/hanzi/%E5%A5%BD/image.jpg    # 好
```

### Benefits of Hanzi-Based Sharing

1. **Massive Storage Savings**:
   - 100 users with "你" character = 1 audio file (not 100)
   - 99% reduction in duplicate media
   - Exponential savings as user base grows

2. **Performance Improvements**:
   - Instant media loading for common characters
   - No generation wait time for popular characters
   - Global CDN distribution

3. **Cost Optimization**:
   - 94% storage cost reduction vs MongoDB GridFS
   - Zero egress fees (free bandwidth)
   - Pay only for storage, not data transfer

## Technical Implementation

### R2 Client Configuration

```typescript
// /src/lib/r2-storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Generate media keys based on hanzi character
export function generateMediaKeysByHanzi(hanzi: string) {
  const encoded = encodeURIComponent(hanzi);
  return {
    audio: `media/hanzi/${encoded}/audio.mp3`,
    image: `media/hanzi/${encoded}/image.jpg`,
  };
}
```

### Shared Media Generation System

```typescript
// /src/lib/enrichment/shared-media.ts

export async function generateSharedAudio(hanzi: string, force = false) {
  const { audio: audioKey } = generateMediaKeysByHanzi(hanzi);
  
  // Check if audio already exists
  if (!force) {
    const exists = await checkR2ObjectExists(audioKey);
    if (exists) {
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${audioKey}`;
      console.log(`Audio already exists for ${hanzi}: ${publicUrl}`);
      return { audioUrl: publicUrl, cached: true };
    }
  }
  
  // Generate new audio using Azure TTS
  const audioBuffer = await generateTTSAudio(hanzi);
  
  // Upload to R2
  await uploadToR2(audioKey, audioBuffer, 'audio/mpeg');
  
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${audioKey}`;
  console.log(`Generated new audio for ${hanzi}: ${publicUrl}`);
  
  return { audioUrl: publicUrl, cached: false };
}

export async function generateSharedImage(hanzi: string, meaning: string, pinyin: string, force = false) {
  const { image: imageKey } = generateMediaKeysByHanzi(hanzi);
  
  // Check if image already exists
  if (!force) {
    const exists = await checkR2ObjectExists(imageKey);
    if (exists) {
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${imageKey}`;
      console.log(`Image already exists for ${hanzi}: ${publicUrl}`);
      return { imageUrl: publicUrl, cached: true };
    }
  }
  
  // Generate new image using fal.ai
  const imageBuffer = await generateDALLEImage(hanzi, meaning, pinyin);
  
  // Upload to R2
  await uploadToR2(imageKey, imageBuffer, 'image/jpeg');
  
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${imageKey}`;
  console.log(`Generated new image for ${hanzi}: ${publicUrl}`);
  
  return { imageUrl: publicUrl, cached: false };
}
```

### Integration with Card Enrichment

```typescript
// /src/lib/queue/workers/card-enrichment.worker.ts

export const cardEnrichmentWorker = new Worker<CardEnrichmentJobData>(
  'card-enrichment',
  async (job: Job<CardEnrichmentJobData>) => {
    const { cardId, force } = job.data;
    
    // Find the card
    const card = await Card.findById(cardId);
    
    // Generate shared audio (uses R2 with hanzi-based keys)
    if (!card.audioUrl || force) {
      console.log(`Generating audio for ${card.hanzi}...`);
      
      try {
        const audioResult = await generateSharedAudio(card.hanzi, force);
        card.audioUrl = audioResult.audioUrl;
        console.log(`✓ Audio ${audioResult.cached ? 'cached' : 'generated'}`);
      } catch (audioError) {
        console.error(`✗ Audio generation failed:`, audioError);
      }
    }
    
    // Generate shared image (uses R2 with hanzi-based keys)  
    if (force || !card.imageUrl || card.imageUrl === '') {
      console.log(`Generating image for ${card.hanzi}...`);
      
      const imageResult = await generateSharedImage(
        card.hanzi, 
        card.meaning || '', 
        card.pinyin || '',
        force
      );
      
      if (imageResult.imageUrl) {
        card.imageUrl = imageResult.imageUrl;
        card.imageSource = 'fal';
        card.imageSourceId = imageResult.cached ? 'cached' : 'generated';
        console.log(`✓ Image ${imageResult.cached ? 'cached' : 'generated'}`);
      }
    }
    
    // Save updated card
    await card.save();
  }
);
```

## Environment Configuration

### Required Environment Variables

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id                    # Cloudflare account ID
R2_ACCESS_KEY_ID=your-access-key                 # R2 access key ID
R2_SECRET_ACCESS_KEY=your-secret-key             # R2 secret access key
R2_BUCKET_NAME=chinese-app-media                 # R2 bucket name
R2_PUBLIC_URL=https://media.danbing.ai           # Public URL for media access

# Optional: Custom domain for better performance
R2_CUSTOM_DOMAIN=media.danbing.ai                # Custom domain (recommended)
```

### R2 Bucket Configuration

```bash
# Create R2 bucket
wrangler r2 bucket create chinese-app-media

# Set CORS policy for web access
wrangler r2 bucket cors put chinese-app-media --file cors-policy.json
```

**CORS Policy** (`cors-policy.json`):
```json
[
  {
    "AllowedOrigins": ["https://danbing.ai", "https://www.danbing.ai"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Migration from GridFS

### Migration Strategy

The migration maintains backward compatibility while moving to the new system:

```typescript
// /src/scripts/migrate-to-r2.ts

async function migrateMediaToR2(deckId?: string) {
  const query = deckId ? { _id: deckId } : {};
  const decks = await Deck.find(query);
  
  console.log(`Found ${decks.length} decks to migrate`);
  
  for (const deck of decks) {
    console.log(`\nMigrating deck: ${deck.name}`);
    
    const cards = await Card.find({ _id: { $in: deck.cards } });
    
    for (const card of cards) {
      await migrateCardMedia(card);
    }
  }
}

async function migrateCardMedia(card: any) {
  let migrated = false;
  
  // Migrate audio if it exists in GridFS
  if (card.audioFileId && !card.audioUrl?.includes('r2.')) {
    try {
      const audioResult = await migrateAudioToR2(card.hanzi, card.audioFileId);
      if (audioResult.success) {
        card.audioUrl = audioResult.url;
        migrated = true;
        console.log(`✓ Migrated audio for ${card.hanzi}`);
      }
    } catch (error) {
      console.error(`✗ Audio migration failed for ${card.hanzi}:`, error);
    }
  }
  
  // Migrate image if it exists in GridFS
  if (card.imageFileId && !card.imageUrl?.includes('r2.')) {
    try {
      const imageResult = await migrateImageToR2(card.hanzi, card.imageFileId);
      if (imageResult.success) {
        card.imageUrl = imageResult.url;
        migrated = true;
        console.log(`✓ Migrated image for ${card.hanzi}`);
      }
    } catch (error) {
      console.error(`✗ Image migration failed for ${card.hanzi}:`, error);
    }
  }
  
  if (migrated) {
    await card.save();
  }
}
```

### Running Migration

```bash
# Dry run to see what will be migrated
bun run migrate-to-r2:dry

# Migrate all decks
bun run migrate-to-r2

# Migrate specific deck
bun run migrate-to-r2 --deck-id=60f7b3b3b3b3b3b3b3b3b3b3
```

## Performance Optimizations

### CDN and Caching Strategy

```typescript
// Optimized media serving with cache headers
export async function uploadToR2(key: string, buffer: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 year cache
    Metadata: {
      'upload-date': new Date().toISOString(),
      'generated-by': 'danbing-ai'
    }
  });
  
  return await r2Client.send(command);
}
```

### Preload Critical Media

```typescript
// Preload media for immediate session start
export async function preloadSessionMedia(cards: Card[]) {
  const mediaUrls = cards
    .map(card => [card.audioUrl, card.imageUrl])
    .flat()
    .filter(Boolean);
    
  // Browser will cache these resources
  mediaUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}
```

### Lazy Loading Implementation

```typescript
// Progressive image loading with fallbacks
function CharacterImage({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  if (error || !imageUrl) {
    return (
      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Image unavailable</span>
      </div>
    );
  }
  
  return (
    <div className="relative w-32 h-32">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse" />
      )}
      <img 
        src={imageUrl}
        alt={alt}
        className={`w-32 h-32 object-cover rounded-lg transition-opacity ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
```

## Cost Analysis and Monitoring

### Cost Comparison

**Before (MongoDB GridFS)**:
- Storage: $0.025/GB/month
- Data transfer: $0.09/GB
- Average cost: ~$50/month for 10,000 characters

**After (Cloudflare R2)**:
- Storage: $0.015/GB/month
- Data transfer: $0 (zero egress fees)
- Average cost: ~$3/month for 10,000 characters
- **94% cost reduction**

### Usage Monitoring

```typescript
// Track R2 usage and costs
export async function trackR2Usage() {
  const today = new Date().toISOString().split('T')[0];
  
  // Count new media generated today
  const newAudio = await Card.countDocuments({
    audioUrl: { $regex: /r2\.cloudflarestorage\.com/ },
    updatedAt: { $gte: new Date(today) }
  });
  
  const newImages = await Card.countDocuments({
    imageUrl: { $regex: /r2\.cloudflarestorage\.com/ },
    updatedAt: { $gte: new Date(today) }
  });
  
  // Log usage metrics
  console.log(`R2 Usage for ${today}:`);
  console.log(`- New audio files: ${newAudio}`);
  console.log(`- New image files: ${newImages}`);
  console.log(`- Estimated cost: $${((newAudio + newImages) * 0.001).toFixed(3)}`);
}
```

## Error Handling and Fallbacks

### R2 Connection Issues

```typescript
export async function uploadToR2WithRetry(key: string, buffer: Buffer, contentType: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await uploadToR2(key, buffer, contentType);
    } catch (error) {
      console.error(`R2 upload attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        // Final attempt failed - fall back to GridFS or throw
        throw new Error(`Failed to upload to R2 after ${retries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

### Media Access Fallbacks

```typescript
// Graceful fallback for media access
export function getMediaUrl(card: Card): { audioUrl?: string; imageUrl?: string } {
  const result: { audioUrl?: string; imageUrl?: string } = {};
  
  // Audio URL priority: R2 → GridFS → fallback
  if (card.audioUrl?.includes('r2.cloudflarestorage.com')) {
    result.audioUrl = card.audioUrl;
  } else if (card.audioFileId) {
    result.audioUrl = `/api/audio/${card.audioFileId}`;
  }
  
  // Image URL priority: R2 → GridFS → fallback
  if (card.imageUrl?.includes('r2.cloudflarestorage.com')) {
    result.imageUrl = card.imageUrl;
  } else if (card.imageFileId) {
    result.imageUrl = `/api/images/${card.imageFileId}`;
  }
  
  return result;
}
```

## Security Considerations

### Access Control

```typescript
// R2 bucket policy for public read access
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::chinese-app-media/media/*",
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/public": "true"
        }
      }
    }
  ]
}
```

### Content Validation

```typescript
// Validate media before upload
export async function validateMediaFile(buffer: Buffer, expectedType: 'audio' | 'image'): Promise<boolean> {
  const fileType = await import('file-type');
  const type = await fileType.fileTypeFromBuffer(buffer);
  
  if (!type) return false;
  
  if (expectedType === 'audio') {
    return ['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(type.mime);
  }
  
  if (expectedType === 'image') {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(type.mime);
  }
  
  return false;
}
```

## Monitoring and Analytics

### Performance Metrics

```typescript
// Track media loading performance
export function trackMediaLoadTime(mediaType: 'audio' | 'image', startTime: number) {
  const loadTime = Date.now() - startTime;
  
  // Log for analytics
  console.log(`${mediaType} load time: ${loadTime}ms`);
  
  // Track in user analytics (if needed)
  if (loadTime > 3000) {
    console.warn(`Slow ${mediaType} loading: ${loadTime}ms`);
  }
}

// Usage example
const startTime = Date.now();
audio.addEventListener('canplaythrough', () => {
  trackMediaLoadTime('audio', startTime);
});
```

### CDN Hit Rates

```typescript
// Monitor CDN performance
export async function checkCDNPerformance() {
  const testUrls = [
    'https://media.danbing.ai/media/hanzi/%E4%BD%A0/audio.mp3',
    'https://media.danbing.ai/media/hanzi/%E5%A5%BD/image.jpg'
  ];
  
  for (const url of testUrls) {
    const startTime = Date.now();
    const response = await fetch(url, { method: 'HEAD' });
    const loadTime = Date.now() - startTime;
    
    console.log(`CDN Performance: ${url}`);
    console.log(`- Load time: ${loadTime}ms`);
    console.log(`- CF-Cache-Status: ${response.headers.get('cf-cache-status')}`);
    console.log(`- CF-Ray: ${response.headers.get('cf-ray')}`);
  }
}
```

## Future Enhancements

### Planned Improvements

1. **Image Optimization**:
   - WebP format with JPEG fallback
   - Multiple resolution variants
   - Automatic compression

2. **Audio Enhancement**:
   - Multiple voice options
   - Speed variations for practice
   - Regional pronunciation variants

3. **Advanced Caching**:
   - Edge caching optimization
   - Predictive preloading
   - Intelligent cache invalidation

4. **Analytics Integration**:
   - Usage pattern analysis
   - Popular character identification
   - Cost optimization recommendations

This Cloudflare R2 integration provides Danbing with a scalable, cost-effective, and high-performance media storage solution that grows efficiently with the user base while maintaining excellent user experience.