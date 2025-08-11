# Railway Cron Jobs Setup for Review Reminders

## Overview

This guide explains how to set up Railway cron jobs for the review reminder system. Railway's built-in cron job service is more reliable and efficient than running node-cron in a worker process.

## Architecture

```
Railway Cron Job (Hourly)
    ↓
Execute: npm run cron:hourly-reminders
    ↓
Query PostgreSQL for users
    ↓
Schedule jobs in BullMQ
    ↓
Worker processes jobs
    ↓
Send emails via Resend
```

## Setup Instructions

### 1. Deploy the Worker Service

First, ensure your worker service is running to process the reminder jobs:

```yaml
# railway.toml (in project root)
[build]
builder = "nixpacks"

[deploy]
numReplicas = 1
startCommand = "npm run worker"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "always"
```

### 2. Create Cron Jobs in Railway

In your Railway project dashboard:

#### Hourly Reminder Job

1. Go to your project → **Settings** → **Cron Jobs**
2. Click **Add Cron Job**
3. Configure:
   - **Name**: `send-hourly-reminders`
   - **Schedule**: `0 * * * *` (every hour at minute 0)
   - **Command**: `npm run cron:hourly-reminders`
   - **Service**: Select your main app service
   - **Timeout**: `300` (5 minutes)

#### Weekly Digest Job

1. Click **Add Cron Job**
2. Configure:
   - **Name**: `send-weekly-digest`
   - **Schedule**: `0 10 * * 1` (Mondays at 10 AM UTC)
   - **Command**: `npm run cron:weekly-digest`
   - **Service**: Select your main app service
   - **Timeout**: `600` (10 minutes)

### 3. Environment Variables

Ensure these are set in Railway:

```env
# Database
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb://...
REDIS_URL=redis://...

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

### 4. Database Migration

Run the migration to add reminder tables:

```bash
# In Railway shell or deployment command
npx prisma migrate deploy
```

## Cron Expression Reference

Railway uses standard cron expressions:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Common Schedules

- `0 * * * *` - Every hour at minute 0
- `*/15 * * * *` - Every 15 minutes
- `0 9 * * *` - Daily at 9 AM UTC
- `0 10 * * 1` - Weekly on Monday at 10 AM UTC
- `0 0 1 * *` - Monthly on the 1st at midnight

## Scripts

### Hourly Reminders (`src/cron/send-review-reminders.ts`)

```typescript
// Executes every hour
// Checks all users and schedules reminders for those whose
// preferred time matches the current hour in their timezone
```

Key features:
- Timezone-aware scheduling
- Prevents duplicate sends
- Adds random delay (0-10 min) to spread load
- Logs all operations

### Weekly Digest (`src/cron/send-weekly-digests.ts`)

```typescript
// Executes weekly (Monday 10 AM UTC)
// Sends weekly summary emails to subscribed users
```

Key features:
- Checks last sent timestamp
- Spreads sends over 1 hour
- Includes week stats

## Monitoring

### View Cron Job Logs

In Railway dashboard:
1. Go to your service
2. Click **Deployments**
3. Select a deployment
4. Click **View Logs**
5. Filter by: `cron`

### Check Job Status

```sql
-- Recent reminder logs
SELECT * FROM "ReminderLog" 
ORDER BY "sentAt" DESC 
LIMIT 20;

-- Failed reminders
SELECT * FROM "ReminderLog" 
WHERE status = 'failed' 
ORDER BY "sentAt" DESC;

-- User preferences
SELECT * FROM "UserReminderPreferences"
WHERE enabled = true;
```

### Monitor Queue

Check Redis queue status:

```bash
# In Railway shell
redis-cli
> LLEN bull:review-reminders:wait
> LLEN bull:review-reminders:active
> LLEN bull:review-reminders:failed
```

## Testing

### Local Testing

1. **Test cron script locally**:
   ```bash
   npm run cron:hourly-reminders
   ```

2. **Test with specific user**:
   ```typescript
   // Add to cron script for testing
   if (process.env.TEST_USER_ID) {
     usersWithPrefs = usersWithPrefs.filter(
       u => u.userId === process.env.TEST_USER_ID
     );
   }
   ```

3. **Force run for current hour**:
   ```bash
   # Temporarily modify user's reminder time to current hour
   UPDATE "UserReminderPreferences" 
   SET "reminderTime" = '14:00' 
   WHERE "userId" = 'xxx';
   ```

### Production Testing

1. **Manual trigger in Railway**:
   - Go to Cron Jobs
   - Click **Run Now** on any job
   - Check logs for output

2. **Verify emails sent**:
   - Check Resend dashboard
   - Query ReminderLog table
   - Check user received email

## Troubleshooting

### Jobs Not Running

1. **Check cron schedule**:
   - Verify cron expression is correct
   - Check Railway timezone (UTC by default)

2. **Check service health**:
   - Ensure main service is running
   - Check for deployment errors

3. **Check logs**:
   ```bash
   railway logs --filter="cron"
   ```

### Emails Not Sending

1. **Check queue processing**:
   - Verify worker service is running
   - Check for failed jobs in queue

2. **Check Resend**:
   - Verify API key is correct
   - Check Resend dashboard for errors
   - Verify sender domain

3. **Check user preferences**:
   ```sql
   SELECT * FROM "UserReminderPreferences"
   WHERE "userId" = 'xxx';
   ```

### Duplicate Emails

1. **Check lastDailyReminder**:
   ```sql
   SELECT "userId", "lastDailyReminder" 
   FROM "UserReminderPreferences"
   WHERE "lastDailyReminder" IS NOT NULL
   ORDER BY "lastDailyReminder" DESC;
   ```

2. **Ensure single cron job**:
   - Check Railway dashboard for duplicate jobs
   - Verify only one instance running

## Performance

### Optimization Tips

1. **Batch processing**: Current setup adds random delays to spread load
2. **Database indexes**: Ensure indexes on:
   - `UserReminderPreferences.enabled`
   - `UserReminderPreferences.reminderTime`
3. **Queue configuration**: Adjust concurrency in worker based on load

### Scaling

For 10,000+ users:
1. **Increase worker replicas**: Scale worker service horizontally
2. **Adjust delays**: Increase random delay range in cron scripts
3. **Rate limiting**: Add Resend rate limiting in email service
4. **Database pooling**: Configure connection pooling

## Cost Considerations

Railway cron jobs are billed based on:
- **Execution time**: Billed per second of runtime
- **Memory usage**: Based on service configuration
- **Frequency**: More frequent = higher cost

Optimization:
- Keep cron scripts lightweight (query and queue only)
- Process heavy work in persistent workers
- Use appropriate timeouts

## Security

1. **Environment variables**: Never commit credentials
2. **Database access**: Use read replicas for queries if available
3. **Rate limiting**: Implement to prevent abuse
4. **Audit logs**: All reminders logged for compliance

## Future Improvements

1. **User preferences UI**: Build settings page for users
2. **A/B testing**: Test optimal reminder times
3. **Smart scheduling**: ML-based optimal send times
4. **Multi-channel**: Add SMS, push notifications
5. **Metrics dashboard**: Track open rates, engagement