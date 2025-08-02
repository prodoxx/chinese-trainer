# Flash Session Flow Documentation

## Overview
The flash session is a scientifically-designed learning system based on cognitive psychology research. It uses dual-phase presentation with temporal spacing to optimize memory encoding and retention.

## Session Structure

### 1. Session Initialization
- **Interactive Demo**: New users experience guided tour with typing effects and ASCII diagrams (user preference)
- **Countdown**: 3-2-1 countdown before session starts
  - Fast: 500ms per number
  - Medium: 750ms per number
  - Slow: 1000ms per number
- **Optimized Session Size**: 
  - New mode: Limited to 8 characters (optimized for modern attention spans)
  - Review mode: Limited to 8 cards for optimal learning and engagement
  - Practice mode: All previously studied cards with mini-quiz intervals

### 2. Flash Presentation
The session uses a dual-phase approach for each card with mini-quiz intervals:

#### Phase 1: Visual Recognition
- **Purpose**: Initial visual encoding without distractions
- **Content**: Character displayed alone (hanzi only)
- **Duration**: 
  - Fast: 2 seconds
  - Medium: 3 seconds
  - Slow: 4 seconds
- **Followed by**: Blank screen (200-500ms depending on speed)

#### Phase 2: Multi-Modal Integration  
- **Purpose**: Multi-modal encoding with all associations
- **Content**: Character + pinyin (yellow color) + image + meaning
- **Audio**: Taiwan Mandarin pronunciation plays at the start of this phase
- **Duration**:
  - Fast: 3 seconds
  - Medium: 4 seconds
  - Slow: 5 seconds
- **Followed by**: Blank screen (200-500ms depending on speed)

#### Mini-Quiz Intervals
- **Frequency**: After every 3 characters to maintain engagement
- **Purpose**: Active retrieval practice and attention reset
- **Question Types**: Uses commonly confused characters as distractors
- **Immediate Feedback**: Visual highlighting (green for correct, red for wrong)

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

The quiz system operates at two levels:

### Mini-Quizzes (Every 3 Cards)
1. **Smart Engagement**: Prevents cognitive overload and maintains attention
2. **Confused Characters**: Uses commonly confused characters as distractors
3. **Immediate Feedback**: Green highlighting for correct, red for incorrect answers
4. **Quick Pace**: Maintains session momentum

### Final Quiz (After All Cards)
1. **Comprehensive Review**: Tests retention of all studied cards
2. **Question types**: Cycles through Meaning→Character, Audio→Character, Character→Image
3. **Time limit**: 10 seconds per question
4. **Enhanced Feedback**: Visual highlighting with audio reinforcement
5. **Auto-advance**: 2 seconds after answer (immediate on timeout)
6. **SM-2 Integration**: Results update spaced repetition intervals

## Session Flow Diagram

```
START
  ↓
[DEMO SYSTEM] (optional, first-time users)
  ↓
[3-2-1 Countdown]
  ↓
FLASH PHASE (optimized 8-card blocks)
  ├─ Card 1: Hanzi → Blank → Full Info → Blank
  ├─ Card 2: Hanzi → Blank → Full Info → Blank  
  ├─ Card 3: Hanzi → Blank → Full Info → Blank
  ├─ [MINI-QUIZ] ← After every 3 cards
  ├─ Card 4: Hanzi → Blank → Full Info → Blank
  ├─ Card 5: Hanzi → Blank → Full Info → Blank
  ├─ Card 6: Hanzi → Blank → Full Info → Blank
  ├─ [MINI-QUIZ] ← After every 3 cards
  ├─ Card 7: Hanzi → Blank → Full Info → Blank
  └─ Card 8: Hanzi → Blank → Full Info → Blank
  ↓
FINAL QUIZ PHASE
  ├─ Question 1: Meaning → Character (with confused chars)
  ├─ Question 2: Audio → Character
  ├─ Question 3: Character → Image
  └─ ... (cycles through types)
  ↓
SESSION COMPLETE (SM-2 updates)
```

## Mode Variations

### New Mode
- Limited to 8 characters per session (optimized for modern attention spans)
- Cards must have audio and AI insights before being presented
- Interactive demo system for first-time users
- Mini-quizzes every 3 cards to maintain engagement
- Prompts user after 8 cards to continue or stop
- Focuses on initial encoding with immediate feedback

### Review Mode
- Limited to 8 cards per session (highest priority cards)
- Cards sorted by: overdue days, then memory strength, then confusion patterns
- Mini-quizzes with commonly confused characters as distractors
- Updates SM-2 spaced repetition intervals based on performance
- Reinforces previously learned material with enhanced feedback

### Practice Mode
- Includes all previously studied cards with mini-quiz intervals
- Session size adapts to user preference (default 8-card blocks)
- Uses confused character analysis for challenging distractors
- Good for exam preparation and retention testing
- Does not affect spaced repetition scheduling (practice only)

## Cognitive Principles

1. **Dual-Phase Presentation**: Separates visual recognition from semantic processing
2. **Temporal Spacing**: Blanks between phases allow consolidation
3. **Multi-modal Encoding**: Visual + auditory + semantic creates multiple memory pathways
4. **Active Retrieval**: Mini-quizzes and final quiz strengthen memory through testing effect
5. **Optimized Session Size**: 8 characters optimized for modern attention spans
6. **Frequent Engagement**: Mini-quizzes every 3 cards prevent cognitive overload
7. **Desirable Difficulties**: Commonly confused characters create productive challenge
8. **Immediate Feedback**: Visual highlighting and audio reinforcement for correct associations

## User Controls

- **Q/ESC**: Exit session (with confirmation)
- **P**: Pause/Resume during flash phase
- **R**: Restart session (with confirmation)
- **1-4**: Answer quiz questions
- **Space**: Continue after timeout in quiz

## Session Metrics

The system tracks:
- Total cards studied (optimized 8-character sessions)
- Time elapsed (excluding pauses, ~90 seconds total)
- Mini-quiz accuracy and engagement metrics
- Final quiz accuracy and response times
- Confused character patterns for future distractors
- Cards marked for review based on SM-2 algorithm
- Session completion status and user preferences

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