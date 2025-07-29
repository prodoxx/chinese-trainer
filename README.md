# Danbing - Traditional Chinese Learning Platform

A cloud-based web application for learning Traditional Chinese characters using spaced repetition, intelligent mnemonics, and multi-sensory learning techniques.

## Features

- Import CSV decks with Traditional Chinese characters
- Automatic character enrichment using CC-CEDICT dictionary (123,557 entries)
- Real pinyin with tone marks and comprehensive definitions
- AI-powered image generation using DALL-E 3
- High-quality, contextually relevant images for every character
- Consistent visual style across all learning materials
- Flash card presentations with timed intervals
- Quiz sessions after each block of cards
- Dark theme optimized for focus
- Cloud-based storage with user accounts
- Cross-device synchronization
- Personalized learning progress

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Docker](https://www.docker.com/) installed

### Setup

1. Start MongoDB:
```bash
docker-compose up -d
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```
Then add your API credentials:
- **OpenAI**: Required for character analysis and DALL-E image generation
- **Azure**: For Text-to-Speech services

4. Load the CC-CEDICT dictionary (123,557 entries):
```bash
bun run load-dict
```

5. Run the development server:
```bash
bun run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Usage

1. Import a CSV file with a "hanzi" header and one Traditional Chinese character per line
2. Wait for automatic enrichment to complete
3. Click "Study →" to start a flash card session
4. Use keyboard shortcuts:
   - SPACE: Continue to next card
   - ESC: Exit session
   - 1-4: Answer quiz questions

### Re-enrichment Options

**Option 1: Re-enrich Button** (Recommended)
- Click the "Re-enrich" button next to any deck
- Updates only cards with placeholder images
- Uses the latest AI search improvements

**Option 2: Clean and Re-import**
```bash
# Clean all decks
bun run clean-db

# Or clean a specific deck
bun run scripts/clean-database.ts --deck "deck-name"
```
Then re-import your CSV files for fresh enrichment.

### Sample Data

A `sample-deck.csv` file is included with 30 common Traditional Chinese characters.

## How AI Image Generation Works

The app uses OpenAI to analyze Chinese characters and generate contextually appropriate images:

1. **Character Analysis**: Each character is analyzed for meaning, context, and cultural significance
2. **Visual Prompt Generation**: AI creates detailed prompts optimized for DALL-E 3
3. **Image Generation**: DALL-E 3 creates unique, high-quality images for each character
4. **Caching**: Generated images are cached permanently to reduce costs

All images are generated with consistent style and quality, ensuring a cohesive learning experience!

## Current Features

- Text-to-speech audio generation with Taiwan Mandarin voice
- Full SM-2 spaced repetition scheduling implementation
- Progress tracking and analytics dashboard
- Character insights with linguistic analysis
- Intelligent mnemonic generation
- Redis-based job queues for scalable enrichment

## Future Enhancements

- Social features and deck sharing
- Premium subscription tiers
- Mobile applications
- Collaborative learning groups
- Advanced analytics and learning predictions
