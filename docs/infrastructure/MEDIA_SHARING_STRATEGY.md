# Media Sharing Strategy

## Current Issue
Currently, media files (images and audio) are stored using a path structure that includes both deckId and cardId:
- `decks/{deckId}/cards/{cardId}/image.jpg`
- `decks/{deckId}/cards/{cardId}/audio.mp3`

This means that if the same Chinese character (e.g., "你") appears in multiple decks, we generate and store separate media files for each instance.

## Solution
Since Cards are globally unique by their `hanzi` field, we should store media based on the character itself, not the deck-card combination.

### Implementation Changes Made

1. **Updated `generateMediaKeys` function** in `/src/lib/r2-storage.ts`:
   - Changed from `decks/{deckId}/cards/{cardId}/...` to `cards/{cardId}/...`
   - This ensures media is shared across decks for the same card

2. **Added `generateMediaKeysByHanzi` function**:
   - Uses `media/hanzi/{encodedHanzi}/...` path structure
   - Ensures maximum reuse for the same Chinese character across all cards

3. **Created shared media functions** in `/src/lib/enrichment/shared-media.ts`:
   - `generateSharedAudio(hanzi)` - generates audio once per unique character
   - `generateSharedImage(hanzi, meaning, pinyin)` - generates image once per unique character
   - Both functions check R2 storage first before generating new media

### Benefits

1. **Storage Efficiency**: 
   - Each unique Chinese character only needs one audio file and one image
   - Significant reduction in storage costs

2. **API Cost Savings**:
   - Azure TTS API calls reduced by reusing audio
   - OpenAI DALL-E API calls reduced by reusing images

3. **Performance**:
   - Faster enrichment for common characters
   - Better cache hit rates

4. **Consistency**:
   - Same character always has the same pronunciation audio
   - Visual consistency for learning

### Migration Path

For existing deployments:
1. Keep current media files for backward compatibility
2. New enrichments use the card-based path (`cards/{cardId}/...`)
3. Optional: Run migration script to consolidate duplicate media

### Example

If three users each create a deck with the character "你":
- **Before**: 3 audio files + 3 images = 6 media files
- **After**: 1 audio file + 1 image = 2 media files
- **Savings**: 67% reduction in media storage

This is especially impactful for common characters that appear in many decks.