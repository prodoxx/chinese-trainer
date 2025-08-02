# API Documentation

## Overview

This document provides a comprehensive reference for all API endpoints in the Danbing platform. All API routes are implemented using Next.js App Router and require authentication unless otherwise specified.

## Base URL

```
Production: https://api.danbing.ai
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via NextAuth.js JWT tokens. Include the session cookie or Authorization header:

```typescript
// Cookie-based (automatic in browser)
Cookie: __Secure-next-auth.session-token=...

// Header-based (for API clients)
Authorization: Bearer <jwt-token>
```

## API Endpoints

### Authentication APIs

#### POST `/api/auth/signup`
Create a new user account.

**Public Endpoint**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

---

#### POST `/api/auth/verify-email`
Verify user email address with token.

**Public Endpoint**

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

#### POST `/api/auth/resend-verification`
Resend verification email (rate limited: 3 per hour).

**Public Endpoint**

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

#### POST `/api/auth/forgot-password`
Request password reset email.

**Public Endpoint**

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}
```

---

#### POST `/api/auth/reset-password`
Reset password with token.

**Public Endpoint**

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Deck Management APIs

#### GET `/api/decks`
Get all decks for authenticated user.

**Authentication Required**

**Response:**
```json
{
  "decks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "HSK 1 Vocabulary",
      "userId": "user123",
      "cardCount": 150,
      "newCount": 50,
      "dueCount": 10,
      "learnedCount": 90,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  ]
}
```

---

#### POST `/api/decks`
Create a new deck.

**Authentication Required**

**Request Body:**
```json
{
  "name": "My First Deck"
}
```

**Response:**
```json
{
  "success": true,
  "deck": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "My First Deck",
    "userId": "user123",
    "cards": [],
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

---

#### GET `/api/decks/[deckId]`
Get specific deck details.

**Authentication Required**

**Response:**
```json
{
  "deck": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "HSK 1 Vocabulary",
    "cards": ["cardId1", "cardId2", ...],
    "stats": {
      "totalCards": 150,
      "newCards": 50,
      "dueCards": 10,
      "learnedCards": 90
    }
  }
}
```

---

#### PUT `/api/decks/[deckId]`
Update deck (name, settings).

**Authentication Required**

**Request Body:**
```json
{
  "name": "Updated Deck Name"
}
```

**Response:**
```json
{
  "success": true,
  "deck": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Deck Name",
    "updatedAt": "2024-01-20T16:00:00Z"
  }
}
```

---

#### DELETE `/api/decks/[deckId]`
Delete a deck and all associated data.

**Authentication Required**

**Response:**
```json
{
  "success": true,
  "message": "Deck deleted successfully"
}
```

---

#### POST `/api/decks/import`
Import CSV deck with automatic enrichment.

**Authentication Required**

**Request Body (FormData):**
```
file: deck.csv
name: "Deck Name"
```

**Response:**
```json
{
  "success": true,
  "deckId": "507f1f77bcf86cd799439011",
  "sessionId": "import-session-123",
  "message": "Deck import started"
}
```

**CSV Format:**
```csv
你
好
世界
```

---

#### GET `/api/decks/[deckId]/stats`
Get detailed deck statistics.

**Authentication Required**

**Response:**
```json
{
  "stats": {
    "totalCards": 150,
    "dueToday": 15,
    "overdue": 5,
    "learning": 20,
    "mature": 100,
    "averageEase": 2.5,
    "averageStrength": 0.85,
    "nextReviewDate": "2024-01-21T09:00:00Z"
  },
  "cardsForReview": [...],
  "heatMapData": {
    "2024-01-20": 10,
    "2024-01-19": 15,
    ...
  }
}
```

---

#### POST `/api/decks/[deckId]/re-enrich`
Re-enrich all cards in deck with latest AI insights.

**Authentication Required**

**Response:**
```json
{
  "success": true,
  "message": "Deck re-enrichment started",
  "jobId": "enrich-job-123"
}
```

### Card Management APIs

#### GET `/api/cards/[deckId]`
Get all cards for a deck.

**Authentication Required**

**Query Parameters:**
- `mode`: `new` | `review` | `practice` (default: all cards)
- `limit`: number (default: no limit, new/review modes limited to 8)

**Response:**
```json
{
  "cards": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "hanzi": "愛",
      "pinyin": "ài",
      "meaning": "love",
      "imageUrl": "https://media.danbing.ai/media/hanzi/%E6%84%9B/image.jpg",
      "audioUrl": "https://media.danbing.ai/media/hanzi/%E6%84%9B/audio.mp3",
      "aiInsights": {
        "etymology": {...},
        "mnemonics": {...},
        "commonErrors": {...},
        "usage": {...},
        "learningTips": {...}
      },
      "aiInsightsGeneratedAt": "2024-01-20T10:00:00Z"
    }
  ],
  "totalCards": 150,
  "mode": "new"
}
```

---

#### POST `/api/cards/mark-studied`
Mark cards as studied after flash session.

**Authentication Required**

**Request Body:**
```json
{
  "deckId": "507f1f77bcf86cd799439011",
  "cardIds": ["cardId1", "cardId2", ...]
}
```

**Response:**
```json
{
  "success": true,
  "markedCount": 8
}
```

---

#### POST `/api/cards/re-enrich-single`
Re-enrich a single card with force refresh.

**Authentication Required**

**Request Body:**
```json
{
  "cardId": "507f1f77bcf86cd799439013",
  "deckId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card enrichment started",
  "jobId": "card-enrich-123"
}
```

---

#### GET `/api/cards/confused-characters`
Get commonly confused characters for quiz generation.

**Authentication Required**

**Query Parameters:**
- `hanzi`: The character to find confusions for

**Response:**
```json
{
  "confusedCharacters": [
    {
      "character": "受",
      "pinyin": "shòu",
      "meaning": "receive",
      "confusionScore": 0.8
    },
    {
      "character": "愛",
      "pinyin": "ài",
      "meaning": "love (simplified)",
      "confusionScore": 0.65
    }
  ]
}
```

### Review & Learning APIs

#### POST `/api/reviews/submit`
Submit quiz results and update spaced repetition.

**Authentication Required**

**Request Body:**
```json
{
  "reviews": [
    {
      "cardId": "507f1f77bcf86cd799439013",
      "deckId": "507f1f77bcf86cd799439011",
      "correct": true,
      "responseTimeMs": 2500,
      "timedOut": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 8,
  "nextReview": {
    "507f1f77bcf86cd799439013": "2024-01-21T09:00:00Z"
  }
}
```

### Analytics APIs

#### POST `/api/analytics/character-insights`
Get deep AI-powered character analysis.

**Authentication Required**

**Request Body:**
```json
{
  "characterId": "507f1f77bcf86cd799439013",
  "includeAI": true
}
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "character": {
      "hanzi": "愛",
      "pinyin": "ài",
      "meaning": "love",
      "imageUrl": "https://media.danbing.ai/..."
    },
    "complexity": {
      "overallDifficulty": 0.82,
      "visualComplexity": 0.65,
      "strokeCount": 13,
      "componentCount": 4,
      "semanticCategory": "emotion",
      "concreteAbstract": "abstract",
      "tonePattern": "4"
    },
    "reviewHistory": {
      "seen": 12,
      "correct": 10,
      "accuracy": 83.33,
      "avgResponseMs": 2300,
      "lastReviewedAt": "2024-01-19T10:00:00Z",
      "nextDue": "2024-01-21T09:00:00Z",
      "difficulty": 2.1
    },
    "confusionAnalysis": [...],
    "aiInsights": {
      "etymology": {...},
      "mnemonics": {...},
      "commonErrors": {...},
      "usage": {...},
      "learningTips": {...}
    }
  }
}
```

---

#### GET `/api/analytics`
Get user's overall learning analytics.

**Authentication Required**

**Response:**
```json
{
  "analytics": {
    "totalCardsLearned": 250,
    "totalDecks": 5,
    "currentStreak": 7,
    "longestStreak": 21,
    "averageAccuracy": 0.87,
    "studyTime": {
      "today": 1800000,
      "thisWeek": 12600000,
      "total": 86400000
    },
    "progressByDeck": [...],
    "learningCurve": [...],
    "dailyActivity": {...}
  }
}
```

### User Settings APIs

#### GET `/api/user/settings`
Get user preferences and settings.

**Authentication Required**

**Response:**
```json
{
  "settings": {
    "showFlashDemo": true,
    "reduceMotion": false,
    "brightness": 1.0,
    "theme": "dark",
    "dailyGoal": 20,
    "reminderTime": "09:00"
  }
}
```

---

#### PUT `/api/user/settings`
Update user settings.

**Authentication Required**

**Request Body:**
```json
{
  "showFlashDemo": false,
  "reduceMotion": true,
  "brightness": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "settings": {...}
}
```

---

#### PUT `/api/user/settings/flash-demo`
Toggle flash session demo preference.

**Authentication Required**

**Request Body:**
```json
{
  "showDemo": false
}
```

**Response:**
```json
{
  "success": true,
  "showDemo": false
}
```

### Media APIs

#### GET `/api/media/[...path]`
Serve media files from R2 storage.

**Public Endpoint** (for cached media URLs)

**Example:**
```
GET /api/media/hanzi/%E6%84%9B/audio.mp3
GET /api/media/hanzi/%E6%84%9B/image.jpg
```

**Response:**
- Binary media file with appropriate Content-Type
- Cache-Control headers for CDN optimization

### Background Job APIs

#### GET `/api/jobs/[jobId]/status`
Check background job status (enrichment, import).

**Authentication Required**

**Response:**
```json
{
  "job": {
    "id": "import-job-123",
    "type": "deck-import",
    "status": "active",
    "progress": 75,
    "data": {
      "totalCards": 100,
      "processedCards": 75,
      "currentCard": "世"
    },
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:05:00Z"
  }
}
```

### Server-Sent Events (SSE)

#### GET `/api/events/[sessionId]`
Real-time progress updates for import/enrichment.

**Authentication Required**

**Response:** Server-Sent Events stream
```
event: progress
data: {"progress": 25, "current": "你", "total": 4}

event: progress
data: {"progress": 50, "current": "好", "total": 4}

event: complete
data: {"success": true, "deckId": "507f1f77bcf86cd799439011"}
```

### Health Check APIs

#### GET `/api/health`
Check API and service health.

**Public Endpoint**

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "r2": "connected",
    "openai": "available",
    "resend": "available"
  },
  "timestamp": "2024-01-20T10:00:00Z"
}
```

---

#### GET `/api/ping`
Simple ping endpoint.

**Public Endpoint**

**Response:**
```json
{
  "message": "pong",
  "timestamp": "2024-01-20T10:00:00Z"
}
```

## Error Handling

All endpoints follow a consistent error response format:

### Error Response Structure
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE", // Optional error code
  "details": {} // Optional additional details
}
```

### Common HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Conflict (e.g., duplicate email)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Codes
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks permission
- `NOT_FOUND`: Resource doesn't exist
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `EMAIL_NOT_VERIFIED`: Email verification required
- `ENRICHMENT_FAILED`: Card enrichment error
- `PAYMENT_REQUIRED`: Premium feature (future)

## Rate Limiting

### Default Limits
- **General API**: 1000 requests/hour per user
- **Enrichment**: 100 cards/day for free tier
- **Email sending**: 3 emails/hour per user
- **OpenAI requests**: 50/day for free tier

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642680000
```

### Rate Limit Response
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 1000,
    "reset": "2024-01-20T11:00:00Z",
    "retryAfter": 600
  }
}
```

## Webhooks (Future)

### Planned Webhook Events
- `user.created`: New user registration
- `deck.imported`: Deck import completed
- `enrichment.completed`: Card enrichment finished
- `subscription.updated`: Subscription changes

### Webhook Payload Structure
```json
{
  "event": "deck.imported",
  "timestamp": "2024-01-20T10:00:00Z",
  "data": {
    "userId": "user123",
    "deckId": "507f1f77bcf86cd799439011",
    "cardCount": 150
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
class DanbingAPI {
  private baseUrl = 'https://api.danbing.ai';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async getDecks() {
    const response = await fetch(`${this.baseUrl}/decks`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  async importDeck(file: File, name: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    
    const response = await fetch(`${this.baseUrl}/decks/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    
    return response.json();
  }
}
```

### Python
```python
import requests

class DanbingAPI:
    def __init__(self, token):
        self.base_url = 'https://api.danbing.ai'
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def get_decks(self):
        response = requests.get(f'{self.base_url}/decks', headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def submit_reviews(self, reviews):
        response = requests.post(
            f'{self.base_url}/reviews/submit',
            headers=self.headers,
            json={'reviews': reviews}
        )
        response.raise_for_status()
        return response.json()
```

## Best Practices

### Authentication
1. Store tokens securely (HttpOnly cookies in browser)
2. Implement token refresh before expiration
3. Handle 401 responses by redirecting to login

### Error Handling
1. Always check `success` field in responses
2. Implement exponential backoff for retries
3. Log errors for debugging

### Performance
1. Use pagination for large result sets
2. Cache responses where appropriate
3. Batch operations when possible

### Security
1. Always use HTTPS in production
2. Validate all input data
3. Never expose sensitive data in URLs

This comprehensive API documentation covers all current endpoints in the Danbing platform. As new features are added, this documentation will be updated accordingly.