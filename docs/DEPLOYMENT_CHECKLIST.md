# Deployment Checklist for Review Reminders

## Pre-Deployment Steps

### 1. Database Migration

**For Production (Railway):**
```bash
# Run migration in production
npx prisma migrate deploy
```

**For Local Development:**
```bash
# Already done, but for reference:
npx prisma migrate dev --name add-reminder-tables
```

### 2. Verify Environment Variables

Ensure all required environment variables are set in Railway:

#### Core Services
- [x] `DATABASE_URL`
- [x] `MONGODB_URI`
- [x] `REDIS_URL`
- [x] `NEXTAUTH_URL`
- [x] `NEXTAUTH_SECRET`

#### Email Service
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL` (optional, defaults to noreply@domain)

#### Application
- [ ] `NEXT_PUBLIC_APP_URL`

### 3. Deploy Services

#### Main Web Service
```bash
# Ensure package.json has correct start command
"start": "next start"
```

#### Worker Service
```bash
# Create new service in Railway with start command:
"worker": "bun run src/workers/index.ts"
```

### 4. Set Up Railway Cron Jobs

#### Hourly Reminder Job
1. Go to Railway Dashboard → Your Project
2. Click **Settings** → **Cron Jobs**
3. Add new cron job:
   - Name: `send-hourly-reminders`
   - Schedule: `0 * * * *`
   - Command: `npm run cron:hourly-reminders`
   - Service: Your main web service
   - Timeout: 300 seconds

#### Weekly Digest Job
1. Add another cron job:
   - Name: `send-weekly-digest`
   - Schedule: `0 10 * * 1`
   - Command: `npm run cron:weekly-digest`
   - Service: Your main web service
   - Timeout: 600 seconds

## Post-Deployment Verification

### 1. Check Database Migration
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('UserReminderPreferences', 'ReminderLog');
```

### 2. Test Reminder System

#### Manual Test (Production)
```bash
# Create a test endpoint or use Railway shell
curl -X POST https://your-app.railway.app/api/admin/test-reminder \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"userId": "test-user-id"}'
```

### 3. Monitor Logs

#### Check Worker Logs
```bash
railway logs --service=worker
```

#### Check Cron Job Logs
```bash
railway logs --filter="cron"
```

### 4. Verify Email Delivery
- Check Resend dashboard for sent emails
- Query ReminderLog table for records

## Rollback Plan

If issues occur:

### 1. Disable Cron Jobs
- Go to Railway → Cron Jobs → Disable each job

### 2. Stop Worker Service
```bash
railway down --service=worker
```

### 3. Rollback Database (if needed)
```bash
# Create backup first!
pg_dump $DATABASE_URL > backup.sql

# Rollback migration
npx prisma migrate reset --skip-seed
```

## Monitoring Checklist

### Daily Checks
- [ ] Worker service is running
- [ ] No failed jobs in queue
- [ ] Cron jobs executing on schedule
- [ ] Emails being delivered

### Weekly Checks
- [ ] Review ReminderLog for patterns
- [ ] Check user engagement metrics
- [ ] Monitor resource usage

## Common Issues and Solutions

### Issue: Emails not sending
**Solution:**
1. Check `RESEND_API_KEY` is set
2. Verify sender domain in Resend
3. Check worker logs for errors

### Issue: Cron jobs not running
**Solution:**
1. Verify cron expression syntax
2. Check service is healthy
3. Review Railway cron job logs

### Issue: Duplicate emails
**Solution:**
1. Check `lastDailyReminder` timestamps
2. Ensure single worker instance
3. Verify cron job isn't duplicated

## Success Criteria

- [x] Database migration successful
- [ ] Worker service running
- [ ] Cron jobs scheduled
- [ ] Test email sent successfully
- [ ] No errors in logs for 24 hours

## Notes

- Migration adds two new tables: `UserReminderPreferences` and `ReminderLog`
- All foreign keys have CASCADE delete for data consistency
- Timezone handling uses IANA timezone database
- Default reminder time is 9:00 AM in user's timezone