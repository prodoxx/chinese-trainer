# Shared Media Implementation - Final

## Overview
Media files (audio and images) are now shared across all users and decks based on the Chinese character (hanzi) itself, not the card or deck.

## Key Changes Made

### 1. Media Storage Keys
- **Before**: `decks/{deckId}/cards/{cardId}/audio.mp3`
- **After**: `media/hanzi/{encodedHanzi}/audio.mp3`

Example:
- Character "你" → `media/hanzi/%E4%BD%A0/audio.mp3`
- Character "好" → `media/hanzi/%E5%A5%BD/audio.mp3`

### 2. Updated Files

#### `/src/lib/r2-storage.ts`
- Added `generateMediaKeysByHanzi()` function that creates keys based on the Chinese character

#### `/src/lib/enrichment/shared-media.ts` (NEW)
- `generateSharedAudio(hanzi)` - Generates audio once per unique character
- `generateSharedImage(hanzi, meaning, pinyin)` - Generates image once per unique character
- Both check R2 first before generating new media

#### `/src/lib/queue/workers/deck-enrichment-r2.worker.ts`
- Updated to use `generateSharedAudio()` instead of `generateTTSAudioR2()`
- Updated to use `generateSharedImage()` instead of `generateDALLEImageR2()`

### 3. How It Works

1. **Card Creation** (unchanged):
   - Cards are unique by `hanzi` field
   - Same character always uses the same card record

2. **Media Generation**:
   - Media keys are based on the hanzi character itself
   - Before generating, checks if media already exists in R2
   - If exists, returns the URL immediately (cache hit)
   - If not, generates and stores for future use

3. **Result**:
   - Character "你" generates media ONCE across entire system
   - All users, all decks with "你" share the same audio/image files
   - Maximum efficiency, minimum storage and API costs

## Benefits

### Storage Efficiency
- **Before**: 100 users with "你" = 100 audio files + 100 images
- **After**: 100 users with "你" = 1 audio file + 1 image
- **Savings**: 99% reduction

### API Cost Savings
- Azure TTS: Called once per unique character
- OpenAI DALL-E: Called once per unique character
- Dramatic reduction in API costs

### Performance
- Instant load for common characters
- No waiting for enrichment on popular characters
- Better user experience

## Example Flow

1. **User A** imports "你好":
   - Creates/finds cards for "你" and "好"
   - Generates `media/hanzi/%E4%BD%A0/audio.mp3` (new)
   - Generates `media/hanzi/%E5%A5%BD/audio.mp3` (new)

2. **User B** imports "你好世界":
   - Finds existing cards "你" and "好"
   - Audio for "你" and "好" already exist - instant!
   - Only generates media for "世" and "界"

3. **User C** imports "你":
   - Everything already exists - instant enrichment!

## Migration
- New enrichments automatically use hanzi-based keys
- Old deck-based media remains for backward compatibility
- No action required from users