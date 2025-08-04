import { PrismaClient } from "@/generated/prisma";

// This file provides a more robust Prisma client initialization for production

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  // Validate DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not defined. Please set it in your environment variables.'
    );
  }

  // Handle Railway's PostgreSQL URLs which might have different formats
  let connectionUrl = databaseUrl;
  
  // If the URL contains 'railway' but doesn't start with postgresql://, fix it
  if (databaseUrl.includes('railway') && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.warn('[Prisma] Fixing DATABASE_URL format for Railway');
    connectionUrl = 'postgresql://' + databaseUrl.replace(/^.*?:\/\//, '');
  }

  // Create Prisma client with explicit datasource
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });
}

// Prevent multiple instances in development
const prismaClientSingleton = () => {
  return createPrismaClient();
};

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export { prisma };