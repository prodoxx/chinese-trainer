# Email System Documentation

## Overview

Danbing uses Resend as the email service provider for all transactional emails including account verification, password reset, and user notifications. The system features branded HTML templates with the Danbing mascot and professional styling.

## Email Service Architecture

### Resend Integration

```typescript
// Core email service configuration
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email sending function with error handling
export async function sendEmail({
  to,
  subject,
  html,
  from = 'Danbing AI <noreply@transactional.danbing.ai>'
}: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html
    });
    
    console.log('Email sent successfully:', result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}
```

### Domain Configuration

- **Sending Domain**: `transactional.danbing.ai`
- **DKIM**: Configured for authentication
- **SPF**: Set up for delivery optimization
- **DMARC**: Configured for security

## Email Templates

### 1. Email Verification Template

**Purpose**: Sent when users sign up to verify their email address

```typescript
export function generateVerificationEmailHTML(verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your email - Danbing AI</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px;">
        <!-- Header with branding -->
        <div style="background: linear-gradient(135deg, #21262d 0%, #30363d 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #f7cc48;">
          <div style="display: inline-block;">
            <img src="https://static.danbing.ai/danbing.png" style="width: 60px; height: 60px; vertical-align: middle; margin-right: 16px;" alt="Danbing Mascot">
            <div style="display: inline-block; vertical-align: middle;">
              <span style="font-size: 32px; font-weight: bold; color: #ffffff;">Danbing</span>
              <span style="font-size: 14px; font-weight: 600; color: #f7cc48;">AI</span>
            </div>
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 24px 0; text-align: center;">
            Verify Your Email Address
          </h1>
          
          <p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Welcome to Danbing AI! To complete your account setup and start learning Traditional Chinese characters, please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #f7cc48; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 32px; border-radius: 8px; transition: background-color 0.2s;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #8b949e; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
            If you didn't create an account with Danbing AI, you can safely ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #21262d; padding: 30px; text-align: center; border-top: 1px solid #30363d;">
          <p style="color: #8b949e; font-size: 12px; margin: 0 0 8px 0;">
            © 2025 Danbing AI. All rights reserved.
          </p>
          <p style="color: #8b949e; font-size: 12px; margin: 0;">
            Traditional Chinese learning platform powered by AI and cognitive science.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

### 2. Password Reset Template

**Purpose**: Sent when users request password reset

```typescript
export function generatePasswordResetEmailHTML(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your password - Danbing AI</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #21262d 0%, #30363d 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #f7cc48;">
          <div style="display: inline-block;">
            <img src="https://static.danbing.ai/danbing.png" style="width: 60px; height: 60px; vertical-align: middle; margin-right: 16px;" alt="Danbing Mascot">
            <div style="display: inline-block; vertical-align: middle;">
              <span style="font-size: 32px; font-weight: bold; color: #ffffff;">Danbing</span>
              <span style="font-size: 14px; font-weight: 600; color: #f7cc48;">AI</span>
            </div>
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 24px 0; text-align: center;">
            Reset Your Password
          </h1>
          
          <p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            You requested a password reset for your Danbing AI account. Click the button below to create a new password. This link will expire in 1 hour for security.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #f7cc48; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 32px; border-radius: 8px;">
              Reset Password
            </a>
          </div>
          
          <div style="background-color: #21262d; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #f85149; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
              Security Notice
            </p>
            <p style="color: #c9d1d9; font-size: 14px; line-height: 1.5; margin: 0;">
              If you didn't request this password reset, please ignore this email. Your account remains secure.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

## Email Workflows

### 1. Account Verification Flow

```typescript
// Sign up workflow
export async function handleUserSignup(email: string, password: string, name?: string) {
  // 1. Create user in database (unverified)
  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 12),
      name,
      emailVerified: null // Not verified yet
    }
  });
  
  // 2. Generate verification token
  const token = await generateVerificationToken(user.id);
  
  // 3. Send verification email
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  await sendVerificationEmail(email, verificationUrl);
  
  return { success: true, message: 'Verification email sent' };
}

// Email verification endpoint
export async function verifyEmail(token: string) {
  const decoded = await verifyToken(token);
  
  await prisma.user.update({
    where: { id: decoded.userId },
    data: { emailVerified: new Date() }
  });
  
  return { success: true, message: 'Email verified successfully' };
}
```

### 2. Password Reset Flow

```typescript
// Password reset request
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists
    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }
  
  // Generate reset token (expires in 1 hour)
  const token = await generatePasswordResetToken(user.id);
  
  // Send reset email
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, resetUrl);
  
  return { success: true, message: 'Password reset email sent' };
}

// Password reset completion
export async function resetPassword(token: string, newPassword: string) {
  const decoded = await verifyToken(token);
  
  await prisma.user.update({
    where: { id: decoded.userId },
    data: { password: await bcrypt.hash(newPassword, 12) }
  });
  
  return { success: true, message: 'Password reset successfully' };
}
```

### 3. Resend Verification Flow

```typescript
// Resend verification email
export async function resendVerificationEmail(email: string) {
  // Rate limiting check
  const rateLimit = await checkResendRateLimit(email);
  if (!rateLimit.allowed) {
    return { 
      success: false, 
      error: `Please wait ${rateLimit.waitTime} minutes before requesting another email` 
    };
  }
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (user.emailVerified) {
    return { success: false, error: 'Email already verified' };
  }
  
  // Generate new token and send email
  const token = await generateVerificationToken(user.id);
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  
  await sendVerificationEmail(email, verificationUrl);
  await logResendAttempt(email);
  
  return { success: true, message: 'Verification email resent' };
}
```

## Rate Limiting

### Email Rate Limiting Strategy

```typescript
// In-memory rate limiting for email sending
const emailRateLimit = new Map<string, { count: number; resetAt: Date }>();

export async function checkResendRateLimit(email: string) {
  const now = new Date();
  const key = email.toLowerCase();
  const limit = emailRateLimit.get(key);
  
  // Reset if window expired
  if (limit && now > limit.resetAt) {
    emailRateLimit.delete(key);
  }
  
  const current = emailRateLimit.get(key) || { count: 0, resetAt: new Date(now.getTime() + 60 * 60 * 1000) }; // 1 hour window
  
  if (current.count >= 3) { // Max 3 emails per hour
    const waitTime = Math.ceil((current.resetAt.getTime() - now.getTime()) / (1000 * 60));
    return { allowed: false, waitTime };
  }
  
  // Increment count
  current.count++;
  emailRateLimit.set(key, current);
  
  return { allowed: true, remaining: 3 - current.count };
}
```

## Token Management

### JWT Token Generation

```typescript
import jwt from 'jsonwebtoken';

// Generate verification token
export async function generateVerificationToken(userId: string): Promise<string> {
  return jwt.sign(
    { 
      userId, 
      type: 'email-verification',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    process.env.JWT_SECRET!
  );
}

// Generate password reset token
export async function generatePasswordResetToken(userId: string): Promise<string> {
  return jwt.sign(
    { 
      userId, 
      type: 'password-reset',
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    },
    process.env.JWT_SECRET!
  );
}

// Verify token
export async function verifyToken(token: string): Promise<{ userId: string; type: string }> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return { userId: decoded.userId, type: decoded.type };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Resend API Configuration
RESEND_API_KEY=re_...                           # Resend API key
EMAIL_FROM="Danbing AI <noreply@transactional.danbing.ai>"

# Domain Configuration
NEXTAUTH_URL=https://danbing.ai                 # Base URL for email links
NEXTAUTH_SECRET=...                             # JWT secret for tokens

# Email Settings
EMAIL_RATE_LIMIT_WINDOW=3600                    # Rate limit window (seconds)
EMAIL_RATE_LIMIT_MAX=3                          # Max emails per window
```

### Domain Setup Checklist

1. **DNS Records**:
   ```
   TXT _dmarc.transactional.danbing.ai "v=DMARC1; p=quarantine; rua=mailto:dmarc@danbing.ai"
   TXT transactional.danbing.ai "v=spf1 include:_spf.resend.com ~all"
   CNAME resend._domainkey.transactional.danbing.ai resend._domainkey.resend.com
   ```

2. **Resend Dashboard Configuration**:
   - Domain verification
   - DKIM key setup
   - Webhook configuration (optional)

## Error Handling and Monitoring

### Email Delivery Monitoring

```typescript
// Enhanced email sending with monitoring
export async function sendEmailWithMonitoring(emailData: EmailOptions) {
  const startTime = Date.now();
  
  try {
    const result = await resend.emails.send(emailData);
    
    // Log successful delivery
    await logEmailEvent({
      type: 'email_sent',
      recipient: emailData.to,
      subject: emailData.subject,
      messageId: result.id,
      deliveryTime: Date.now() - startTime,
      status: 'success'
    });
    
    return { success: true, id: result.id };
  } catch (error) {
    // Log failure
    await logEmailEvent({
      type: 'email_failed',
      recipient: emailData.to,
      subject: emailData.subject,
      error: error.message,
      deliveryTime: Date.now() - startTime,
      status: 'failed'
    });
    
    throw error;
  }
}
```

### Fallback Strategies

```typescript
// Graceful degradation for email failures
export async function sendCriticalEmail(emailData: EmailOptions, retries = 3) {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await sendEmailWithMonitoring(emailData);
    } catch (error) {
      lastError = error;
      
      if (attempt < retries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // All retries failed - log for manual intervention
  await logCriticalEmailFailure({
    recipient: emailData.to,
    subject: emailData.subject,
    error: lastError.message,
    attempts: retries
  });
  
  throw new Error(`Failed to send email after ${retries} attempts: ${lastError.message}`);
}
```

## Email Template Best Practices

### 1. Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Progressive enhancement**: Works in all email clients
- **Fallback fonts**: System fonts for compatibility

### 2. Accessibility
- **Alt text**: Images have descriptive alt text
- **High contrast**: Readable color combinations
- **Semantic HTML**: Proper heading hierarchy

### 3. Security
- **No external scripts**: Email clients block JavaScript
- **Safe links**: All links use HTTPS
- **Token expiration**: Short-lived tokens for security

### 4. Branding Consistency
- **Logo placement**: Consistent Danbing branding
- **Color scheme**: Matches application theme
- **Typography**: Consistent with web app

## Testing Strategy

### 1. Email Template Testing
```typescript
// Test email template generation
describe('Email Templates', () => {
  it('should generate valid verification email HTML', () => {
    const html = generateVerificationEmailHTML('https://example.com/verify');
    
    expect(html).toContain('Verify Your Email Address');
    expect(html).toContain('https://example.com/verify');
    expect(html).toContain('Danbing AI');
  });
  
  it('should include security notices in password reset emails', () => {
    const html = generatePasswordResetEmailHTML('https://example.com/reset');
    
    expect(html).toContain('Security Notice');
    expect(html).toContain('expire in 1 hour');
  });
});
```

### 2. Email Delivery Testing
```typescript
// Test email delivery in development
export async function sendTestEmail(to: string) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Test emails only available in development');
  }
  
  return await sendEmail({
    to,
    subject: 'Test Email - Danbing AI',
    html: generateTestEmailHTML()
  });
}
```

## Analytics and Reporting

### Email Performance Metrics
- **Delivery rate**: Percentage of emails successfully delivered
- **Open rate**: Email open tracking (where supported)
- **Click-through rate**: Link click tracking
- **Bounce rate**: Failed delivery tracking

### User Experience Metrics
- **Verification time**: Time from signup to email verification
- **Reset completion rate**: Percentage of password resets completed
- **Support requests**: Email-related support tickets

This comprehensive email system ensures reliable, secure, and user-friendly communication with Danbing users while maintaining professional branding and optimal deliverability.