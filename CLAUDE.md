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
- `docker-compose up -d` - Start MongoDB and PostgreSQL in the background
- `docker-compose down` - Stop all services
- `docker-compose logs -f mongo` - View MongoDB logs
- `docker-compose logs -f postgres` - View PostgreSQL logs
- `bun run load-dict` - Load CC-CEDICT dictionary into MongoDB (123,557 entries)
- `bun run clean-db` - Clean all decks, cards, and reviews from database
- `bun run migrate-to-r2:dry` - Dry run migration from GridFS to Cloudflare R2
- `bun run migrate-to-r2` - Migrate media files from GridFS to Cloudflare R2
- `bun run fix-indexes` - Fix MongoDB card collection indexes (removes duplicate key errors)

### Database Management (PostgreSQL/Prisma)
- `bun run db:generate` - Generate Prisma client after schema changes
- `bun run db:migrate` - Create and run migrations in development
- `bun run db:migrate:prod` - Run migrations in production
- `bun run db:push` - Push schema changes directly (development only)
- `bun run db:studio` - Open Prisma Studio GUI for database browsing
- `bun run db:reset` - Reset database and re-run all migrations

### Testing
No testing framework is currently configured. When implementing tests, check for test configuration in package.json first.

## Architecture Overview

### Current State
This is a Next.js 15.4.4 application using the App Router, TypeScript with strict mode, React 19, and Tailwind CSS v4. The project is in initial state with only the Next.js starter template.

### Intended Architecture
The application is a Traditional Chinese Characters Flash-and-Review Trainer for Taiwan Mandarin (臺灣國語) with these core components:

1. **Frontend**: Next.js SPA for flash card presentations and quiz interactions
2. **Backend API**: Node.js service that handles enrichment, caching, and data access
3. **Database Architecture**: 
   - **PostgreSQL**: User authentication (Auth.js tables), user profiles, and user settings
   - **MongoDB**: Decks, cards, reviews, dictionary data, and all learning content
   - **Cloudflare R2**: Image and audio file storage (replacing GridFS)
4. **Authentication**: User accounts with secure session management
5. **Deployment**: Cloud deployment with multi-tenant support

### Key Features to Implement
- CSV deck import (hanzi characters only)
- Auto-enrichment: dictionary lookup, image search, TTS generation
- Flash card sessions with spaced repetition (SM-2 algorithm)
- User accounts with personalized progress tracking
- Cloud sync across devices
- Collaborative deck sharing (future)

### Flash Session Design (Science-Based)
- **10-second countdown** for mental preparation
- **Preview grid** showing upcoming characters (2s)
- **Three-block system**:
  - Block 1: Segmented (ortho→phono→semantic→self-test) with audio
  - Block 2: Combined reinforcement (3s) with audio
  - Block 3: Quick recognition WITHOUT audio (mental pronunciation)
- **Optimized timing**: 800ms blanks between cards, 3s countdown between blocks
- **Accessibility**: Reduce motion toggle, brightness control (70% dim option)
- **No rapid flashing**: Epilepsy-safe design with gentle transitions

### Data Model
Collections needed in MongoDB:
- `users`: User accounts and authentication data
- `decks`: Study deck metadata (with userId for ownership)
- `cards`: Individual character cards with enrichment data (shared across users)
- `reviews`: SM-2 scheduling data per card per user
- `sessions`: Study session history per user
- `dictCache`, `imageCache`, `ttsCache`: Cached enrichment data (shared)
- `deckCards`: Many-to-many relationship between decks and cards
- GridFS buckets for images and audio files

### Performance Targets
- 60 fps animations during flash sessions
- Cache hit rate ≥ 90% after initial enrichment
- "Due Today" query < 50ms
- Session completion rate ≥ 85%

## Important Notes
- This is a cloud-based application with user accounts and authentication
- All API keys must be kept server-side only
- Internet connection required for all functionality
- Target users: Taiwan Mandarin (臺灣國語) learners studying Traditional Chinese characters
- UI in English, content in Traditional Chinese with Taiwan Mandarin pinyin tone marks
- All linguistic analysis and vocabulary must be specific to Taiwan Mandarin, NOT Mainland Mandarin
- User data isolation and privacy must be maintained
- Implement rate limiting for API endpoints to prevent abuse

## Media Storage with Cloudflare R2

### Configuration
To use Cloudflare R2 for media storage, set these environment variables:
- `R2_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 access key ID  
- `R2_SECRET_ACCESS_KEY` - R2 secret access key
- `R2_BUCKET_NAME` - Name of your R2 bucket (e.g., chinese-app-media)
- `R2_PUBLIC_URL` - Public URL for your R2 bucket

### Migration from GridFS
If you have existing media in MongoDB GridFS:
1. Run `bun run migrate-to-r2:dry` to preview what will be migrated
2. Run `bun run migrate-to-r2` to perform the actual migration
3. Optionally specify a deck: `bun run migrate-to-r2 --deck-id=xxx`

### Benefits of R2
- 94% cheaper storage costs vs MongoDB GridFS
- Zero egress fees (free bandwidth)
- Global CDN for fast media delivery
- Direct browser streaming for audio
- Automatic image optimization available
- Better scalability for large media libraries

## Best Practices and Reminders
- Always update the documentations when we change things that needs the documentations to be updated or we add new features or changes that require new documentations