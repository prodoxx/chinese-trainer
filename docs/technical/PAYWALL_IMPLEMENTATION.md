# Paywall Implementation Guide

## Overview

This document outlines the paywall strategy and implementation details for Danbing's subscription tiers. The paywall system enforces feature access based on user subscription status while maintaining a good user experience.

## Subscription Tiers

### 1. Free Trial (14 days)
- Full Pro features
- 2,000 AI credits
- Unlimited character additions
- All study modes
- No credit card required

### 2. Lite (Post-trial, Free)
- Review existing cards only
- Basic spaced repetition (SM-2)
- View progress statistics
- No new character additions
- No AI features
- 0 AI credits

### 3. Student Pro ($9/month, $99/year)
- Everything in Pro
- Requires .edu email verification
- 2,000 AI credits/month
- 2-month credit rollover

### 4. Pro ($14/month, $168/year)
- Unlimited character additions
- 2,000 AI credits/month (~50 new characters)
- Dual-phase flash sessions
- Character insights & AI analysis
- Advanced analytics
- 2-month credit rollover (max 4,000)
- Priority support

### 5. Lifetime ($499 one-time)
- Everything in Pro
- 4,000 AI credits/month (~100 new characters)
- 3-month credit rollover (max 12,000)
- Exclusive content drops
- Early access to features
- VIP status

### 6. Team (Custom pricing)
- Admin dashboard
- Shared decks
- Progress tracking
- 2,000 credits per user
- API access

## Database Schema

### User Subscription Model

```typescript
// Add to Prisma schema
model UserSubscription {
  id                String   @id @default(cuid())
  userId            String   @unique
  plan              String   // 'trial', 'lite', 'student_pro', 'pro', 'lifetime', 'team'
  status            String   // 'active', 'canceled', 'past_due', 'expired', 'on_trial'
  currentPeriodStart DateTime
  currentPeriodEnd  DateTime
  trialEndsAt       DateTime?
  canceledAt        DateTime?
  lemonSqueezyCustomerId String?
  lemonSqueezySubscriptionId String?
  lemonSqueezyVariantId String?
  lemonSqueezyOrderId String?  // For lifetime purchases
  updatePaymentMethodUrl String?
  cancelUrl         String?
  resumeUrl         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserCredits {
  id                String   @id @default(cuid())
  userId            String   @unique
  availableCredits  Int      @default(0)
  monthlyAllocation Int      @default(0)
  rolloverCredits   Int      @default(0)
  lastRefreshedAt   DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model CreditTransaction {
  id                String   @id @default(cuid())
  userId            String
  amount            Int      // Positive for additions, negative for usage
  type              String   // 'monthly_allocation', 'purchase', 'usage', 'rollover'
  description       String
  characterId       String?  // If used for character enrichment
  createdAt         DateTime @default(now())
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Lemon Squeezy Integration

### 1. Configuration

```typescript
// src/lib/lemonsqueezy/config.ts

export const LEMON_SQUEEZY_CONFIG = {
  apiKey: process.env.LEMON_SQUEEZY_API_KEY!,
  storeId: process.env.LEMON_SQUEEZY_STORE_ID!,
  webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!,
  
  // Product variant IDs from Lemon Squeezy dashboard
  variants: {
    pro_monthly: process.env.LS_VARIANT_PRO_MONTHLY!,
    pro_annual: process.env.LS_VARIANT_PRO_ANNUAL!,
    student_monthly: process.env.LS_VARIANT_STUDENT_MONTHLY!,
    student_annual: process.env.LS_VARIANT_STUDENT_ANNUAL!,
    lifetime: process.env.LS_VARIANT_LIFETIME!,
    credits_1000: process.env.LS_VARIANT_CREDITS_1000!,
  }
};
```

### 2. Lemon Squeezy Client

```typescript
// src/lib/lemonsqueezy/client.ts

import { LemonSqueezy } from '@lemonsqueezy/lemonsqueezy.js';

const ls = new LemonSqueezy(LEMON_SQUEEZY_CONFIG.apiKey);

export class LemonSqueezyService {
  static async createCheckoutUrl(
    userId: string,
    userEmail: string,
    variantId: string,
    isStudentPlan = false
  ) {
    const checkout = await ls.createCheckout({
      store: LEMON_SQUEEZY_CONFIG.storeId,
      variant: variantId,
      custom: {
        user_id: userId
      },
      checkout_data: {
        email: userEmail,
        custom: {
          user_id: userId
        }
      },
      checkout_options: {
        // Enable SCA and tax collection
        subscription_preview: true,
        // Student plans require verification
        ...(isStudentPlan && {
          discount_code: 'STUDENT40',
          custom_fields: {
            edu_email: {
              required: true,
              placeholder: 'your.name@university.edu'
            }
          }
        })
      },
      product_options: {
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        enabled_variants: [variantId]
      }
    });
    
    return checkout.data.attributes.url;
  }
  
  static async getSubscription(subscriptionId: string) {
    const subscription = await ls.getSubscription({
      id: subscriptionId
    });
    
    return subscription.data;
  }
  
  static async cancelSubscription(subscriptionId: string) {
    const subscription = await ls.cancelSubscription({
      id: subscriptionId
    });
    
    return subscription.data;
  }
  
  static async resumeSubscription(subscriptionId: string) {
    const subscription = await ls.resumeSubscription({
      id: subscriptionId
    });
    
    return subscription.data;
  }
  
  static async updatePaymentMethod(subscriptionId: string) {
    const subscription = await ls.getSubscription({
      id: subscriptionId
    });
    
    return subscription.data.attributes.urls.update_payment_method;
  }
}
```

### 3. Webhook Handler

```typescript
// src/app/api/webhooks/lemonsqueezy/route.ts

import crypto from 'crypto';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('x-signature');
  const secret = LEMON_SQUEEZY_CONFIG.webhookSecret;
  
  // Verify webhook signature
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  if (hash !== signature) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(body);
  const { meta, data } = event;
  
  try {
    switch (meta.event_name) {
      case 'subscription_created':
        await handleSubscriptionCreated(data);
        break;
        
      case 'subscription_updated':
        await handleSubscriptionUpdated(data);
        break;
        
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(data);
        break;
        
      case 'subscription_resumed':
        await handleSubscriptionResumed(data);
        break;
        
      case 'subscription_expired':
        await handleSubscriptionExpired(data);
        break;
        
      case 'subscription_payment_success':
        await handlePaymentSuccess(data);
        break;
        
      case 'subscription_payment_failed':
        await handlePaymentFailed(data);
        break;
        
      case 'order_created':
        // Handle one-time purchases (lifetime, credits)
        await handleOrderCreated(data);
        break;
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}

async function handleSubscriptionCreated(data: any) {
  const { 
    id,
    attributes: {
      user_email,
      user_name,
      status,
      renews_at,
      ends_at,
      trial_ends_at,
      variant_id,
      customer_id,
      urls
    },
    meta: {
      custom_data: { user_id }
    }
  } = data;
  
  // Map variant ID to plan
  const plan = mapVariantToPlan(variant_id);
  
  // Create or update subscription
  await prisma.userSubscription.upsert({
    where: { userId: user_id },
    update: {
      plan,
      status: mapLemonSqueezyStatus(status),
      lemonSqueezySubscriptionId: id,
      lemonSqueezyCustomerId: customer_id,
      lemonSqueezyVariantId: variant_id,
      currentPeriodEnd: new Date(renews_at || ends_at),
      trialEndsAt: trial_ends_at ? new Date(trial_ends_at) : null,
      updatePaymentMethodUrl: urls.update_payment_method,
      cancelUrl: urls.customer_portal
    },
    create: {
      userId: user_id,
      plan,
      status: mapLemonSqueezyStatus(status),
      lemonSqueezySubscriptionId: id,
      lemonSqueezyCustomerId: customer_id,
      lemonSqueezyVariantId: variant_id,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(renews_at || ends_at),
      trialEndsAt: trial_ends_at ? new Date(trial_ends_at) : null,
      updatePaymentMethodUrl: urls.update_payment_method,
      cancelUrl: urls.customer_portal
    }
  });
  
  // Initialize credits for new subscription
  if (plan !== 'lite') {
    await CreditService.initializeCredits(user_id);
  }
  
  // Send welcome email
  await sendWelcomeEmail(user_email, user_name, plan);
}

async function handleOrderCreated(data: any) {
  const {
    id,
    attributes: {
      total,
      status,
      first_order_item: {
        variant_id,
        product_name
      }
    },
    meta: {
      custom_data: { user_id }
    }
  } = data;
  
  // Handle lifetime purchase
  if (variant_id === LEMON_SQUEEZY_CONFIG.variants.lifetime) {
    await prisma.userSubscription.upsert({
      where: { userId: user_id },
      update: {
        plan: 'lifetime',
        status: 'active',
        lemonSqueezyOrderId: id,
        currentPeriodEnd: new Date('2099-12-31') // Lifetime
      },
      create: {
        userId: user_id,
        plan: 'lifetime',
        status: 'active',
        lemonSqueezyOrderId: id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date('2099-12-31')
      }
    });
  }
  
  // Handle credit purchases
  if (variant_id === LEMON_SQUEEZY_CONFIG.variants.credits_1000) {
    await CreditService.addCredits(
      user_id,
      1000,
      'purchase',
      `Credit pack purchase (Order ${id})`
    );
  }
}

function mapVariantToPlan(variantId: string): string {
  const variantMap: Record<string, string> = {
    [LEMON_SQUEEZY_CONFIG.variants.pro_monthly]: 'pro',
    [LEMON_SQUEEZY_CONFIG.variants.pro_annual]: 'pro',
    [LEMON_SQUEEZY_CONFIG.variants.student_monthly]: 'student_pro',
    [LEMON_SQUEEZY_CONFIG.variants.student_annual]: 'student_pro',
    [LEMON_SQUEEZY_CONFIG.variants.lifetime]: 'lifetime'
  };
  
  return variantMap[variantId] || 'lite';
}

function mapLemonSqueezyStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'on_trial': 'trial',
    'active': 'active',
    'paused': 'paused',
    'past_due': 'past_due',
    'unpaid': 'past_due',
    'cancelled': 'canceled',
    'expired': 'expired'
  };
  
  return statusMap[status] || 'expired';
}
```

### 4. Checkout Implementation

```typescript
// src/app/api/checkout/route.ts

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const { plan, billing } = await request.json();
  
  // Map plan and billing to variant ID
  const variantKey = `${plan}_${billing}` as keyof typeof LEMON_SQUEEZY_CONFIG.variants;
  const variantId = LEMON_SQUEEZY_CONFIG.variants[variantKey];
  
  if (!variantId) {
    return new Response('Invalid plan', { status: 400 });
  }
  
  const checkoutUrl = await LemonSqueezyService.createCheckoutUrl(
    session.user.id,
    session.user.email!,
    variantId,
    plan === 'student_pro'
  );
  
  return Response.json({ url: checkoutUrl });
}
```

### 5. Customer Portal

```typescript
// src/app/api/billing/portal/route.ts

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId: session.user.id }
  });
  
  if (!subscription?.lemonSqueezyCustomerId) {
    return new Response('No subscription found', { status: 404 });
  }
  
  // Get customer portal URL from Lemon Squeezy
  const customer = await ls.getCustomer({
    id: subscription.lemonSqueezyCustomerId
  });
  
  const portalUrl = customer.data.attributes.urls.customer_portal;
  
  return Response.json({ url: portalUrl });
}
```

## Paywall Check Implementation

### 1. Core Paywall Service

```typescript
// src/lib/paywall/paywall-service.ts

export interface SubscriptionFeatures {
  canAddCharacters: boolean;
  canUseAIFeatures: boolean;
  canViewInsights: boolean;
  canExportData: boolean;
  canAccessAnalytics: boolean;
  maxDecks: number;
  maxCardsPerDeck: number;
  creditAllocation: number;
  rolloverMonths: number;
  hasProSupport: boolean;
}

export class PaywallService {
  static async getUserSubscription(userId: string) {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId }
    });
    
    // Check if trial has expired
    if (subscription?.plan === 'trial' && subscription.trialEndsAt < new Date()) {
      // Downgrade to lite
      await this.downgradeToLite(userId);
      return { ...subscription, plan: 'lite' };
    }
    
    return subscription || this.createDefaultSubscription(userId);
  }
  
  static getFeatures(plan: string): SubscriptionFeatures {
    const features: Record<string, SubscriptionFeatures> = {
      trial: {
        canAddCharacters: true,
        canUseAIFeatures: true,
        canViewInsights: true,
        canExportData: true,
        canAccessAnalytics: true,
        maxDecks: -1, // unlimited
        maxCardsPerDeck: -1,
        creditAllocation: 2000,
        rolloverMonths: 0,
        hasProSupport: false
      },
      lite: {
        canAddCharacters: false,
        canUseAIFeatures: false,
        canViewInsights: false,
        canExportData: false,
        canAccessAnalytics: false,
        maxDecks: -1, // can view existing
        maxCardsPerDeck: 0, // can't add new
        creditAllocation: 0,
        rolloverMonths: 0,
        hasProSupport: false
      },
      student_pro: {
        canAddCharacters: true,
        canUseAIFeatures: true,
        canViewInsights: true,
        canExportData: true,
        canAccessAnalytics: true,
        maxDecks: -1,
        maxCardsPerDeck: -1,
        creditAllocation: 2000,
        rolloverMonths: 2,
        hasProSupport: true
      },
      pro: {
        canAddCharacters: true,
        canUseAIFeatures: true,
        canViewInsights: true,
        canExportData: true,
        canAccessAnalytics: true,
        maxDecks: -1,
        maxCardsPerDeck: -1,
        creditAllocation: 2000,
        rolloverMonths: 2,
        hasProSupport: true
      },
      lifetime: {
        canAddCharacters: true,
        canUseAIFeatures: true,
        canViewInsights: true,
        canExportData: true,
        canAccessAnalytics: true,
        maxDecks: -1,
        maxCardsPerDeck: -1,
        creditAllocation: 4000,
        rolloverMonths: 3,
        hasProSupport: true
      }
    };
    
    return features[plan] || features.lite;
  }
}
```

### 2. Credit Management Service

```typescript
// src/lib/paywall/credit-service.ts

export class CreditService {
  static async getUserCredits(userId: string) {
    let credits = await prisma.userCredits.findUnique({
      where: { userId }
    });
    
    if (!credits) {
      credits = await this.initializeCredits(userId);
    }
    
    // Check if monthly refresh is due
    await this.refreshCreditsIfNeeded(userId, credits);
    
    return credits;
  }
  
  static async consumeCredits(userId: string, amount: number, description: string, characterId?: string) {
    const credits = await this.getUserCredits(userId);
    
    if (credits.availableCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    // Deduct credits
    await prisma.userCredits.update({
      where: { userId },
      data: {
        availableCredits: {
          decrement: amount
        }
      }
    });
    
    // Log transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'usage',
        description,
        characterId
      }
    });
    
    return credits.availableCredits - amount;
  }
  
  static async refreshCreditsIfNeeded(userId: string, credits: UserCredits) {
    const subscription = await PaywallService.getUserSubscription(userId);
    const features = PaywallService.getFeatures(subscription.plan);
    
    const now = new Date();
    const lastRefresh = new Date(credits.lastRefreshedAt);
    const daysSinceRefresh = Math.floor((now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24));
    
    // Refresh monthly
    if (daysSinceRefresh >= 30) {
      // Calculate rollover (with limits)
      const maxRollover = features.creditAllocation * features.rolloverMonths;
      const newRollover = Math.min(credits.availableCredits, maxRollover);
      
      await prisma.userCredits.update({
        where: { userId },
        data: {
          availableCredits: features.creditAllocation + newRollover,
          rolloverCredits: newRollover,
          monthlyAllocation: features.creditAllocation,
          lastRefreshedAt: now
        }
      });
      
      // Log allocation
      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: features.creditAllocation,
          type: 'monthly_allocation',
          description: `Monthly credit allocation for ${subscription.plan}`
        }
      });
      
      if (newRollover > 0) {
        await prisma.creditTransaction.create({
          data: {
            userId,
            amount: newRollover,
            type: 'rollover',
            description: `Rollover credits from previous month`
          }
        });
      }
    }
  }
}
```

### 3. API Route Protection

```typescript
// src/lib/paywall/route-protection.ts

export async function requireFeature(
  userId: string,
  feature: keyof SubscriptionFeatures
): Promise<boolean> {
  const subscription = await PaywallService.getUserSubscription(userId);
  const features = PaywallService.getFeatures(subscription.plan);
  
  if (!features[feature]) {
    throw new PaywallError(
      `This feature requires a Pro subscription`,
      'FEATURE_REQUIRES_UPGRADE',
      subscription.plan
    );
  }
  
  return true;
}

export async function requireCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const credits = await CreditService.getUserCredits(userId);
  
  if (credits.availableCredits < amount) {
    throw new PaywallError(
      `Insufficient credits. You need ${amount} credits but only have ${credits.availableCredits}`,
      'INSUFFICIENT_CREDITS',
      credits.availableCredits
    );
  }
  
  return true;
}

// Middleware for API routes
export function withPaywall(
  handler: NextApiHandler,
  requiredFeature?: keyof SubscriptionFeatures
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      if (requiredFeature) {
        await requireFeature(session.user.id, requiredFeature);
      }
      
      return handler(req, res);
    } catch (error) {
      if (error instanceof PaywallError) {
        return res.status(402).json({
          error: error.message,
          code: error.code,
          upgradeUrl: '/pricing'
        });
      }
      throw error;
    }
  };
}
```

## Implementing Paywalls in Features

### 1. Character Addition Paywall

```typescript
// src/app/api/cards/enrich/route.ts

export const POST = withPaywall(async (req, res) => {
  const { hanzi, deckId } = await req.json();
  
  // Check if character exists in shared database
  const existingCard = await Card.findOne({ hanzi });
  
  if (!existingCard || !existingCard.enriched) {
    // New character needs enrichment - check credits
    await requireCredits(session.user.id, 40);
    
    // Proceed with enrichment
    const enrichedCard = await enrichCharacter(hanzi);
    
    // Consume credits
    await CreditService.consumeCredits(
      session.user.id,
      40,
      `Character enrichment: ${hanzi}`,
      enrichedCard.id
    );
  }
  
  // Rest of the logic...
}, 'canAddCharacters');
```

### 2. Character Insights Paywall

```typescript
// src/app/api/analytics/character-insights/route.ts

export const GET = withPaywall(async (req, res) => {
  // Only Pro+ users can view insights
  const insights = await generateCharacterInsights(cardId);
  return res.json(insights);
}, 'canViewInsights');
```

### 3. Flash Session Paywall

```typescript
// src/app/deck/[deckId]/page.tsx

export default function DeckPage() {
  const { data: subscription } = useSubscription();
  const features = getClientFeatures(subscription?.plan);
  
  if (!features.canAddCharacters && mode === 'new') {
    return (
      <PaywallModal
        title="Upgrade to Learn New Characters"
        description="You're currently on the Lite plan. Upgrade to Pro to add and learn new characters."
        features={[
          "Unlimited new characters",
          "2,000 AI credits monthly",
          "Advanced learning modes",
          "Character insights"
        ]}
        ctaText="Upgrade to Pro"
        ctaLink="/pricing"
      />
    );
  }
  
  // Rest of component...
}
```

## Client-Side Implementation

### 1. Subscription Hook

```typescript
// src/hooks/useSubscription.ts

export function useSubscription() {
  const { data, error, isLoading } = useSWR(
    '/api/user/subscription',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true
    }
  );
  
  return {
    subscription: data,
    features: data ? getClientFeatures(data.plan) : null,
    isLoading,
    error
  };
}
```

### 2. Credit Display Component

```typescript
// src/components/CreditIndicator.tsx

export function CreditIndicator() {
  const { data: credits } = useCredits();
  
  if (!credits) return null;
  
  const percentage = (credits.availableCredits / credits.monthlyAllocation) * 100;
  
  return (
    <div className="flex items-center gap-2">
      <Zap className="w-4 h-4" />
      <span>{credits.availableCredits} credits</span>
      <Progress value={percentage} className="w-20" />
      {credits.availableCredits < 200 && (
        <Link href="/settings/billing" className="text-xs text-blue-400">
          Get more
        </Link>
      )}
    </div>
  );
}
```

## Paywall Messaging

### Error Messages by Context

```typescript
const PAYWALL_MESSAGES = {
  canAddCharacters: {
    title: "Upgrade to Add New Characters",
    description: "You've reached the limit for adding new characters on your current plan.",
    cta: "View Plans"
  },
  insufficientCredits: {
    title: "Not Enough Credits",
    description: "This action requires {amount} credits. You have {available}.",
    cta: "Purchase Credits"
  },
  canViewInsights: {
    title: "Character Insights is a Pro Feature",
    description: "Unlock deep AI-powered analysis of character etymology, memory aids, and learning patterns.",
    cta: "Upgrade to Pro"
  },
  canExportData: {
    title: "Export is a Pro Feature",
    description: "Export your progress and generate certificates with a Pro subscription.",
    cta: "Upgrade to Pro"
  }
};
```

## Testing Paywalls

### Test Scenarios

1. **Trial Expiration**
   - Create user with trial
   - Fast-forward time 14 days
   - Verify downgrade to Lite
   - Check feature restrictions

2. **Credit Consumption**
   - Add 50 new characters
   - Verify credit depletion
   - Test overflow purchase
   - Verify rollover logic

3. **Feature Access**
   - Test each tier's features
   - Verify proper error messages
   - Test upgrade flows

### Test Utilities

```typescript
// src/test/paywall-test-utils.ts

export async function createTestUser(plan: string) {
  const user = await createUser();
  await prisma.userSubscription.create({
    data: {
      userId: user.id,
      plan,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(new Date(), 30)
    }
  });
  
  if (plan !== 'lite') {
    await CreditService.initializeCredits(user.id);
  }
  
  return user;
}

export async function simulateMonthlyRollover(userId: string) {
  await prisma.userCredits.update({
    where: { userId },
    data: {
      lastRefreshedAt: subDays(new Date(), 31)
    }
  });
  
  await CreditService.refreshCreditsIfNeeded(userId);
}
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Metrics**
   - Trial → Pro conversion rate
   - Lite → Pro upgrade rate
   - Credit purchase frequency

2. **Usage Metrics**
   - Average credits consumed per user
   - Feature usage by tier
   - Paywall encounter rate

3. **Revenue Metrics**
   - MRR by tier
   - Credit purchase revenue
   - Churn by tier

### Implementation

```typescript
// Track paywall encounters
await analytics.track('paywall_shown', {
  userId,
  feature: requiredFeature,
  currentPlan: subscription.plan,
  context: req.url
});

// Track upgrades
await analytics.track('plan_upgraded', {
  userId,
  fromPlan: oldPlan,
  toPlan: newPlan,
  trigger: 'paywall' // or 'settings', 'credit_limit'
});
```

## Gradual Rollout Strategy

### Phase 1: Soft Launch (Week 1-2)
- Enable paywalls for new users only
- Existing users grandfathered temporarily
- Monitor metrics and issues

### Phase 2: Migration (Week 3-4)
- Notify existing users of changes
- Provide migration incentives
- Gradual enforcement

### Phase 3: Full Enforcement (Week 5+)
- All users on new paywall system
- Remove legacy code
- Optimize based on data

## Common Edge Cases

1. **Credit Refunds**
   - Failed enrichments should refund credits
   - Track refund transactions

2. **Plan Downgrades**
   - Handle mid-cycle downgrades
   - Preserve data but restrict access

3. **Team Plans**
   - Shared credit pools
   - Admin override capabilities

4. **Student Verification**
   - .edu email validation
   - Periodic re-verification

## Lemon Squeezy-Specific Features

### 1. Test Mode
```typescript
// Enable test mode for development
const isTestMode = process.env.NODE_ENV === 'development';

if (isTestMode) {
  // Use test API keys and test variant IDs
  // Test cards: https://docs.lemonsqueezy.com/help/checkout/test-mode
}
```

### 2. License Keys (for Lifetime)
```typescript
// Generate license key for lifetime purchases
async function generateLicenseKey(orderId: string, userId: string) {
  const license = await ls.createLicenseKey({
    store_id: LEMON_SQUEEZY_CONFIG.storeId,
    product_id: process.env.LS_PRODUCT_LIFETIME!,
    user_email: user.email,
    license_key: generateUniqueKey(),
    expires_at: null, // Never expires
    activation_limit: 1,
    meta: {
      user_id: userId,
      order_id: orderId
    }
  });
  
  return license.data.attributes.key;
}
```

### 3. Usage-Based Billing for Credits
```typescript
// Report credit usage to Lemon Squeezy for usage-based billing
async function reportUsage(subscriptionId: string, quantity: number) {
  await ls.createUsageRecord({
    subscription_id: subscriptionId,
    quantity,
    action: 'increment'
  });
}
```

### 4. Student Verification
```typescript
// Custom student verification with Lemon Squeezy discount codes
const STUDENT_DISCOUNT_CODE = 'STUDENT40'; // 40% off

// Validate .edu email during checkout
function validateStudentEmail(email: string): boolean {
  return email.endsWith('.edu') || 
         email.endsWith('.ac.uk') ||
         email.endsWith('.edu.tw');
}
```

### 5. Environment Variables
```bash
# .env.local
LEMON_SQUEEZY_API_KEY=your_api_key
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret

# Product Variant IDs
LS_VARIANT_PRO_MONTHLY=variant_id
LS_VARIANT_PRO_ANNUAL=variant_id
LS_VARIANT_STUDENT_MONTHLY=variant_id
LS_VARIANT_STUDENT_ANNUAL=variant_id
LS_VARIANT_LIFETIME=variant_id
LS_VARIANT_CREDITS_1000=variant_id

# Product IDs (for license keys)
LS_PRODUCT_LIFETIME=product_id
```

### 6. Migration from Stripe
If migrating from Stripe:

1. Export customer data from Stripe
2. Create corresponding customers in Lemon Squeezy
3. Map subscription statuses
4. Update database fields
5. Implement parallel webhook handling during transition
6. Gradually migrate customers to new billing

## Conclusion

This paywall system using Lemon Squeezy provides clear tier differentiation while maintaining a good user experience. Key advantages of Lemon Squeezy include:

- **Merchant of Record**: Handles tax compliance globally
- **Simple pricing**: Flat 5% + $0.50 per transaction
- **Built-in features**: Customer portal, license keys, usage-based billing
- **Global payments**: Supports 135+ currencies
- **Developer-friendly**: Clean API and webhooks

The credit system allows for flexible usage while protecting against abuse. Regular monitoring and adjustment based on actual usage patterns will be key to optimizing the system.