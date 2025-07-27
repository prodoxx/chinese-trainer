# Flash Session Timing Reference

## Quick Reference Table

| Phase | Block 1 (Segmented) | Block 2 (Rapid) | Block 3 (Flash) |
|-------|-------------------|----------------|----------------|
| **Purpose** | Initial encoding | Strengthen connections | Rapid retrieval |
| **Cards per block** | 4-6 cards | 4-6 cards | Remaining cards |
| **Total time/card** | ~7.1 seconds | ~2.2 seconds | 1 second |

## Detailed Timing Breakdown

### Block 1: Segmented Presentation
```
Card 1 Start
├─ [800ms]  Orthographic (字) - Character alone
├─ [200ms]  Blank screen
├─ [2000ms] Phonological (字 + "zì" + 🔊) - With audio
├─ [300ms]  Blank screen  
├─ [2000ms] Semantic (📷 + "character/word") - Image + meaning
├─ [500ms]  Blank screen
├─ [1500ms] Retrieval (字) - Character alone for recall
└─ [300ms]  Gap before next card
= 7100ms total per card
```

### Block 2: Rapid Alternation
```
Card 1 Start
├─ [300ms]  Orthographic (字)
├─ [700ms]  Phonological (字 + "zì" + 🔊)
├─ [300ms]  Orthographic (字)
├─ [700ms]  Phonological (字 + "zì" + 🔊)
└─ [200ms]  Gap before next card
= 2200ms total per card
```

### Block 3: Flash Card Style
```
Card 1 Start
├─ [800ms]  All info (字 + "zì" + 📷 + "character/word")
└─ [200ms]  Gap before next card
= 1000ms total per card
```

### Transition Sequences

#### Inter-block Flash (3x)
```
Flash 1: [100ms BLACK] → [100ms WHITE]
Flash 2: [100ms BLACK] → [100ms WHITE]  
Flash 3: [100ms BLACK] → [100ms WHITE]
Total: 600ms
```

#### Countdown Between Blocks
```
[6000ms] Countdown from 6 to 1
```

## Complete Session Timeline Example

For a 15-card session:
```
[6s]     Initial countdown
[35.5s]  Block 1: 5 cards × 7.1s
[Quiz]   Variable duration
[0.6s]   Flash transition
[6s]     Countdown
[11s]    Block 2: 5 cards × 2.2s  
[Quiz]   Variable duration
[0.6s]   Flash transition
[6s]     Countdown
[5s]     Block 3: 5 cards × 1s
[Quiz]   Variable duration
---------------------------------
~71s + quiz time (typically ~90-120s total)
```

## Code Location

All timing constants are defined in:
`src/components/FlashSession.tsx` (lines 64-72)

```typescript
// Timing constants - slower for better learning
const ORTHOGRAPHIC_TIME = 800;    // Show character alone
const ORTHOGRAPHIC_BLANK = 200;   // Blank after orthographic
const PHONOLOGICAL_TIME = 2000;   // Character + pinyin + audio
const PHONOLOGICAL_BLANK = 300;   // Blank after phonological  
const SEMANTIC_TIME = 2000;       // Image + meaning
const SEMANTIC_BLANK = 500;       // Blank after semantic
const RETRIEVAL_TIME = 1500;      // Character alone for retrieval
const BETWEEN_CARDS = 300;        // Gap between cards
```

## Modifying Timings

### To make sessions faster:
- Reduce `PHONOLOGICAL_TIME` to 1500ms
- Reduce `SEMANTIC_TIME` to 1500ms
- Reduce `RETRIEVAL_TIME` to 1000ms
- Reduce blanks by 50%

### To make sessions slower (for beginners):
- Increase `ORTHOGRAPHIC_TIME` to 1000ms
- Increase `PHONOLOGICAL_TIME` to 2500ms
- Increase all blanks by 50%

### To adjust flash intensity:
- Modify flash count in `setTransitionFlashCount(3)`
- Adjust flash duration (currently 100ms each)

## Audio Synchronization

Audio playback is triggered during:
- Block 1: Start of phonological phase
- Block 2: Start of each phonological phase
- Block 3: Not played (too fast)

## Performance Considerations

- **Minimum timing**: Don't go below 200ms for any phase (except blanks)
- **Audio cutoff**: Audio may be cut off if phase < 500ms
- **Cognitive load**: Total time per card shouldn't exceed 10s
- **Habituation**: Very fast timings (< 100ms) may cause habituation

## Experimental Variations

### "Subliminal" Mode (not implemented)
```
Orthographic: 50ms
Blank: 50ms
Result: Below conscious threshold
```

### "Meditation" Mode (not implemented)
```
All phases: 3000ms
All blanks: 1000ms
Result: Slow, mindful learning
```

### "Competition" Mode (not implemented)
```
All phases: 50% of current
No blanks
Result: High-speed challenge

```

## A/B Testing Opportunities

1. **Blank duration impact**: Test 0ms vs 200ms vs 500ms blanks
2. **Phase order**: Test semantic-first vs phonological-first
3. **Retrieval phase**: Test with/without retrieval phase
4. **Block 2 variations**: Test 2-cycle vs 3-cycle alternation
5. **Audio timing**: Test audio at start vs middle of phase

## Metrics to Track

When modifying timings, monitor:
- Quiz accuracy per block
- Session completion rate
- Time to fatigue (pause frequency)
- Long-term retention (24h, 1 week)
- User preference ratings