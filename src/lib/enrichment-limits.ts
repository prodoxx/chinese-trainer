import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// Daily limit for non-admin users (temporary until paywall)
const DAILY_ENRICHMENT_LIMIT = 20;

/**
 * Check if a user has reached their daily enrichment limit
 * @param userId - The user's ID
 * @param isAdmin - Whether the user is an admin
 * @returns Object with canEnrich boolean and remaining count
 */
export async function checkEnrichmentLimit(userId: string, isAdmin: boolean = false) {
  // Admins have no limits
  if (isAdmin) {
    return {
      canEnrich: true,
      remaining: -1, // Unlimited
      limit: -1,
      used: 0
    };
  }

  // Get or create enrichment usage record
  let usage = await prisma.dailyEnrichmentUsage.findUnique({
    where: { userId }
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // If no usage record exists, create one
  if (!usage) {
    usage = await prisma.dailyEnrichmentUsage.create({
      data: {
        userId,
        enrichmentsToday: 0,
        lastResetDate: today
      }
    });
  } else {
    // Check if we need to reset the counter (new day)
    const lastReset = new Date(usage.lastResetDate);
    const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
    
    if (today > lastResetDay) {
      // Reset the counter for a new day
      usage = await prisma.dailyEnrichmentUsage.update({
        where: { userId },
        data: {
          enrichmentsToday: 0,
          lastResetDate: today
        }
      });
    }
  }

  const remaining = DAILY_ENRICHMENT_LIMIT - usage.enrichmentsToday;
  
  return {
    canEnrich: usage.enrichmentsToday < DAILY_ENRICHMENT_LIMIT,
    remaining: Math.max(0, remaining),
    limit: DAILY_ENRICHMENT_LIMIT,
    used: usage.enrichmentsToday
  };
}

/**
 * Increment the enrichment count for a user
 * @param userId - The user's ID
 * @param count - Number of enrichments to add (default 1)
 */
export async function incrementEnrichmentCount(userId: string, count: number = 1) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get or create enrichment usage record
  let usage = await prisma.dailyEnrichmentUsage.findUnique({
    where: { userId }
  });

  if (!usage) {
    // Create new record
    await prisma.dailyEnrichmentUsage.create({
      data: {
        userId,
        enrichmentsToday: count,
        lastResetDate: today
      }
    });
  } else {
    // Check if we need to reset first
    const lastReset = new Date(usage.lastResetDate);
    const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
    
    if (today > lastResetDay) {
      // Reset and set to count
      await prisma.dailyEnrichmentUsage.update({
        where: { userId },
        data: {
          enrichmentsToday: count,
          lastResetDate: today
        }
      });
    } else {
      // Just increment
      await prisma.dailyEnrichmentUsage.update({
        where: { userId },
        data: {
          enrichmentsToday: {
            increment: count
          }
        }
      });
    }
  }
}

/**
 * Get enrichment usage stats for a user
 * @param userId - The user's ID
 */
export async function getEnrichmentStats(userId: string) {
  const usage = await prisma.dailyEnrichmentUsage.findUnique({
    where: { userId }
  });

  if (!usage) {
    return {
      used: 0,
      remaining: DAILY_ENRICHMENT_LIMIT,
      limit: DAILY_ENRICHMENT_LIMIT,
      lastReset: new Date()
    };
  }

  // Check if needs reset
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastReset = new Date(usage.lastResetDate);
  const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
  
  const needsReset = today > lastResetDay;
  const used = needsReset ? 0 : usage.enrichmentsToday;
  
  return {
    used,
    remaining: Math.max(0, DAILY_ENRICHMENT_LIMIT - used),
    limit: DAILY_ENRICHMENT_LIMIT,
    lastReset: usage.lastResetDate,
    nextReset: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
  };
}