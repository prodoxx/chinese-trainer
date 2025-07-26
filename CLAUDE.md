# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun run dev` - Start the development server on http://localhost:3000
- `bun run build` - Build the production application
- `bun run start` - Start the production server
- `bun run lint` - Run ESLint to check code quality

### Package Management
- `bun install` - Install dependencies
- `bun add <package>` - Add a new dependency
- `bun add -d <package>` - Add a new dev dependency

### Infrastructure
- `docker-compose up -d` - Start MongoDB in the background
- `docker-compose down` - Stop MongoDB
- `docker-compose logs -f mongo` - View MongoDB logs
- `bun run load-dict` - Load CC-CEDICT dictionary into MongoDB (123,557 entries)
- `bun run clean-db` - Clean all decks, cards, and reviews from database

### Testing
No testing framework is currently configured. When implementing tests, check for test configuration in package.json first.

## Architecture Overview

### Current State
This is a Next.js 15.4.4 application using the App Router, TypeScript with strict mode, React 19, and Tailwind CSS v4. The project is in initial state with only the Next.js starter template.

### Intended Architecture (from PRD)
The application will be a Chinese Characters Flash-and-Review Trainer with these core components:

1. **Frontend**: Next.js SPA for flash card presentations and quiz interactions
2. **Local API**: Node.js service that handles enrichment, caching, and data access
3. **Database**: MongoDB with GridFS for storing character metadata and media assets
4. **Deployment**: Docker Compose for local-only deployment

### Key Features to Implement
- CSV deck import (hanzi characters only)
- Auto-enrichment: dictionary lookup, image search, TTS generation
- Flash card sessions with spaced repetition (SM-2 algorithm)
- Offline capability after initial enrichment
- Local-only storage with no cloud sync

### Data Model
Collections needed in MongoDB:
- `decks`: Study deck metadata
- `cards`: Individual character cards with enrichment data
- `reviews`: SM-2 scheduling data per card
- `sessions`: Study session history
- `dictCache`, `imageCache`, `ttsCache`: Cached enrichment data
- GridFS buckets for images and audio files

### Performance Targets
- 60 fps animations during flash sessions
- Cache hit rate ≥ 90% after initial enrichment
- "Due Today" query < 50ms
- Session completion rate ≥ 85%

## Important Notes
- This is a local-only application - no user accounts or cloud deployment
- All API keys must be kept server-side only
- Internet required for enrichment, but sessions can run offline with cached data
- Target users: Traditional Chinese learners (Taiwan focus)
- UI in English, content in Traditional Chinese with pinyin tone marks