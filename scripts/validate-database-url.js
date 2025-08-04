#!/usr/bin/env node

// Validate DATABASE_URL before starting the application
const databaseUrl = process.env.DATABASE_URL;

console.log('[Database URL Validation]');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!databaseUrl);
console.log('DATABASE_URL preview:', databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'NOT SET');

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('ERROR: DATABASE_URL must start with postgresql:// or postgres://');
  console.error('Current value starts with:', databaseUrl.substring(0, 20));
  process.exit(1);
}

// Check for common Railway PostgreSQL URL format
if (databaseUrl.includes('railway.app')) {
  console.log('✓ Detected Railway PostgreSQL database');
}

console.log('✓ DATABASE_URL validation passed');