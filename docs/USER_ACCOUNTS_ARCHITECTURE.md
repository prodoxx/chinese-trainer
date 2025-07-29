# User Accounts Architecture

## Overview

Danbing is a cloud-based Traditional Chinese learning platform with full user account support, enabling personalized learning experiences and progress tracking across devices.

## Authentication System

### Technology Stack
- **Next.js App Router** with server-side authentication
- **MongoDB** for user data storage
- **JWT** or session-based authentication (to be implemented)
- **OAuth providers** (future: Google, GitHub)

### User Model

```typescript
interface IUser {
  _id: ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  preferences: {
    dailyGoal: number;
    reminderTime?: string;
    theme: 'light' | 'dark';
    reduceMotion: boolean;
  };
  subscription?: {
    plan: 'free' | 'premium';
    expiresAt?: Date;
  };
}
```

## Data Isolation

### User-Specific Data

1. **Decks**
   - Each deck has a `userId` field
   - Users can only access their own decks
   - Future: Shared/public decks with permissions

2. **Reviews**
   - Reviews are user-specific (same card can have different progress for different users)
   - Schema includes both `userId` and `cardId`

3. **Sessions**
   - Study sessions are tied to specific users
   - Analytics are calculated per user

### Shared Resources

1. **Cards**
   - Character cards are shared across all users (to avoid duplication)
   - Enrichment data (images, audio, linguistic analysis) is shared
   - Reduces storage and API costs

2. **Dictionary**
   - CC-CEDICT data is global
   - All users access the same dictionary

3. **Character Analysis Cache**
   - OpenAI analysis results are cached globally
   - Benefits all users and reduces API costs

## API Security

### Authentication Middleware

```typescript
// Example middleware pattern
export async function withAuth(handler: Function) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, session);
  };
}
```

### Protected Routes

All API routes should validate user ownership:
- `/api/decks/*` - Verify deck belongs to user
- `/api/reviews/*` - Ensure reviews are user-specific
- `/api/sessions/*` - Validate session ownership

## Database Queries

### User Context

All queries must include user context:

```typescript
// Instead of:
const decks = await Deck.find({});

// Use:
const decks = await Deck.find({ userId: session.userId });
```

### Indexes

Optimize for user-based queries:
```typescript
// Compound indexes for performance
DeckSchema.index({ userId: 1, updatedAt: -1 });
ReviewSchema.index({ userId: 1, cardId: 1 }, { unique: true });
SessionSchema.index({ userId: 1, completedAt: -1 });
```

## Privacy Considerations

### Data Segregation
- User data is strictly isolated
- No cross-user data leakage
- Admin tools require separate authentication

### GDPR Compliance (Future)
- User data export functionality
- Account deletion with data purge
- Privacy settings management

## Rate Limiting

### Per-User Limits
- API calls: 1000/hour for free tier
- Enrichment: 100 cards/day for free tier
- OpenAI requests: 50/day for free tier

### Implementation
```typescript
const rateLimiter = new Map<string, { count: number; resetAt: Date }>();

export function checkRateLimit(userId: string, limit: number): boolean {
  // Implementation details
}
```

## Session Management

### Session Storage
- Server-side sessions with Redis (future)
- JWT tokens with refresh mechanism
- Secure cookie configuration

### Multi-Device Support
- Sessions persist across devices
- Real-time sync for study progress
- Conflict resolution for simultaneous sessions

## Future Enhancements

### Social Features
1. **Deck Sharing**
   - Public deck marketplace
   - Private sharing with friends
   - Collaborative deck editing

2. **Leaderboards**
   - Weekly/monthly challenges
   - Progress comparison
   - Achievement system

### Premium Features
1. **Advanced Analytics**
   - Detailed learning insights
   - Progress predictions
   - Custom reports

2. **Unlimited Resources**
   - No rate limits
   - Priority enrichment queue
   - Advanced AI features

## Migration from Local-Only

### Data Migration Steps
1. Add `userId` to existing collections
2. Create user registration flow
3. Implement authentication middleware
4. Update all queries to be user-scoped
5. Add privacy controls

### Backward Compatibility
- Guest mode for trying the app
- Local data import for existing users
- Progressive enhancement approach

## Security Best Practices

1. **Password Security**
   - Bcrypt for password hashing
   - Minimum password requirements
   - Password reset via email

2. **Session Security**
   - HTTPS only
   - Secure cookie flags
   - CSRF protection

3. **Data Validation**
   - Input sanitization
   - SQL injection prevention
   - XSS protection

## Monitoring and Analytics

### User Metrics
- Active users (DAU/MAU)
- Retention rates
- Feature usage
- Learning outcomes

### System Metrics
- API response times
- Error rates
- Resource usage per user
- Cost per user

## Conclusion

The transition to a cloud-based, multi-user architecture enables Danbing to scale while maintaining performance and security. User isolation ensures privacy, while shared resources optimize costs and performance.