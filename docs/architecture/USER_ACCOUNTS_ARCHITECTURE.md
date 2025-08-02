# User Accounts Architecture

## Overview

Danbing is a cloud-based Traditional Chinese learning platform with full user account support, enabling personalized learning experiences and progress tracking across devices.

## Authentication System

### Technology Stack
- **Next.js 15.4.4 App Router** with server-side authentication
- **NextAuth.js v4** for comprehensive authentication management
- **PostgreSQL with Prisma** for user authentication data
- **MongoDB** for learning data (cards, decks, reviews)
- **Resend** for email delivery (verification, password reset)
- **OAuth providers** (future: Google, GitHub integration ready)

### User Model (Prisma Schema)

```typescript
// PostgreSQL via Prisma (NextAuth.js tables)
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Hashed with bcryptjs
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // NextAuth.js relationships
  accounts      Account[]
  sessions      Session[]
  
  // User preferences (stored in PostgreSQL)
  showFlashDemo Boolean   @default(true)
  reduceMotion  Boolean   @default(false)
  brightness    Float     @default(1.0)
}

enum Role {
  USER
  ADMIN
}

// MongoDB user reference (learning data)
interface MongoUserData {
  userId: string;        // References Prisma User.id
  decks: ObjectId[];     // User's deck ownership
  preferences: {
    dailyGoal: number;
    reminderTime?: string;
    theme: 'light' | 'dark';
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

### Authentication Implementation

```typescript
// NextAuth.js configuration
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user || !user.password) return null
        
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        
        // Check email verification
        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in')
        }
        
        return { id: user.id, email: user.email, name: user.name }
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
}

// API route protection
import { getServerSession } from 'next-auth'

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}
```

### Protected Routes

All API routes validate user authentication and ownership:
- `/api/decks/*` - Verify deck belongs to authenticated user
- `/api/reviews/*` - Ensure reviews are user-specific
- `/api/user/*` - User settings and preferences
- `/api/analytics/*` - User-specific analytics data
- Auto-redirect unauthenticated users to `/auth/signin`

## Email Verification System

### Resend Integration
```typescript
// Email verification flow
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, token: string) {
  await resend.emails.send({
    from: 'Danbing AI <noreply@transactional.danbing.ai>',
    to: email,
    subject: 'Verify your email address',
    html: generateVerificationEmailHTML(token)
  })
}

// Password reset flow
export async function sendPasswordResetEmail(email: string, token: string) {
  await resend.emails.send({
    from: 'Danbing AI <noreply@transactional.danbing.ai>',
    to: email,
    subject: 'Reset your password',
    html: generatePasswordResetEmailHTML(token)
  })
}
```

### Email Features
- **Branded Templates**: Custom HTML templates with Danbing mascot and styling
- **Verification Required**: Users must verify email before accessing the app
- **Password Reset**: Secure token-based password reset flow
- **Resend Functionality**: Users can request new verification emails
- **Rate Limiting**: Prevents email spam (3 emails per hour per user)

## Database Queries

### Dual Database Architecture

```typescript
// PostgreSQL (via Prisma) - Authentication data
const user = await prisma.user.findUnique({
  where: { email: session.user.email }
})

// MongoDB (via Mongoose) - Learning data  
const decks = await Deck.find({ userId: session.user.id })
const reviews = await Review.find({ userId: session.user.id })

// Always validate user ownership
export async function getUserDecks(userId: string) {
  return await Deck.find({ userId }).sort({ updatedAt: -1 })
}

export async function getUserReviews(userId: string, cardIds: string[]) {
  return await Review.find({ 
    userId, 
    cardId: { $in: cardIds } 
  })
}
```

### Database Indexes (MongoDB)

Optimized for user-scoped queries:
```typescript
// User-based compound indexes
DeckSchema.index({ userId: 1, updatedAt: -1 })
ReviewSchema.index({ userId: 1, cardId: 1 }, { unique: true })
StudySessionSchema.index({ userId: 1, completedAt: -1 })

// PostgreSQL indexes handled by Prisma
// @@index([email]) - Automatic for @unique
// @@index([emailVerified]) - For verification queries  
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

### NextAuth.js Session Strategy
- **JWT Strategy**: Stateless tokens for scalability
- **Secure Cookies**: HttpOnly, Secure, SameSite protection
- **Session Persistence**: 30-day expiration with automatic refresh
- **PostgreSQL Storage**: Session and account data via Prisma adapter

### Multi-Device Support
- **Cross-Device Sessions**: JWT tokens work across all devices
- **Real-time Progress Sync**: MongoDB ensures latest learning progress
- **Conflict Resolution**: Last-write-wins for simultaneous study sessions
- **Seamless Authentication**: Session validation on every API request

### Session Security
```typescript
// NextAuth.js secure configuration
export const authOptions = {
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}
```

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