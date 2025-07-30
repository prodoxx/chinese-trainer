# Secure Media Access Implementation

## Security Measures

### 1. Non-Predictable URLs
- **Problem**: Direct hanzi-based URLs like `media/hanzi/你/audio.mp3` are predictable
- **Solution**: SHA256 hash-based paths like `media/shared/a0c7716669b5/audio.mp3`
- **Result**: Attackers cannot enumerate or predict media URLs

### 2. Authentication Required
- **Problem**: Direct R2 URLs could be accessed without authentication
- **Solution**: Media served through authenticated API endpoint `/api/media/[...path]`
- **Result**: Only logged-in users can access media files

### 3. Path Validation
- API endpoint validates that requested paths start with `media/shared/`
- Prevents directory traversal attacks
- Returns 403 for invalid paths

## Implementation Details

### Hash Generation
```typescript
// Each hanzi produces a unique, consistent hash
"你" → SHA256 → "a0c7716669b5..."
"好" → SHA256 → "f867f3417859..."
```

### URL Structure
- **Storage**: `media/shared/{hash}/audio.mp3`
- **Access**: `/api/media/media/shared/{hash}/audio.mp3`
- **Security**: Requires authentication + non-predictable hash

### Benefits
1. **Secure**: Cannot scrape media without authentication
2. **Consistent**: Same character always uses same hash
3. **Efficient**: Media still shared across all users
4. **Cache-friendly**: 1-year cache headers for performance

## How It Works

1. **Generation**:
   - Character "你" generates hash "a0c7716669b5"
   - Media stored at `media/shared/a0c7716669b5/audio.mp3`

2. **Access**:
   - Card stores URL as `/api/media/media/shared/a0c7716669b5/audio.mp3`
   - Browser requests URL → API checks auth → Returns media
   - Unauthorized users get 401 error

3. **Caching**:
   - Browser caches media for 1 year
   - R2 storage checks prevent regeneration
   - Maximum efficiency maintained

## Security Summary
- ✅ Non-predictable URLs (SHA256 hash)
- ✅ Authentication required (NextAuth session)
- ✅ Path validation (prevent traversal)
- ✅ Secure headers (proper content types)
- ✅ Long-term caching (performance)
- ✅ Media sharing maintained (efficiency)