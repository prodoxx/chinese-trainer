# Flash Session Flow Documentation

## Overview
The flash session is a scientifically-designed learning system based on cognitive psychology research. It uses segmented presentation, temporal spacing, and rapid serial visual presentation (RSVP) to optimize memory encoding and retention.

## Session Structure

### 1. Session Initialization
- **Countdown**: 6-second initial countdown before session starts
- **Session Size**: 
  - New mode: Limited to 7 cards (optimal working memory capacity)
  - Review/Practice modes: All due cards

### 2. Block System
Each session is divided into 3 blocks with different presentation strategies:

#### Block 1: Full Segmented Approach
- **Purpose**: Initial encoding with multi-modal processing
- **Phases per card**:
  1. **Orthographic** (800ms): Character alone
  2. **Blank** (200ms): Processing gap
  3. **Phonological** (2000ms): Character + pinyin + audio
  4. **Blank** (300ms): Processing gap
  5. **Semantic** (2000ms): Image + meaning
  6. **Blank** (500ms): Processing gap
  7. **Retrieval** (1500ms): Character alone for retrieval check
  8. **Between cards** (300ms): Gap before next card

**Total time per card**: ~7.1 seconds

#### Block 2: Rapid Alternation
- **Purpose**: Strengthen visual-phonological connections
- **Pattern**: Alternates between orthographic and phonological
- **Timing**:
  - Orthographic: 300ms
  - Phonological: 700ms (with audio)
  - No blanks between phases
  - 200ms between cards

**Total time per card**: ~2.2 seconds (2 cycles)

#### Block 3: Flash Card Style
- **Purpose**: Rapid retrieval practice
- **Single phase per card**: 800ms showing all information
- **Between cards**: 200ms gap

**Total time per card**: 1 second

### 3. Transition Flashes
Between blocks, there's a dramatic transition sequence:
- **Black screen flash**: 3 times
- **Pattern**: Black (100ms) → White (100ms) → repeat
- **Purpose**: Clear visual buffer and signal transition

### 4. Inter-Block Countdown
- **Duration**: 6 seconds
- **Purpose**: Mental preparation for next block's different timing

## Timing Constants

```javascript
// Block 1 - Segmented (slower for encoding)
ORTHOGRAPHIC_TIME = 800ms    // Character alone
ORTHOGRAPHIC_BLANK = 200ms   // Blank after orthographic
PHONOLOGICAL_TIME = 2000ms   // Character + pinyin + audio
PHONOLOGICAL_BLANK = 300ms   // Blank after phonological
SEMANTIC_TIME = 2000ms       // Image + meaning
SEMANTIC_BLANK = 500ms       // Blank after semantic
RETRIEVAL_TIME = 1500ms      // Character for retrieval
BETWEEN_CARDS = 300ms        // Gap between cards

// Block 2 - Rapid Alternation
RAPID_ORTHO = 300ms         // Quick character flash
RAPID_PHONO = 700ms         // Quick phonological
RAPID_GAP = 200ms           // Between cards

// Block 3 - Flash Card
FLASH_TIME = 800ms          // All information
FLASH_GAP = 200ms           // Between cards

// Transitions
FLASH_DURATION = 100ms      // Each flash (black/white)
COUNTDOWN_DURATION = 6s     // Between blocks
```

## Quiz Phase

After each block of cards:
1. **Immediate quiz**: Tests retention of just-studied cards
2. **Feedback**: Visual feedback for correct/incorrect
3. **Scoring**: Tracks accuracy for spaced repetition algorithm

## Session Flow Diagram

```
START
  ↓
[6s Countdown]
  ↓
BLOCK 1 (4-6 cards)
  ├─ Card 1: Ortho → Blank → Phono → Blank → Semantic → Blank → Retrieval
  ├─ Card 2: (same pattern)
  └─ ...
  ↓
[Quiz Block 1]
  ↓
[3x Flash Transition]
  ↓
[6s Countdown]
  ↓
BLOCK 2 (4-6 cards)
  ├─ Card 1: Ortho → Phono → Ortho → Phono
  ├─ Card 2: (same pattern)
  └─ ...
  ↓
[Quiz Block 2]
  ↓
[3x Flash Transition]
  ↓
[6s Countdown]
  ↓
BLOCK 3 (remaining cards)
  ├─ Card 1: Full flash (800ms)
  ├─ Card 2: Full flash (800ms)
  └─ ...
  ↓
[Quiz Block 3]
  ↓
SESSION COMPLETE
```

## Practice Mode Variations

### Quick Mode
- Only uses Block 3 (flash card style)
- Faster completion
- Good for review of well-known material

### Focused Mode
- Only includes cards with <70% accuracy
- Uses all 3 blocks for thorough practice
- Targets problem areas

### Full Mode
- All previously studied cards
- Complete 3-block sequence
- Comprehensive review

## Cognitive Principles

1. **Segmented Presentation**: Prevents cognitive overload by presenting information in chunks
2. **Temporal Spacing**: Blanks between phases allow processing time
3. **Multi-modal Encoding**: Visual + auditory + semantic creates multiple memory pathways
4. **Active Retrieval**: Retrieval phase and quizzes strengthen memory
5. **Varied Repetition**: Different presentation styles prevent habituation
6. **Dramatic Transitions**: Flash sequences help clear working memory between blocks

## User Controls

- **ESC**: Exit session
- **P**: Pause/Resume during flash phase
- **Space**: Continue when prompted between rounds

## Session Metrics

The system tracks:
- Total cards studied
- Time elapsed (excluding pauses)
- Quiz accuracy per block
- Overall session accuracy
- Cards per minute rate

## Optimization Opportunities

1. **Timing Adjustments**: Current timings could be personalized based on user performance
2. **Adaptive Blocks**: Block size could adjust based on accuracy
3. **Custom Flash Patterns**: Different patterns for different character types
4. **Biometric Integration**: Could adjust timing based on pupil dilation or EEG data
5. **Spacing Algorithms**: Inter-session spacing could be optimized further

## Research References

The timing and structure are based on:
- Working memory capacity research (Miller, 1956: 7±2 items)
- Dual-coding theory (Paivio, 1969)
- Spacing effect research (Ebbinghaus, 1885)
- RSVP studies for rapid learning (Potter, 1975)
- Multimedia learning principles (Mayer, 2001)