# Paywall Implementation Task Breakdown

**Project**: Danbing Paywall System with Lemon Squeezy
**Timeline**: 4-6 weeks
**Priority**: High
**Dependencies**: Lemon Squeezy account setup, pricing strategy finalized

---

## Phase 1: Infrastructure Setup (Week 1)
*Goal: Set up database, Lemon Squeezy integration, and core services*

### 1.1 Database Schema Setup
**Priority**: Critical
**Estimated Time**: 4 hours
**Dependencies**: None

- [ ] Update Prisma schema with subscription models
  ```
  - UserSubscription model
  - UserCredits model  
  - CreditTransaction model
  ```
- [ ] Run Prisma migrations
- [ ] Generate Prisma client
- [ ] Test database connections

**Acceptance Criteria**:
- All three models created and migrated
- Relationships properly configured
- Test data can be inserted/retrieved

---

### 1.2 Lemon Squeezy Account Configuration
**Priority**: Critical
**Estimated Time**: 2 hours
**Dependencies**: Business account created

- [ ] Create products in Lemon Squeezy dashboard:
  - Pro Monthly ($14/month)
  - Pro Annual ($168/year)
  - Student Pro Monthly ($9/month)
  - Student Pro Annual ($99/year)
  - Lifetime ($499 one-time)
  - Credits 1000 Pack ($4.99)
- [ ] Configure webhook endpoint
- [ ] Set up test mode for development
- [ ] Create discount code STUDENT40 (40% off)
- [ ] Note all variant IDs for environment variables

**Acceptance Criteria**:
- All products visible in dashboard
- Test mode functional
- Webhook URL configured

---

### 1.3 Environment Variables Setup
**Priority**: Critical
**Estimated Time**: 1 hour
**Dependencies**: 1.2 completed

- [ ] Add to `.env.local`:
  ```
  LEMON_SQUEEZY_API_KEY=
  LEMON_SQUEEZY_STORE_ID=
  LEMON_SQUEEZY_WEBHOOK_SECRET=
  LS_VARIANT_PRO_MONTHLY=
  LS_VARIANT_PRO_ANNUAL=
  LS_VARIANT_STUDENT_MONTHLY=
  LS_VARIANT_STUDENT_ANNUAL=
  LS_VARIANT_LIFETIME=
  LS_VARIANT_CREDITS_1000=
  LS_PRODUCT_LIFETIME=
  ```
- [ ] Add to production environment
- [ ] Verify all variables load correctly

**Acceptance Criteria**:
- All environment variables set
- Application starts without errors

---

### 1.4 Install Dependencies
**Priority**: Critical
**Estimated Time**: 30 minutes
**Dependencies**: None

- [ ] Install Lemon Squeezy SDK: `bun add @lemonsqueezy/lemonsqueezy.js`
- [ ] Install crypto for webhook verification (if not already available)
- [ ] Update package.json
- [ ] Verify no version conflicts

**Acceptance Criteria**:
- All packages installed
- No dependency conflicts
- Build succeeds

---

## Phase 2: Core Services Implementation (Week 1-2)
*Goal: Build the foundational services for subscription and credit management*

### 2.1 Lemon Squeezy Service Layer
**Priority**: Critical
**Estimated Time**: 6 hours
**Dependencies**: 1.3, 1.4 completed

Create `/src/lib/lemonsqueezy/` directory:

- [ ] Create `config.ts`
  - Export LEMON_SQUEEZY_CONFIG object
  - Validate all environment variables exist
- [ ] Create `client.ts`
  - Implement LemonSqueezyService class
  - Methods: createCheckoutUrl, getSubscription, cancelSubscription, resumeSubscription, updatePaymentMethod
- [ ] Add error handling and logging
- [ ] Write unit tests

**Acceptance Criteria**:
- Service can create checkout URLs
- Service can retrieve subscription data
- Error handling works properly
- Tests pass with 80% coverage

---

### 2.2 Paywall Service
**Priority**: Critical
**Estimated Time**: 8 hours
**Dependencies**: 2.1 completed

Create `/src/lib/paywall/` directory:

- [ ] Create `paywall-service.ts`
  - Define SubscriptionFeatures interface
  - Implement PaywallService class
  - getUserSubscription method
  - getFeatures method
  - createDefaultSubscription method
  - downgradeToLite method
- [ ] Create feature matrix for all plans
- [ ] Add trial expiration logic
- [ ] Write comprehensive tests

**Acceptance Criteria**:
- Can retrieve user subscription
- Feature flags work correctly for each plan
- Trial expiration triggers downgrade
- Tests cover all plan types

---

### 2.3 Credit Management Service
**Priority**: Critical
**Estimated Time**: 8 hours
**Dependencies**: 2.2 completed

- [ ] Create `credit-service.ts`
  - Implement CreditService class
  - getUserCredits method
  - consumeCredits method
  - addCredits method (for purchases)
  - refreshCreditsIfNeeded method
  - initializeCredits method
- [ ] Implement rollover logic:
  - Pro: 2-month rollover (max 4,000)
  - Lifetime: 3-month rollover (max 12,000)
- [ ] Add transaction logging
- [ ] Write tests for credit operations

**Acceptance Criteria**:
- Credits deduct correctly
- Monthly refresh works
- Rollover limits enforced
- Transaction log accurate
- Tests cover edge cases

---

### 2.4 Route Protection Middleware
**Priority**: High
**Estimated Time**: 4 hours
**Dependencies**: 2.2, 2.3 completed

- [ ] Create `route-protection.ts`
  - requireFeature function
  - requireCredits function
  - withPaywall middleware
  - PaywallError class
- [ ] Add proper error responses (402 Payment Required)
- [ ] Include upgrade URLs in errors
- [ ] Write middleware tests

**Acceptance Criteria**:
- Middleware blocks unauthorized access
- Returns proper HTTP status codes
- Error messages are user-friendly
- Tests cover all scenarios

---

## Phase 3: API Routes (Week 2)
*Goal: Implement all payment and subscription endpoints*

### 3.1 Webhook Handler
**Priority**: Critical
**Estimated Time**: 8 hours
**Dependencies**: Phase 2 completed

- [ ] Create `/src/app/api/webhooks/lemonsqueezy/route.ts`
- [ ] Implement signature verification
- [ ] Handle events:
  - subscription_created
  - subscription_updated
  - subscription_cancelled
  - subscription_resumed
  - subscription_expired
  - subscription_payment_success
  - subscription_payment_failed
  - order_created (lifetime & credits)
- [ ] Add comprehensive logging
- [ ] Implement idempotency
- [ ] Write integration tests

**Acceptance Criteria**:
- Webhook signature verified
- All events handled properly
- Database updated correctly
- Idempotent operations
- No duplicate processing

---

### 3.2 Checkout API Route
**Priority**: Critical
**Estimated Time**: 4 hours
**Dependencies**: 2.1 completed

- [ ] Create `/src/app/api/checkout/route.ts`
- [ ] Map plan/billing to variant IDs
- [ ] Handle student plan verification
- [ ] Generate checkout URLs
- [ ] Add session validation
- [ ] Handle errors gracefully

**Acceptance Criteria**:
- Checkout URLs generated correctly
- Student plans require .edu validation
- Proper authentication required
- Error handling works

---

### 3.3 Customer Portal Route
**Priority**: High
**Estimated Time**: 3 hours
**Dependencies**: 2.1 completed

- [ ] Create `/src/app/api/billing/portal/route.ts`
- [ ] Retrieve customer portal URL
- [ ] Validate user has subscription
- [ ] Handle errors
- [ ] Add caching for portal URLs

**Acceptance Criteria**:
- Portal URLs retrieved successfully
- Only subscribed users can access
- URLs cached appropriately

---

### 3.4 Subscription Status Route
**Priority**: High
**Estimated Time**: 3 hours
**Dependencies**: 2.2 completed

- [ ] Create `/src/app/api/user/subscription/route.ts`
- [ ] Return current subscription details
- [ ] Include feature flags
- [ ] Include credit balance
- [ ] Cache response appropriately

**Acceptance Criteria**:
- Returns accurate subscription data
- Includes all necessary fields
- Performance optimized

---

### 3.5 Credit Purchase Route
**Priority**: Medium
**Estimated Time**: 4 hours
**Dependencies**: 3.2 completed

- [ ] Create `/src/app/api/credits/purchase/route.ts`
- [ ] Generate checkout URL for credit packs
- [ ] Track purchase intent
- [ ] Handle completion via webhook
- [ ] Update user credits

**Acceptance Criteria**:
- Credit purchases work end-to-end
- Credits added after payment
- Transaction logged

---

## Phase 4: Paywall Integration (Week 2-3)
*Goal: Add paywalls to existing features*

### 4.1 Character Enrichment Paywall
**Priority**: Critical
**Estimated Time**: 6 hours
**Dependencies**: Phase 3 completed

- [ ] Update `/src/app/api/cards/enrich/route.ts`
  - Add withPaywall middleware
  - Check if character exists in database
  - Deduct 40 credits for new characters
  - Handle insufficient credits
- [ ] Update UI to show credit cost
- [ ] Add credit balance indicator
- [ ] Test with various credit amounts

**Acceptance Criteria**:
- Existing characters don't use credits
- New characters deduct 40 credits
- Insufficient credits show upgrade prompt
- UI accurately reflects costs

---

### 4.2 Character Addition Limits
**Priority**: Critical
**Estimated Time**: 4 hours
**Dependencies**: 4.1 completed

- [ ] Update deck import endpoints
- [ ] Block character addition for Lite users
- [ ] Show paywall modal for Lite users
- [ ] Allow viewing existing cards
- [ ] Test all user flows

**Acceptance Criteria**:
- Lite users cannot add new characters
- Clear messaging about limitations
- Existing cards remain accessible

---

### 4.3 Flash Session Restrictions
**Priority**: High
**Estimated Time**: 4 hours
**Dependencies**: Phase 3 completed

- [ ] Update `/src/app/deck/[deckId]/page.tsx`
- [ ] Restrict "New Card Mode" for Lite users
- [ ] Allow review mode for all users
- [ ] Add upgrade prompts
- [ ] Test all session types

**Acceptance Criteria**:
- Lite users can only review
- Pro features clearly marked
- Smooth upgrade flow

---

### 4.4 Character Insights Paywall
**Priority**: Medium
**Estimated Time**: 3 hours
**Dependencies**: Phase 3 completed

- [ ] Update `/src/app/api/analytics/character-insights/route.ts`
- [ ] Add feature check for insights
- [ ] Show preview for Lite users
- [ ] Add upgrade CTA
- [ ] Test access control

**Acceptance Criteria**:
- Only Pro+ users see full insights
- Lite users see upgrade prompt
- Preview entices upgrades

---

### 4.5 Analytics Access Control
**Priority**: Medium
**Estimated Time**: 3 hours
**Dependencies**: Phase 3 completed

- [ ] Update analytics dashboard
- [ ] Restrict advanced metrics for Lite
- [ ] Show basic stats for all users
- [ ] Add upgrade prompts
- [ ] Test all metrics

**Acceptance Criteria**:
- Basic stats available to all
- Advanced analytics Pro-only
- Clear feature differentiation

---

## Phase 5: Client-Side Components (Week 3)
*Goal: Build UI components for subscription management*

### 5.1 Subscription Hook
**Priority**: High
**Estimated Time**: 3 hours
**Dependencies**: 3.4 completed

- [ ] Create `/src/hooks/useSubscription.ts`
- [ ] Fetch subscription data
- [ ] Include feature flags
- [ ] Add SWR caching
- [ ] Handle loading/error states

**Acceptance Criteria**:
- Hook returns current subscription
- Data cached appropriately
- Error handling works

---

### 5.2 Credit Indicator Component
**Priority**: High
**Estimated Time**: 4 hours
**Dependencies**: 5.1 completed

- [ ] Create `/src/components/CreditIndicator.tsx`
- [ ] Show current credit balance
- [ ] Display usage percentage
- [ ] Add low credit warning
- [ ] Link to purchase more
- [ ] Make it responsive

**Acceptance Criteria**:
- Shows accurate credit count
- Visual progress indicator
- Warning at <200 credits
- Links to billing page

---

### 5.3 Paywall Modal Component
**Priority**: High
**Estimated Time**: 6 hours
**Dependencies**: 5.1 completed

- [ ] Create `/src/components/PaywallModal.tsx`
- [ ] Dynamic content based on context
- [ ] Feature comparison display
- [ ] Upgrade CTA buttons
- [ ] Smooth animations
- [ ] Mobile responsive

**Acceptance Criteria**:
- Clear value proposition
- Context-appropriate messaging
- Direct upgrade path
- Works on all devices

---

### 5.4 Billing Settings Page
**Priority**: High
**Estimated Time**: 8 hours
**Dependencies**: 5.1, 5.2 completed

- [ ] Create `/src/app/settings/billing/page.tsx`
- [ ] Show current plan details
- [ ] Display credit balance and history
- [ ] Add upgrade/downgrade options
- [ ] Link to customer portal
- [ ] Show next billing date
- [ ] Add cancel subscription option

**Acceptance Criteria**:
- All subscription details visible
- Can manage subscription
- Credit history displayed
- Portal link works

---

### 5.5 Pricing Page Updates
**Priority**: Medium
**Estimated Time**: 2 hours
**Dependencies**: None

- [ ] Update pricing page with accurate limits
- [ ] Add "Current Plan" indicator for logged-in users
- [ ] Update FAQ with credit information
- [ ] Add credit calculator tool
- [ ] Test all links

**Acceptance Criteria**:
- Pricing accurate
- Current plan highlighted
- FAQs comprehensive
- Calculator helps users understand credits

---

## Phase 6: Testing & QA (Week 3-4)
*Goal: Comprehensive testing of all paywall features*

### 6.1 Unit Tests
**Priority**: Critical
**Estimated Time**: 8 hours
**Dependencies**: Phases 1-5 completed

- [ ] Test PaywallService
- [ ] Test CreditService
- [ ] Test LemonSqueezyService
- [ ] Test webhook handlers
- [ ] Test route protection
- [ ] Achieve 80% code coverage

**Acceptance Criteria**:
- All services tested
- Edge cases covered
- 80%+ coverage

---

### 6.2 Integration Tests
**Priority**: Critical
**Estimated Time**: 8 hours
**Dependencies**: 6.1 completed

- [ ] Test complete checkout flow
- [ ] Test webhook processing
- [ ] Test credit consumption
- [ ] Test subscription changes
- [ ] Test trial expiration
- [ ] Test payment failures

**Acceptance Criteria**:
- End-to-end flows work
- Webhooks process correctly
- State changes properly

---

### 6.3 User Flow Testing
**Priority**: High
**Estimated Time**: 6 hours
**Dependencies**: 6.2 completed

Test each user journey:
- [ ] New user trial signup
- [ ] Trial to Pro upgrade
- [ ] Lite user hitting paywalls
- [ ] Credit purchase flow
- [ ] Subscription cancellation
- [ ] Payment method update
- [ ] Student verification

**Acceptance Criteria**:
- All flows smooth
- Error messages clear
- No dead ends

---

### 6.4 Load Testing
**Priority**: Medium
**Estimated Time**: 4 hours
**Dependencies**: 6.2 completed

- [ ] Test webhook endpoint under load
- [ ] Test credit deduction concurrency
- [ ] Test subscription checks performance
- [ ] Optimize slow queries
- [ ] Add caching where needed

**Acceptance Criteria**:
- Can handle 100 webhooks/minute
- No race conditions
- <100ms response times

---

## Phase 7: Monitoring & Analytics (Week 4)
*Goal: Set up tracking and monitoring*

### 7.1 Analytics Events
**Priority**: High
**Estimated Time**: 4 hours
**Dependencies**: Phase 5 completed

- [ ] Track paywall encounters
- [ ] Track upgrade clicks
- [ ] Track successful conversions
- [ ] Track credit usage patterns
- [ ] Track feature usage by tier
- [ ] Set up funnel analysis

**Acceptance Criteria**:
- All key events tracked
- Data flowing to analytics
- Dashboards created

---

### 7.2 Error Monitoring
**Priority**: High
**Estimated Time**: 3 hours
**Dependencies**: Phase 6 completed

- [ ] Set up Sentry/error tracking
- [ ] Monitor webhook failures
- [ ] Track payment errors
- [ ] Alert on critical issues
- [ ] Create runbook for common issues

**Acceptance Criteria**:
- Errors captured
- Alerts configured
- Runbook documented

---

### 7.3 Business Metrics Dashboard
**Priority**: Medium
**Estimated Time**: 6 hours
**Dependencies**: 7.1 completed

- [ ] Create admin dashboard
- [ ] Show MRR by tier
- [ ] Display conversion rates
- [ ] Track credit consumption
- [ ] Monitor churn rates
- [ ] Export capabilities

**Acceptance Criteria**:
- Real-time metrics
- Historical trends
- Exportable reports

---

## Phase 8: Documentation & Deployment (Week 4)
*Goal: Document and deploy the system*

### 8.1 Technical Documentation
**Priority**: High
**Estimated Time**: 4 hours
**Dependencies**: All phases completed

- [ ] Document API endpoints
- [ ] Document webhook handling
- [ ] Create troubleshooting guide
- [ ] Document test credentials
- [ ] Add inline code comments

**Acceptance Criteria**:
- Complete API docs
- Troubleshooting guide
- Code well-commented

---

### 8.2 User Documentation
**Priority**: Medium
**Estimated Time**: 3 hours
**Dependencies**: Phase 5 completed

- [ ] Update help center
- [ ] Create upgrade guides
- [ ] Document credit system
- [ ] Add billing FAQs
- [ ] Create video tutorials

**Acceptance Criteria**:
- Users understand system
- Common questions answered
- Visual guides available

---

### 8.3 Staging Deployment
**Priority**: Critical
**Estimated Time**: 4 hours
**Dependencies**: Phase 6 completed

- [ ] Deploy to staging environment
- [ ] Test with Lemon Squeezy test mode
- [ ] Verify all webhooks work
- [ ] Run smoke tests
- [ ] Get stakeholder approval

**Acceptance Criteria**:
- Staging fully functional
- Test payments work
- Stakeholders approve

---

### 8.4 Production Deployment
**Priority**: Critical
**Estimated Time**: 6 hours
**Dependencies**: 8.3 completed

- [ ] Create rollback plan
- [ ] Deploy during low-traffic window
- [ ] Switch to production Lemon Squeezy
- [ ] Monitor initial transactions
- [ ] Run production smoke tests
- [ ] Monitor for 24 hours

**Acceptance Criteria**:
- Deployed successfully
- First payments processed
- No critical issues
- Rollback plan ready

---

## Post-Launch Tasks (Week 5+)

### Immediate (Days 1-7)
- [ ] Monitor conversion rates
- [ ] Address urgent bugs
- [ ] Gather user feedback
- [ ] Optimize based on data

### Short-term (Weeks 2-4)
- [ ] A/B test pricing
- [ ] Optimize paywall messaging
- [ ] Add export features (deferred from launch)
- [ ] Improve credit calculations

### Long-term (Month 2+)
- [ ] Add export features (PDF reports, certificates)
- [ ] Add team billing (if requested by users)
- [ ] Implement referral system
- [ ] Add more payment methods
- [ ] Expand to other regions

---

## Risk Mitigation

### Technical Risks
1. **Webhook failures**: Implement retry logic and manual sync
2. **Credit calculation errors**: Add audit logs and reconciliation
3. **Payment processing issues**: Have support contact ready
4. **Performance degradation**: Load test thoroughly

### Business Risks
1. **Low conversion rates**: Prepare to adjust pricing
2. **High churn**: Monitor and address pain points
3. **Credit abuse**: Implement rate limiting
4. **Compliance issues**: Review terms with legal

---

## Success Metrics

### Technical KPIs
- Webhook success rate > 99.9%
- API response time < 200ms
- Zero payment data loss
- < 0.1% transaction errors

### Business KPIs
- Trial → Pro conversion > 10%
- Monthly churn < 5%
- Credit attach rate > 20%
- Support tickets < 2% of users

---

## Team Requirements

### Development Team
- **Backend Developer**: 1 person, 4 weeks
- **Frontend Developer**: 1 person, 3 weeks
- **QA Engineer**: 1 person, 1 week
- **DevOps**: 0.5 person, 1 week

### Support Team
- **Customer Success**: Training needed
- **Technical Support**: Runbook required
- **Product Manager**: Daily standups

---

## Definition of Done

Each task is considered complete when:
1. Code is written and reviewed
2. Tests are written and passing
3. Documentation is updated
4. Feature is deployed to staging
5. QA has approved
6. Stakeholders have signed off

---

## Launch Checklist

Before going live:
- [ ] All tests passing
- [ ] Staging fully tested
- [ ] Documentation complete
- [ ] Support team trained
- [ ] Monitoring in place
- [ ] Rollback plan ready
- [ ] Legal review complete
- [ ] Communications prepared
- [ ] Backup systems verified
- [ ] Go/No-go decision made

---

*This document should be treated as a living document and updated as the implementation progresses.*