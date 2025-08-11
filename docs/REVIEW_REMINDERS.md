# Review Reminder System Documentation

## Overview

The Review Reminder System sends automated email notifications to users when they have flashcards due for review. It uses a worker-based architecture with BullMQ for job processing and Resend for email delivery.

## Architecture

### Components

1. **Database Schema** (PostgreSQL via Prisma)
   - `UserReminderPreferences`: Stores user notification settings
   - `ReminderLog`: Tracks sent reminders and failures

2. **Email Service** (`src/lib/email/reminder-service.ts`)
   - Sends reminder emails via Resend
   - Tracks email delivery status

3. **Email Templates** (`src/emails/review-reminder.tsx`)
   - React Email components for beautiful, responsive emails
   - Shows cards due, overdue counts, and deck breakdown

4. **Reminder Worker** (`src/workers/review-reminder-worker.ts`)
   - Processes reminder jobs from the queue
   - Checks due cards in MongoDB
   - Sends emails via Resend

5. **Scheduler** (`src/workers/reminder-scheduler.ts`)
   - Runs hourly cron jobs
   - Schedules reminders based on user preferences
   - Handles timezone conversions

6. **API Endpoints** (`src/app/api/user/reminder-preferences/route.ts`)
   - GET/PUT/DELETE for managing preferences
   - User-facing settings management

## How It Works

### Daily Reminder Flow

1. **Hourly Check** (Every hour at :00)
   - Cron job runs `scheduleHourlyReminders()`
   - Queries all users with reminders enabled
   - Checks if current hour matches user's preferred time in their timezone

2. **Job Scheduling**
   - For matching users, adds job to `review-reminders` queue
   - Adds 0-10 minute random delay to spread load
   - Checks if reminder already sent today

3. **Job Processing**
   - Worker picks up job from queue
   - Queries MongoDB for due cards across all user's decks
   - Counts overdue vs today's cards
   - Groups by deck

4. **Email Sending**
   - If cards >= threshold (default 5), sends email
   - Uses Resend API with React Email template
   - Logs success/failure to database
   - Updates `lastDailyReminder` timestamp

### Data Flow

```
User Preferences (PostgreSQL)
    ↓
Scheduler (Cron Job)
    ↓
BullMQ Queue
    ↓
Worker Process
    ↓
MongoDB (Check Due Cards)
    ↓
Resend API (Send Email)
    ↓
Reminder Log (PostgreSQL)
```

## Deployment on Railway

### Prerequisites

1. **Environment Variables** (Add to Railway):
   ```env
   # Existing variables
   DATABASE_URL=postgresql://...
   MONGODB_URI=mongodb://...
   REDIS_URL=redis://...
   
   # Resend
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   
   # App URL (for email links)
   NEXT_PUBLIC_APP_URL=https://your-app.railway.app
   ```

2. **Database Migration**:
   ```bash
   # Add the new tables to your schema.prisma
   # Then run migration
   npx prisma migrate deploy
   ```

### Deployment Steps

#### Option 1: Separate Worker Service (Recommended)

1. **Create a new Railway service** for workers:
   ```yaml
   # railway.json (in project root)
   {
     "services": {
       "web": {
         "build": {
           "builder": "nixpacks"
         },
         "deploy": {
           "startCommand": "npm run start"
         }
       },
       "worker": {
         "build": {
           "builder": "nixpacks"
         },
         "deploy": {
           "startCommand": "npm run worker"
         }
       }
     }
   }
   ```

2. **Add worker script to package.json**:
   ```json
   {
     "scripts": {
       "worker": "tsx src/workers/index.ts",
       "worker:dev": "tsx watch src/workers/index.ts"
     }
   }
   ```

3. **Deploy to Railway**:
   - Push to GitHub
   - Railway will auto-deploy both services
   - Worker service will run continuously

#### Option 2: Combined Service (Simpler but less scalable)

1. **Modify your main app startup** (`src/app/layout.tsx` or custom server):
   ```typescript
   // Start workers if in production
   if (process.env.NODE_ENV === 'production' && process.env.START_WORKERS === 'true') {
     import('../workers/index').then(({ startWorkers }) => {
       startWorkers();
     });
   }
   ```

2. **Set environment variable** in Railway:
   ```env
   START_WORKERS=true
   ```

### Railway Configuration

1. **Resource Allocation**:
   - Worker service: 512MB RAM minimum
   - Can handle ~1000 users with default settings
   - Scale horizontally by adding more worker instances

2. **Health Checks**:
   ```typescript
   // Add to worker service for Railway health checks
   import express from 'express';
   
   const app = express();
   app.get('/health', (req, res) => {
     res.json({ status: 'healthy', workers: 'running' });
   });
   app.listen(process.env.PORT || 3001);
   ```

3. **Monitoring**:
   - Check Railway logs for worker output
   - Monitor Redis queue size in Railway metrics
   - Set up alerts for failed jobs

## Configuration

### User Settings

Users can configure reminders through the settings page:

```typescript
interface ReminderPreferences {
  enabled: boolean;           // Master switch
  reminderTime: string;        // "09:00" format
  timezone: string;            // IANA timezone
  minCardsThreshold: number;   // Minimum cards to trigger
  dailyReminders: boolean;     // Daily emails
  weeklyDigest: boolean;       // Weekly summary
}
```

### Default Settings

- **Time**: 9:00 AM in user's timezone
- **Threshold**: 5 cards minimum
- **Frequency**: Daily reminders enabled, weekly digest disabled

## Testing

### Local Development

1. **Start Redis**:
   ```bash
   docker-compose up -d redis
   ```

2. **Run worker locally**:
   ```bash
   npm run worker:dev
   ```

3. **Trigger manual reminder**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/trigger-reminder \
     -H "Content-Type: application/json" \
     -d '{"userId": "user_123"}'
   ```

### Production Testing

1. **Check worker logs** in Railway:
   ```
   railway logs -s worker
   ```

2. **Monitor queue** via Bull Dashboard or custom endpoint

3. **Check reminder logs** in database:
   ```sql
   SELECT * FROM "ReminderLog" 
   WHERE "userId" = 'xxx' 
   ORDER BY "sentAt" DESC;
   ```

## Troubleshooting

### Common Issues

1. **Emails not sending**:
   - Check `RESEND_API_KEY` is set
   - Verify sender domain is verified in Resend
   - Check reminder logs for errors

2. **Wrong timezone**:
   - Ensure user timezone is correctly set
   - Check server timezone configuration
   - Verify date-fns-tz is handling conversions

3. **Jobs not processing**:
   - Check Redis connection
   - Verify worker is running
   - Look for errors in worker logs

4. **Duplicate emails**:
   - Check `lastDailyReminder` is being updated
   - Ensure only one worker instance per queue
   - Verify cron job isn't running multiple times

### Debug Mode

Enable debug logging:
```env
DEBUG=workers:*,reminders:*
```

## Scaling Considerations

### For 10,000+ Users

1. **Separate Redis Instance** for queues
2. **Multiple Worker Instances** (2-4 workers)
3. **Database Connection Pooling**
4. **Rate Limiting** for Resend API
5. **Batch Processing** for weekly digests

### Performance Metrics

- **Email Send Rate**: ~100 emails/minute with Resend
- **Worker Memory**: ~200MB per worker
- **Queue Processing**: ~50 jobs/second
- **Database Queries**: Indexed on userId and reminderTime

## Security

1. **Email Validation**: Always verify user owns email
2. **Unsubscribe Links**: Include in every email
3. **Rate Limiting**: Prevent spam/abuse
4. **Data Privacy**: Don't include sensitive data in emails
5. **HTTPS Only**: All links in emails use HTTPS

## Future Enhancements

1. **SMS Reminders** via Twilio
2. **Push Notifications** for mobile app
3. **Smart Scheduling** based on user activity patterns
4. **Customizable Templates** per user preference
5. **A/B Testing** for optimal reminder times
6. **Streak Tracking** and motivational messages

## Monitoring Checklist

- [ ] Worker service is running
- [ ] Redis queue is processing jobs
- [ ] Cron jobs are executing hourly
- [ ] Emails are being delivered
- [ ] No error logs in past 24 hours
- [ ] Database connections are stable
- [ ] Memory usage is within limits