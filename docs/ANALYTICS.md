# Analytics Setup

## Current Implementation

### Google Analytics (Marketing Pages Only)
- **Location**: `/src/app/(marketing)/layout.tsx`
- **Measurement ID**: `G-59XYSGXP1S` (configured in `.env`)
- **Pages Tracked**: All marketing pages including:
  - Homepage (`/`)
  - Pricing (`/pricing`)
  - Features (`/features`)
  - How it Works (`/how-it-works`)
  - Science (`/science`)
  - About, Terms, Privacy, etc.

### Why Marketing Pages Only?
Google Analytics is optimized for:
- Marketing funnel analysis
- Traffic source tracking
- Conversion rate optimization
- SEO performance
- Campaign effectiveness

## Recommended: Product Analytics for App

For authenticated pages (`/decks`, `/analytics`, `/settings`, etc.), consider implementing a dedicated product analytics tool like:

### Option 1: Mixpanel
**Best for**: User behavior tracking, cohort analysis, retention metrics
```typescript
// Example implementation in app layout
import mixpanel from 'mixpanel-browser';

mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN);
mixpanel.track('Session Started', {
  userId: session?.user?.id,
  timestamp: new Date()
});
```

### Option 2: PostHog
**Best for**: Self-hosted option, feature flags, session recordings
```typescript
import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST
});
```

### Option 3: Amplitude
**Best for**: Advanced product analytics, behavioral cohorts
```typescript
import * as amplitude from '@amplitude/analytics-browser';

amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_KEY);
```

## Key Metrics to Track

### Marketing (Google Analytics)
- Page views and unique visitors
- Bounce rate and session duration
- Traffic sources (organic, social, direct)
- Conversion funnel (landing → signup)
- Campaign performance

### Product (Mixpanel/PostHog/Amplitude)
- User activation rate
- Feature adoption
- Learning session completion
- Card review patterns
- Retention (D1, D7, D30)
- Character learning velocity
- Deck creation and import rates
- Time spent in flash sessions

## Implementation Notes

1. **Privacy Compliance**: Ensure GDPR/CCPA compliance with cookie consent
2. **Performance**: Analytics scripts are loaded asynchronously
3. **User Privacy**: Consider allowing users to opt-out in settings
4. **Data Retention**: Define clear data retention policies

## Environment Variables

```bash
# Google Analytics (Marketing)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Product Analytics (when implemented)
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token_here
# OR
NEXT_PUBLIC_POSTHOG_KEY=your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
# OR
NEXT_PUBLIC_AMPLITUDE_KEY=your_key_here
```