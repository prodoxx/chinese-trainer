import { PrismaClient } from "@/generated/prisma";

declare global {
  var prisma: PrismaClient | undefined;
}

// Debug DATABASE_URL in all environments for now
console.log('[Prisma] DATABASE_URL check:', {
  NODE_ENV: process.env.NODE_ENV,
  exists: !!process.env.DATABASE_URL,
  starts_with: process.env.DATABASE_URL?.substring(0, 30) || 'N/A',
  length: process.env.DATABASE_URL?.length || 0
});

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. Please check your environment variables.'
  );
}

// Validate DATABASE_URL format
if (!process.env.DATABASE_URL.startsWith('postgresql://') && 
    !process.env.DATABASE_URL.startsWith('postgres://')) {
  console.error('[Prisma] Invalid DATABASE_URL format:', process.env.DATABASE_URL.substring(0, 30));
  throw new Error(
    'DATABASE_URL must start with postgresql:// or postgres://'
  );
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV !== "production" ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}