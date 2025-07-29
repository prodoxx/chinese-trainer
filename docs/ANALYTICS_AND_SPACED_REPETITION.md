# Analytics and Spaced Repetition System

## Overview

This document describes the comprehensive analytics and spaced repetition system implemented in the Chinese Character Trainer. The system is designed based on cognitive science research and linguistics principles to optimize learning efficiency and retention.

## Table of Contents

1. [Spaced Repetition System](#spaced-repetition-system)
2. [Learning Analytics](#learning-analytics)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Implementation Details](#implementation-details)
6. [Future Analytics Features](#future-analytics-features)

## Spaced Repetition System

### SM-2 Algorithm Implementation

The system uses a modified version of the SuperMemo 2 (SM-2) algorithm for scheduling reviews:

```typescript
// Core SM-2 Parameters
{
  ease: 2.5,           // Ease factor (E-Factor), min 1.3
  intervalDays: 1,     // Current interval in days
  repetitions: 0,      // Consecutive correct responses
  due: Date,           // Next review date
}
```

#### Review Intervals

- **First review**: 1 day after initial learning
- **Second review**: 6 days after first successful review
- **Subsequent reviews**: Previous interval × ease factor
- **Failed review**: Reset to 1 day interval

#### Quality Calculation

Response quality (0-5 scale) is calculated based on:
- **5**: Perfect - instant recall (< 2 seconds)
- **4**: Good - quick recall (2-4 seconds)
- **3**: Pass - slow recall (4-8 seconds)
- **2**: Incorrect but attempted
- **0**: Complete timeout (10 seconds)

### Memory Strength and Decay

The system tracks memory strength using an exponential forgetting curve:

```typescript
strength = e^(-daysSinceReview / interval)
```

Cards are prioritized for review when:
- They are overdue (past due date)
- Memory strength falls below 80%

## Learning Analytics

### 1. Comprehensive Learning Statistics

Each card tracks detailed learning metrics:

#### Core Metrics
- **Total exposures**: Times shown during flash sessions
- **Recognition attempts**: Multiple choice quiz attempts
- **Recall attempts**: Active recall quiz attempts
- **Accuracy rates**: Separate tracking for recognition vs recall

#### Time-Based Metrics
- **Average response times**: For both recognition and recall
- **Fastest/slowest responses**: To identify outliers
- **Total study time**: Cumulative time spent on card

#### Learning Curve Metrics
- **Trials to mastery**: Attempts needed for 3 consecutive correct
- **Mastery date**: When mastery was achieved
- **Retention duration**: Days retained after mastery
- **Forgetting events**: Times forgotten after mastery

#### Confusion and Error Analysis
- **Confusion matrix**: Which cards are confused with this one
- **Error types**: Timeout, wrong tone, semantic confusion, etc.
- **Similarity scores**: Visual, semantic, phonetic similarity

### 2. Session-Level Tracking

Each study session captures:

#### Performance Metrics
- **Quiz scores**: Percentage correct
- **Average response times**: Session-wide average
- **Performance trends**: Improving, stable, or declining

#### Cognitive Load Indicators
- **Fatigue score** (0-1): Based on performance degradation
- **Focus score** (0-1): Based on response consistency
- **Flow state detection**: Optimal challenge-skill balance

#### Engagement Metrics
- **Pause events**: Number and duration of pauses
- **Session duration**: Total active study time
- **Cards per minute**: Learning velocity
- **Early exit detection**: Incomplete sessions

### 3. Linguistic Complexity Analysis

Each character is analyzed using both dictionary data and AI:

#### Dictionary-Based Analysis
- **Pinyin and tones**: Actual pronunciation from CC-CEDICT
- **Definitions**: All meanings and contexts
- **Frequency**: Based on dictionary occurrence
- **Semantic fields**: Extracted from definitions

#### Visual Complexity
- **Stroke count**: Number of strokes
- **Component count**: Number of radicals/components
- **Visual complexity score** (0-1): Normalized complexity
- **Radical detection**: Semantic and phonetic components

#### AI-Enhanced Analysis (OpenAI)
- **Etymology**: Character origin and evolution
- **Mnemonics**: Visual, story-based, and component-based memory aids
- **Common errors**: Similar characters, wrong contexts, tone confusions
- **Usage patterns**: Collocations, register level, domains
- **Personalized tips**: Level-specific learning recommendations

#### Learning Difficulty
- **Overall difficulty** (0-1): Combines all factors
- **Phonetic transparency**: How components hint at pronunciation
- **Semantic transparency**: How radicals relate to meaning
- **Tone difficulty**: Based on tone patterns and sandhi rules

### 4. Cognitive Metrics

The system tracks cognitive science-based metrics:

#### Cognitive Load
Calculated from:
- Response time variability
- Error rate changes
- Performance degradation

#### Attention Level
Measured by:
- Response time consistency
- Sustained accuracy
- Absence of outliers

#### Learning Efficiency
Combines:
- Accuracy rate
- Speed of responses
- Retention rate
- Cards per minute

## Data Models

### Review Model
```typescript
{
  cardId: ObjectId,
  deckId: ObjectId,
  ease: number,              // 1.3 - 2.5+
  intervalDays: number,      // Current interval
  repetitions: number,       // Consecutive correct
  due: Date,                 // Next review date
  seen: number,              // Total attempts
  correct: number,           // Correct attempts
  avgResponseMs: number,     // Average response time
  lastReviewedAt: Date,      // Last review date
  memoryStrength: number,    // 0-1, calculated
}
```

### LearningStats Model
```typescript
{
  deckId: ObjectId,
  cardId: ObjectId,
  
  // Core metrics
  totalExposures: number,
  recognitionAttempts: number,
  recallAttempts: number,
  
  // Accuracy
  recognitionAccuracy: number,  // 0-1
  recallAccuracy: number,       // 0-1
  
  // Timing
  avgRecognitionTimeMs: number,
  avgRecallTimeMs: number,
  
  // Learning curve
  trialsToMastery: number,
  masteryDate: Date,
  
  // Confusion tracking
  confusionMatrix: Map<string, number>,
  
  // Character analysis
  characterComplexity: {
    strokeCount: number,
    radicalCount: number,
    isPhonetic: boolean,
    isSemantic: boolean,
    frequency: number,  // 1-5
  },
  
  // Error analysis
  errorTypes: {
    timeout: number,
    wrongTone: number,
    wrongMeaning: number,
    wrongCharacter: number,
  }
}
```

### StudySession Model
```typescript
{
  deckId: ObjectId,
  sessionType: 'new' | 'review',
  
  // Timing
  startTime: Date,
  endTime: Date,
  durationMs: number,
  timeOfDay: string,
  
  // Performance
  cardsStudied: ObjectId[],
  quizScore: number,        // 0-1
  avgResponseTimeMs: number,
  
  // Cognitive metrics
  fatigueScore: number,     // 0-1
  focusScore: number,       // 0-1
  flowStateIndicators: {
    consistentTiming: boolean,
    highAccuracy: boolean,
    lowVariability: boolean,
  },
  
  // Quality
  qualityScore: number,     // 0-1
}
```

## API Endpoints

### Review Management

#### Submit Review Results
```
POST /api/reviews/submit
Body: [{
  cardId: string,
  deckId: string,
  correct: boolean,
  responseTimeMs: number,
  timedOut?: boolean
}]
```

#### Get Cards for Review
```
GET /api/cards/:deckId/review
Response: {
  cards: Card[],    // Limited to 7 cards maximum
  totalDue: number, // Total cards due (may be more than 7)
  totalCards: number // Cards returned in this session
}
```

### Statistics

#### Get Deck Statistics
```
GET /api/decks/:deckId/stats
Response: {
  stats: {
    totalCards: number,
    dueToday: number,
    overdue: number,
    learning: number,
    mature: number,
    averageEase: number,
    averageStrength: number,
    nextReviewDate: Date
  },
  cardsForReview: [...],
  heatMapData: {...}
}
```

## Implementation Details

### Review Scheduling

1. **After each quiz**: System calculates quality score based on correctness and response time
2. **SM-2 calculation**: Updates ease factor and calculates next interval
3. **Database update**: Stores new review schedule and performance metrics
4. **Next session**: Prioritizes overdue cards and weak memories

### Deck Display

The deck list shows real-time statistics:
- **Red badge**: Number of overdue cards
- **Yellow badge**: Cards due today
- **Retention percentage**: Average memory strength across all cards
- **Review button**: Appears when cards are due

### Flash Session Modes

1. **New Mode**: 
   - Limited to 7 cards per session (optimal working memory)
   - Requires audio before presentation
   - Prompts user to continue after 7 cards
   - Creates initial memory traces

2. **Review Mode**: 
   - Limited to 7 cards per session
   - Shows highest priority cards, prioritized by:
     - Most overdue first
     - Weakest memory strength
     - Previous error rate
   - Updates SM-2 intervals based on performance

3. **Practice Mode**:
   - No session limit
   - Includes all previously studied cards
   - Does not affect spaced repetition scheduling
   - Good for exam preparation

### Analytics Collection

Analytics are collected automatically during:
- **Flash cycles**: Tracks exposure count and timing
- **Quiz responses**: Records accuracy, response time, confusion
- **Session completion**: Calculates cognitive metrics
- **Background processing**: Updates learning curves and predictions

## OpenAI Integration

The system leverages OpenAI's GPT-4 for advanced linguistic analysis:

### Deep Character Analysis
```typescript
const analysis = await analyzeCharacterWithOpenAI('愛');
// Returns etymology, mnemonics, usage patterns, common errors
```

### Personalized Learning Paths
```typescript
const path = await generateLearningPath('難', {
  level: 'intermediate',
  nativeLanguage: 'English',
  learningGoals: ['conversation', 'reading'],
  previousErrors: ['混淆相似字']
});
```

### Confusion Pattern Analysis
- Identifies why specific characters are confused
- Provides targeted remediation strategies
- Groups similar confusion patterns

### Contextual Example Generation
- Creates level-appropriate example sentences
- Includes pinyin and translations
- Highlights key learning points

## Future Analytics Features

### Planned Enhancements

1. **Learning Dashboards**
   - Visual learning curves
   - Heat map calendar of study activity
   - Character confusion networks
   - Optimal study time recommendations
   - AI-generated progress insights

2. **Predictive Analytics**
   - Mastery date predictions
   - Forgetting curve projections
   - Difficulty estimates for new characters
   - Personalized interval adjustments
   - AI-powered difficulty prediction

3. **Comparative Analytics**
   - Progress compared to character frequency
   - Learning speed by character type
   - Effectiveness of different study times
   - Confusion pattern analysis
   - Peer comparison (anonymized)

4. **Export and Reports**
   - Weekly/monthly progress reports
   - Character mastery certificates
   - Learning streak tracking
   - Detailed error analysis reports
   - AI-generated study recommendations

### Research Integration

The system is designed to incorporate findings from:
- **Cognitive Load Theory**: Optimize challenge level
- **Desirable Difficulties**: Strategic spacing and interleaving
- **Multimodal Learning**: Audio-visual association strength
- **Flow Theory**: Maintain optimal engagement
- **Forgetting Curve Research**: Evidence-based intervals

## Usage Guidelines

### For Optimal Learning

1. **Daily Reviews**: Complete all due reviews daily
2. **Consistent Timing**: Study at the same time each day
3. **Focus Sessions**: Minimize distractions during study
4. **Trust the Algorithm**: Don't skip cards that seem easy

### Interpreting Statistics

- **Retention %**: Above 80% is excellent
- **Due Cards**: Keep below 20% of total deck
- **Learning vs Mature**: Aim for 80%+ mature cards
- **Session Quality**: Target 0.7+ quality scores

This comprehensive system provides the foundation for data-driven language learning optimization based on proven cognitive science principles.