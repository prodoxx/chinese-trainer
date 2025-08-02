# Development Setup Guide

## Overview

This guide walks you through setting up the Danbing development environment on your local machine. The application uses Next.js 15.4.4, React 19, TypeScript, MongoDB, PostgreSQL, and various third-party services.

## Prerequisites

### Required Software
- **Node.js**: v18.18.0 or higher (v20+ recommended)
- **Bun**: v1.0+ (primary package manager)
- **Docker**: For running databases locally
- **Git**: For version control

### Optional Software
- **MongoDB Compass**: GUI for MongoDB
- **Prisma Studio**: Database GUI (included)
- **Postman/Insomnia**: API testing

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/chinese-app.git
cd chinese-app
```

### 2. Install Dependencies
```bash
# Using Bun (recommended)
bun install

# Alternative: Using npm
npm install
```

### 3. Environment Configuration

Create `.env.local` file in the project root:

```bash
# Database URLs
MONGODB_URI=mongodb://localhost:27017/chinese-app
DATABASE_URL=postgresql://postgres:password@localhost:5432/chinese-app

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl

# Redis for Background Jobs
REDIS_URL=redis://localhost:6379

# OpenAI API
OPENAI_API_KEY=sk-...your-key-here
OPENAI_ORG_ID=org-...your-org-id

# Fal.ai API (Image Generation)
FAL_KEY=...your-fal-key-here

# Email Service (Resend)
RESEND_API_KEY=re_...your-key-here

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=chinese-app-media-dev
R2_PUBLIC_URL=https://your-r2-url.com

# Azure TTS (Text-to-Speech)
AZURE_TTS_KEY=your-azure-key
AZURE_TTS_REGION=eastus

# Dictionary Data
DICT_FILE_PATH=./data/cedict_ts.u8

# Development Settings
NODE_ENV=development
```

### 4. Generate NextAuth Secret
```bash
# Generate a secure secret
openssl rand -base64 32
```

## Database Setup

### 1. Start Docker Services
```bash
# Start MongoDB and PostgreSQL
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Initialize PostgreSQL Schema
```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Or use migrations (recommended for production)
bun run db:migrate
```

### 3. Load Dictionary Data
```bash
# Download CC-CEDICT dictionary file
curl -o data/cedict_ts.u8.gz https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz
gunzip data/cedict_ts.u8.gz

# Load dictionary into MongoDB
bun run load-dict
```

### 4. Verify Database Connections
```bash
# Open Prisma Studio
bun run db:studio

# MongoDB check (requires mongosh)
mongosh mongodb://localhost:27017/chinese-app --eval "db.stats()"
```

## Third-Party Service Setup

### 1. OpenAI API
1. Create account at https://platform.openai.com
2. Generate API key
3. Add to `.env.local`
4. Ensure billing is configured

### 2. Resend Email Service
1. Sign up at https://resend.com
2. Verify domain or use testing domain
3. Generate API key
4. Add to `.env.local`

### 3. Fal.ai Image Generation
1. Sign up at https://fal.ai
2. Generate API key from dashboard
3. Add to `.env.local`
4. Model used: `fal-ai/flux-krea-lora`

### 4. Cloudflare R2 Storage
1. Create Cloudflare account
2. Enable R2 storage
3. Create bucket named `chinese-app-media-dev`
4. Generate API credentials
5. Configure CORS policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 5. Azure Text-to-Speech
1. Create Azure account
2. Create Speech Service resource
3. Get key and region
4. Add to `.env.local`

## Running the Application

### 1. Development Server
```bash
# Start development server
bun run dev

# Application runs on http://localhost:3000
```

### 2. Build for Production
```bash
# Build the application
bun run build

# Start production server
bun run start
```

### 3. Background Workers
```bash
# In a separate terminal, start the worker
bun run worker

# Monitor Redis queues
docker exec -it chinese-app-redis redis-cli
> KEYS bull:*
```

## Development Workflow

### 1. Code Style and Linting
```bash
# Run ESLint
bun run lint

# Fix linting issues
bun run lint --fix

# Type checking
bun run type-check
```

### 2. Database Development

**Making Schema Changes**:
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration
bun run db:migrate --name description_of_change

# 3. Apply migration
bun run db:migrate

# 4. Generate TypeScript types
bun run db:generate
```

**Seeding Test Data**:
```bash
# Create prisma/seed.ts for test data
# Run seed script
bun run db:seed
```

### 3. Testing API Endpoints

**Using cURL**:
```bash
# Health check
curl http://localhost:3000/api/health

# Create test user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Using API Testing Tools**:
- Import the API documentation into Postman
- Use environment variables for tokens
- Test authentication flow first

### 4. Debugging

**VS Code Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "bun run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

**Debug Logging**:
```typescript
// Enable debug logs
process.env.DEBUG = 'app:*'

// In your code
import debug from 'debug'
const log = debug('app:api:decks')
log('Processing deck import', { deckId })
```

## Common Development Tasks

### 1. Creating New API Routes
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Your logic here
  return NextResponse.json({ data: 'example' })
}
```

### 2. Adding Background Jobs
```typescript
// lib/queue/jobs/example.job.ts
import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

export const exampleQueue = new Queue('example', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  }
})

// Add job
await exampleQueue.add('process', { 
  userId: 'user123',
  data: 'example' 
})
```

### 3. Working with MongoDB
```typescript
// lib/mongodb/models/Example.ts
import mongoose from 'mongoose'

const ExampleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export const Example = mongoose.models.Example || 
  mongoose.model('Example', ExampleSchema)
```

### 4. Component Development
```tsx
// components/Example.tsx
'use client'

import { useState } from 'react'

export function Example({ title }: { title: string }) {
  const [count, setCount] = useState(0)
  
  return (
    <div className="p-4 border rounded">
      <h2>{title}</h2>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  )
}
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
# Check if MongoDB is running
docker-compose ps

# Check logs
docker-compose logs mongo

# Restart service
docker-compose restart mongo
```

#### 2. PostgreSQL Migration Errors
```bash
# Reset database (CAUTION: deletes all data)
bun run db:reset

# Check migration status
bunx prisma migrate status
```

#### 3. Redis Connection Issues
```bash
# Check Redis status
docker-compose ps redis

# Test connection
docker exec -it chinese-app-redis redis-cli ping
```

#### 4. Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
bun install

# Check TypeScript errors
bun run type-check
```

### Environment-Specific Issues

#### Development vs Production
- Ensure `NODE_ENV` is set correctly
- Check API URLs in environment variables
- Verify database connections

#### CORS Issues
- Add localhost to allowed origins
- Check R2 bucket CORS configuration
- Verify API headers

## Performance Optimization

### 1. Database Indexes
```javascript
// Ensure indexes in MongoDB
db.cards.createIndex({ hanzi: 1 })
db.cards.createIndex({ deckId: 1 })
db.reviews.createIndex({ userId: 1, cardId: 1 })
```

### 2. Development Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API monitoring
- Performance profiler

### 3. Hot Module Replacement
Next.js includes HMR by default. If not working:
- Check for syntax errors
- Restart dev server
- Clear browser cache

## Security Considerations

### Development Security
1. **Never commit `.env.local` file**
2. **Use different API keys for development**
3. **Rotate secrets regularly**
4. **Use secure passwords for local databases**

### Git Hooks (Optional)
```bash
# Install husky for pre-commit hooks
bun add -d husky
bunx husky init

# Add pre-commit hook
echo "bun run lint" > .husky/pre-commit
```

## Useful Scripts Reference

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "load-dict": "bun run scripts/load-dictionary.ts",
    "worker": "bun run lib/queue/worker.ts",
    "clean-db": "bun run scripts/clean-database.ts"
  }
}
```

## Getting Help

### Resources
- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **MongoDB Manual**: https://docs.mongodb.com
- **Project README**: `/README.md`
- **Claude.md**: `/CLAUDE.md` for AI assistant context

### Support Channels
- GitHub Issues for bugs
- Discord/Slack for discussions
- Stack Overflow for general questions

## Next Steps

1. **Run the application**: `bun run dev`
2. **Create a test account**: Sign up through the UI
3. **Import a sample deck**: Use the CSV import feature
4. **Try a flash session**: Experience the learning system
5. **Explore the codebase**: Start with `/app` directory

Happy coding! 🚀