# API Cost Breakdown for Danbing

## Executive Summary

This document provides a comprehensive breakdown of API costs for the Danbing platform. Based on usage patterns and current pricing (December 2024), we estimate:

- **Cost per user per month**: $0.15 - $0.45 (depending on activity)
- **Cost per 1000 characters enriched**: ~$0.80
- **Monthly cost for 1000 active users**: ~$300-450

## API Services Overview

### 1. OpenAI API (GPT-4o-mini)
- **Used for**: Character analysis, mnemonic generation, image search query optimization
- **Model**: gpt-4o-mini (most cost-effective)
- **Pricing**: $0.15 per 1M input tokens, $0.60 per 1M output tokens

### 2. Azure Text-to-Speech
- **Used for**: Taiwan Mandarin audio generation
- **Voice**: zh-TW-HsiaoChenNeural or zh-TW-YunJheNeural
- **Pricing**: $1 per 1M characters

### 3. OpenAI DALL-E 3
- **Used for**: AI-generated images for all characters
- **Pricing**: $0.04 per image (1024x1024)

### 4. Cloudflare R2
- **Used for**: Media storage (images and audio)
- **Pricing**: 
  - Storage: $0.015 per GB/month
  - Operations: $0.36 per million Class A operations
  - Bandwidth: FREE (zero egress fees)

### 5. MongoDB Atlas (if using cloud)
- **Used for**: Database
- **Pricing**: Starting at $57/month for M10 cluster

### 6. Redis Cloud
- **Used for**: Job queues and caching
- **Pricing**: Starting at $7/month for 100MB

## Detailed Cost Analysis

### Per Character Enrichment Cost

When a new character is added to the system:

1. **Dictionary Lookup**: FREE (using local CC-CEDICT)
2. **OpenAI Analysis** (if not cached):
   - Input: ~500 tokens (prompt + context)
   - Output: ~300 tokens (analysis response)
   - Cost: (500 × $0.15 + 300 × $0.60) / 1,000,000 = **$0.000255**
3. **Image Search Query** (OpenAI):
   - Input: ~200 tokens
   - Output: ~50 tokens
   - Cost: (200 × $0.15 + 50 × $0.60) / 1,000,000 = **$0.00006**
4. **TTS Audio Generation**:
   - Average 2 characters per word
   - Cost: 2 × $1 / 1,000,000 = **$0.000002**
5. **DALL-E Image** (100% of characters):
   - Cost: $0.04 = **$0.04**
6. **Storage** (R2):
   - Image: ~200KB
   - Audio: ~50KB
   - Total: 250KB = 0.00025GB
   - Monthly cost: 0.00025 × $0.015 = **$0.00000375**

**Total per character**: ~$0.040317 (mostly from DALL-E)

### Per User Monthly Cost

Assuming typical user behavior:

1. **New Characters** (50/month):
   - 50 × $0.040317 = **$2.016**
2. **Character Insights** (100 views/month):
   - Mostly cached, ~10% need OpenAI
   - 10 × $0.000255 = **$0.00255**
3. **Storage** (accumulated):
   - ~10MB of personal data
   - Cost: negligible
4. **Database operations**: ~$0.05

**Total per active user**: ~$2.07/month

### Cost Optimization Strategies

#### 1. Caching Strategy
- **Character Analysis**: Cache for 90 days (reduces OpenAI calls by ~95%)
- **Images**: Cache permanently (one-time cost)
- **Audio**: Cache permanently (one-time cost)
- **Estimated savings**: 90% reduction in API costs

#### 2. Batch Processing
- Group OpenAI requests when possible
- Use batch TTS generation
- **Estimated savings**: 20% reduction in per-request overhead

#### 3. Smart Image Selection
- Use DALL-E for all characters to ensure consistent quality
- Cache generated images permanently
- **Current ratio**: 100% DALL-E
- **Potential optimization**: Batch generate common characters

#### 4. Tiered Service Levels
- Free tier: Limited enrichments per day
- Premium tier: Unlimited enrichments
- **Suggested limits**: 20 characters/day free, unlimited premium

## Monthly Cost Projections

### Small Scale (100 active users)
- API costs: 100 × $2.07 = **$207**
- MongoDB Atlas: **$57** (M10)
- Redis Cloud: **$7**
- R2 Storage (10GB): **$0.15**
- **Total**: ~$271/month

### Medium Scale (1,000 active users)
- API costs: 1,000 × $2.07 = **$2,070**
- MongoDB Atlas: **$189** (M30)
- Redis Cloud: **$48** (1GB)
- R2 Storage (100GB): **$1.50**
- **Total**: ~$2,308/month

### Large Scale (10,000 active users)
- API costs: 10,000 × $2.07 = **$20,700**
- MongoDB Atlas: **$730** (M50)
- Redis Cloud: **$299** (10GB)
- R2 Storage (1TB): **$15**
- **Total**: ~$21,744/month

## Cost Monitoring Implementation

### 1. Usage Tracking
```typescript
// Track API usage per user
interface ApiUsage {
  userId: string;
  service: 'openai' | 'azure-tts' | 'dalle';
  tokens?: number;
  cost: number;
  timestamp: Date;
}
```

### 2. Budget Alerts
- Set up alerts at 80% of monthly budget
- Auto-throttle at 100% of budget
- Premium users exempt from throttling

### 3. Cost Dashboard
- Real-time cost tracking
- Per-user cost analysis
- Service-by-service breakdown

## Recommendations

### Immediate Actions
1. **Implement caching aggressively** - 90% cost reduction
2. **Set up usage monitoring** - Track costs per user
3. **Create free tier limits** - 20 enrichments/day

### Short-term Optimizations
1. **Batch API requests** - 20% cost reduction
2. **Optimize DALL-E usage** - Use only when necessary
3. **Implement request queuing** - Smooth out API rate limits

### Long-term Strategy
1. **Negotiate volume discounts** - At 10k+ users
2. **Build own TTS service** - Potential 80% cost savings
3. **Pre-generate common content** - Reduce per-user costs

## Break-even Analysis

Assuming $9.99/month premium subscription:

- **Free users**: 20 enrichments/day = ~$0.81/month cost
- **Premium users**: Unlimited = ~$2.07/month cost
- **Break-even**: Need higher premium conversion rate

At 1,000 total users:
- 850 free users × $0.81 = $688.50
- 150 premium users × $9.99 = $1,498.50 revenue
- Infrastructure costs = $238
- API costs total = $688.50 + (150 × $2.07) = $999
- **Net profit**: ~$261.50/month

Note: Consider raising premium price to $14.99 for better margins

## Conclusion

The API costs for Danbing are manageable and scale linearly with usage. The key to profitability is:

1. **Aggressive caching** - Reduces costs by 90%
2. **Smart tiering** - Free users limited, premium unlimited
3. **Efficient enrichment** - Batch processing and smart source selection

With proper optimization, the platform can be profitable at just 15% premium conversion rate.