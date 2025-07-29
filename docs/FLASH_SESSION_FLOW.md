# Flash Session Flow Documentation

## Overview
The flash session is a scientifically-designed learning system based on cognitive psychology research. It uses dual-phase presentation with temporal spacing to optimize memory encoding and retention.

## Session Structure

### 1. Session Initialization
- **Countdown**: 3-2-1 countdown before session starts
  - Fast: 500ms per number
  - Medium: 750ms per number
  - Slow: 1000ms per number
- **Session Size**: 
  - New mode: Limited to 7 cards (optimal working memory capacity)
  - Review mode: Limited to 7 cards for optimal learning
  - Practice mode: All previously studied cards

### 2. Flash Presentation
The session uses a simplified two-phase approach for each card:

#### Phase 1: Hanzi Only
- **Purpose**: Initial visual encoding
- **Content**: Character displayed alone
- **Duration**: 
  - Fast: 2 seconds
  - Medium: 3 seconds
  - Slow: 4 seconds
- **Followed by**: Blank screen (200-500ms depending on speed)

#### Phase 2: Full Information
- **Purpose**: Multi-modal encoding with all associations
- **Content**: Character + pinyin + image + meaning
- **Audio**: Plays at the start of this phase
- **Duration**:
  - Fast: 3 seconds
  - Medium: 4 seconds
  - Slow: 5 seconds
- **Followed by**: Blank screen (200-500ms depending on speed)

## Speed Presets

```javascript
// Fast preset
{
  initialCountdown: 500,     // Per number in countdown
  hanziPhase: 2000,         // Character alone
  blankAfterHanzi: 200,     // Blank after character
  fullPhase: 3000,          // All information + audio
  blankAfterFull: 200       // Blank after full info
}

// Medium preset (default)
{
  initialCountdown: 750,
  hanziPhase: 3000,
  blankAfterHanzi: 300,
  fullPhase: 4000,
  blankAfterFull: 300
}

// Slow preset
{
  initialCountdown: 1000,
  hanziPhase: 4000,
  blankAfterHanzi: 500,
  fullPhase: 5000,
  blankAfterFull: 500
}
```

## Quiz Phase

After all cards have been presented:
1. **Immediate quiz**: Tests retention of studied cards
2. **Question types**: Cycles through Meaning→Character, Audio→Character, Character→Image
3. **Time limit**: 10 seconds per question
4. **Feedback**: Immediate visual and audio feedback
5. **Auto-advance**: 2 seconds after answer (immediate on timeout)
6. **Scoring**: Updates spaced repetition algorithm

## Session Flow Diagram

```
START
  ↓
[3-2-1 Countdown]
  ↓
FLASH PHASE (all cards)
  ├─ Card 1: Hanzi → Blank → Full Info → Blank
  ├─ Card 2: Hanzi → Blank → Full Info → Blank
  ├─ Card 3: Hanzi → Blank → Full Info → Blank
  └─ ... (up to 7 cards for new/review)
  ↓
QUIZ PHASE
  ├─ Question 1: Meaning → Character
  ├─ Question 2: Audio → Character
  ├─ Question 3: Character → Image
  └─ ... (cycles through types)
  ↓
SESSION COMPLETE
```

## Mode Variations

### New Mode
- Limited to 7 cards per session
- Cards must have audio before being presented
- Prompts user after 7 cards to continue or stop
- Focuses on initial encoding

### Review Mode
- Limited to 7 cards per session (highest priority cards)
- Cards sorted by: overdue days, then memory strength
- Updates spaced repetition intervals
- Reinforces previously learned material

### Practice Mode
- Includes all previously studied cards
- No session size limit
- Good for exam preparation
- Does not affect spaced repetition scheduling

## Cognitive Principles

1. **Dual-Phase Presentation**: Separates visual recognition from semantic processing
2. **Temporal Spacing**: Blanks between phases allow consolidation
3. **Multi-modal Encoding**: Visual + auditory + semantic creates multiple memory pathways
4. **Active Retrieval**: Quiz phase strengthens memory through testing effect
5. **Limited Session Size**: 7±2 cards respect working memory capacity
6. **Immediate Feedback**: Reinforces correct associations

## User Controls

- **Q/ESC**: Exit session (with confirmation)
- **P**: Pause/Resume during flash phase
- **R**: Restart session (with confirmation)
- **1-4**: Answer quiz questions
- **Space**: Continue after timeout in quiz

## Session Metrics

The system tracks:
- Total cards studied
- Time elapsed (excluding pauses)
- Quiz accuracy and response times
- Cards marked for review
- Session completion status

## Features

### Pause System
- Accurate time tracking with pause/resume
- Audio does not play while paused
- Visual indicator shows paused state
- Timer resumes exactly where it left off

### Progress Indicators
- Real-time card counter (e.g., "Studied: 3/7")
- Mode indicator (New Cards, Review Session, Practice Mode)
- Visual countdown between phases

### Custom Dialogs
- All confirmations use custom AlertDialog component
- Session automatically pauses during dialogs
- Consistent UI experience (no browser alerts)

## Future Enhancements

1. **Adaptive Timing**: Adjust speed based on quiz performance
2. **Personalized Intervals**: Learn optimal timing for each user
3. **Difficulty-Based Timing**: Slower presentation for complex characters
4. **Session Analytics**: Track optimal session length for retention
5. **Gesture Controls**: Swipe gestures for mobile version

## Research References

The current design is based on:
- Working memory capacity research (Miller, 1956: 7±2 items)
- Dual-coding theory (Paivio, 1969)
- Testing effect research (Roediger & Karpicke, 2006)
- Multimedia learning principles (Mayer, 2001)
- Spaced repetition algorithms (SM-2 by Wozniak, 1987)