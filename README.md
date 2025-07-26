# Chinese Character Trainer

A minimal web app for learning Traditional Chinese characters using spaced repetition and dual coding (visual + meaning + pinyin).

## Features

- Import CSV decks with Traditional Chinese characters
- Automatic character enrichment using CC-CEDICT dictionary (123,557 entries)
- Real pinyin with tone marks and comprehensive definitions
- AI-powered intelligent image search that automatically detects abstract vs concrete concepts
- Multiple image sources: Unsplash and Pexels with automatic fallback
- Beautiful, relevant images with proper attribution
- Flash card presentations with timed intervals
- Quiz sessions after each block of cards
- Dark theme optimized for focus
- Local-only data storage with MongoDB

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
- **Unsplash**: Get from https://unsplash.com/developers
- **Pexels**: Get from https://www.pexels.com/api/
- **OpenAI** (optional): For better image search queries

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

## How AI Image Search Works

The app uses OpenAI to intelligently categorize Chinese characters and generate appropriate image searches:

1. **Grammatical/Abstract**: Particles (的, 了), pronouns (我, 你) → Searches for "Chinese calligraphy"
2. **Concrete Objects**: 山 (mountain), 書 (book) → Direct visual searches
3. **Actions/Verbs**: 吃 (eat), 跑 (run) → Searches for people performing actions
4. **Emotions**: 愛 (love), 怒 (anger) → Facial expressions or symbolic representations
5. **Qualities**: 大 (big), 快 (fast) → Visual metaphors or comparisons

No hardcoding required - the AI automatically determines the best visual representation!

## Future Enhancements

- Text-to-speech audio generation with zh-TW voice
- Full SM-2 spaced repetition scheduling implementation
- Offline support with service workers
- Progress tracking and analytics
- Image caching to reduce API calls
