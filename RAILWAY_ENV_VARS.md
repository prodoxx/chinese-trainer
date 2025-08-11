# Railway Environment Variables Setup Guide

This guide lists all required and optional environment variables for deploying the Chinese Flashcards app on Railway.

## Required Environment Variables

### 🔴 Critical (App won't work without these)

#### Databases
```bash
# PostgreSQL - Railway provides this automatically when you provision PostgreSQL
DATABASE_URL="postgresql://postgres:password@host.railway.internal:5432/railway"

# MongoDB - Use MongoDB Atlas or provision MongoDB on Railway
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/chinese-app?retryWrites=true&w=majority"

# Redis - Railway provides this automatically when you provision Redis
REDIS_URL="redis://default:password@host.railway.internal:6379"
```

#### Authentication
```bash
# NextAuth configuration
NEXTAUTH_URL="https://your-app.railway.app"  # Your Railway app URL
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"  # Run: openssl rand -base64 32
```

#### Storage (Cloudflare R2)
```bash
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="chinese-app-media"
```

### 🟡 Required for Core Features

#### AI Services
```bash
# OpenAI - For card enrichment
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxx"

# Fal.ai - For image generation
FAL_KEY="fal-xxxxxxxxxxxxx"

# Azure TTS - For audio generation
AZURE_TTS_KEY="your-azure-tts-key"
AZURE_TTS_REGION="eastus"  # Your Azure region
```

#### Email (For reminders)
```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@your-domain.com"  # Must be verified in Resend
```

#### Application
```bash
NEXT_PUBLIC_APP_URL="https://your-app.railway.app"  # Used in emails
NODE_ENV="production"
```

## Optional Environment Variables

### 🟢 Nice to Have

#### OAuth Providers
```bash
# Google OAuth (optional login method)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Storage
```bash
# Optional: Custom domain for R2
R2_PUBLIC_URL="https://cdn.your-domain.com"
```

#### Analytics
```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

#### Development/Testing
```bash
# Ollama (for local AI in development)
OLLAMA_HOST="http://localhost:11434"
ENABLE_OLLAMA_DEV="false"  # Set to true in dev to use Ollama
```

## Service-Specific Variables

### Main Web Service
All variables listed above.

### Worker Service
Needs the same database and service credentials:
```bash
DATABASE_URL
MONGODB_URI
REDIS_URL
OPENAI_API_KEY
FAL_KEY
AZURE_TTS_KEY
AZURE_TTS_REGION
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
RESEND_API_KEY  # If running reminder worker
```

Optional worker configuration:
```bash
WORKER_HEALTH_PORT="3001"  # For health checks
```

### Cron Jobs
Same as worker service, particularly needs:
```bash
DATABASE_URL  # To query user preferences
REDIS_URL     # To queue jobs
```

## Railway-Specific Setup

### Using Railway Internal Networking

For services within the same Railway project, use internal URLs:

```bash
# Instead of public URLs
DATABASE_URL="postgresql://postgres:password@postgres.railway.internal:5432/railway"
REDIS_URL="redis://default:password@redis.railway.internal:6379"
```

### Service Variables

Railway automatically provides some variables:
- `PORT` - The port your app should listen on
- `RAILWAY_ENVIRONMENT` - Current environment name
- `RAILWAY_STATIC_URL` - URL for your service

## Setting Variables in Railway

### Via Dashboard
1. Go to your service
2. Click **Variables** tab
3. Add each variable
4. Click **Deploy** to apply

### Via Railway CLI
```bash
railway variables set OPENAI_API_KEY="sk-proj-xxx"
railway variables set RESEND_API_KEY="re_xxx"
# ... etc
```

### From .env file
```bash
# Create .env.production with all variables
railway variables set $(cat .env.production | xargs)
```

## Validation Checklist

Before deploying, ensure you have:

- [ ] **Databases**
  - [ ] DATABASE_URL (PostgreSQL)
  - [ ] MONGODB_URI
  - [ ] REDIS_URL

- [ ] **Authentication**
  - [ ] NEXTAUTH_URL (your Railway app URL)
  - [ ] NEXTAUTH_SECRET (generated securely)

- [ ] **AI Services**
  - [ ] OPENAI_API_KEY
  - [ ] FAL_KEY
  - [ ] AZURE_TTS_KEY
  - [ ] AZURE_TTS_REGION

- [ ] **Storage**
  - [ ] R2_ACCOUNT_ID
  - [ ] R2_ACCESS_KEY_ID
  - [ ] R2_SECRET_ACCESS_KEY
  - [ ] R2_BUCKET_NAME

- [ ] **Email** (if using reminders)
  - [ ] RESEND_API_KEY
  - [ ] RESEND_FROM_EMAIL

- [ ] **Application**
  - [ ] NEXT_PUBLIC_APP_URL
  - [ ] NODE_ENV="production"

## Security Notes

1. **Never commit** `.env` files to git
2. **Use Railway's secret management** for sensitive values
3. **Rotate keys regularly**, especially API keys
4. **Use internal networking** for inter-service communication
5. **Enable 2FA** on all service provider accounts

## Troubleshooting

### Service won't start
- Check Railway logs: `railway logs`
- Verify all required variables are set
- Check for typos in variable names

### Database connection issues
- Use internal URLs for Railway databases
- Check if services are in the same project
- Verify credentials are correct

### API errors
- Verify API keys are valid and not expired
- Check service quotas/limits
- Ensure billing is active on API providers