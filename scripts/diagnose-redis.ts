import { getRedis, getRedisOptions } from '../src/lib/queue/redis';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);

async function diagnoseRedis() {
  console.log('🔍 Redis Connection Diagnostics\n');
  console.log('='.repeat(50));
  
  // 1. Check environment
  console.log('\n📋 Environment Check:');
  console.log(`   Node Version: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'Not in Railway'}`);
  console.log(`   Service Name: ${process.env.RAILWAY_SERVICE_NAME || 'Unknown'}`);
  console.log(`   Region: ${process.env.RAILWAY_REGION || 'Unknown'}`);
  
  // 2. Check Redis environment variables
  console.log('\n🔐 Redis Configuration:');
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    console.log('   REDIS_URL is set');
    try {
      const url = new URL(redisUrl);
      console.log(`   - Protocol: ${url.protocol}`);
      console.log(`   - Hostname: ${url.hostname}`);
      console.log(`   - Port: ${url.port || '6379'}`);
      console.log(`   - Has password: ${url.password ? 'Yes' : 'No'}`);
      
      // Check if hostname contains railway.internal
      if (url.hostname.includes('railway.internal')) {
        console.log('   ⚠️  Using Railway internal hostname');
      }
    } catch (e) {
      console.log('   ❌ Failed to parse REDIS_URL:', e.message);
    }
  } else {
    console.log('   REDIS_URL is NOT set');
    console.log(`   REDIS_HOST: ${process.env.REDIS_HOST || 'Not set'}`);
    console.log(`   REDIS_PORT: ${process.env.REDIS_PORT || 'Not set'}`);
    console.log(`   REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? 'Set' : 'Not set'}`);
  }
  
  // 3. DNS Resolution Test
  console.log('\n🌐 DNS Resolution Test:');
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      if (url.hostname.includes('railway.internal')) {
        console.log(`   Testing DNS resolution for: ${url.hostname}`);
        try {
          const addresses = await resolve4(url.hostname);
          console.log(`   ✅ DNS resolved to: ${addresses.join(', ')}`);
        } catch (dnsError) {
          console.log(`   ❌ DNS resolution failed: ${dnsError.message}`);
          console.log('   This confirms the hostname cannot be resolved in this environment');
        }
      }
    } catch (e) {
      console.log('   Skip DNS test - invalid URL');
    }
  }
  
  // 4. Check if we're in a Railway private network
  console.log('\n🔒 Railway Private Network Check:');
  const privateIpv6 = process.env.RAILWAY_PRIVATE_DOMAIN;
  if (privateIpv6) {
    console.log(`   Private domain available: ${privateIpv6}`);
    console.log('   ✅ Running inside Railway with private networking');
  } else {
    console.log('   ❌ No private domain detected');
    console.log('   Not running in Railway or private networking not enabled');
  }
  
  // 5. Test actual connection
  console.log('\n🔌 Connection Test:');
  console.log('   Getting Redis options...');
  const options = getRedisOptions();
  console.log(`   Options type: ${typeof options}`);
  
  try {
    console.log('   Creating Redis connection...');
    const redis = getRedis();
    
    // Wait a bit for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('   Attempting PING...');
    const startTime = Date.now();
    const result = await redis.ping();
    const latency = Date.now() - startTime;
    console.log(`   ✅ PING successful: ${result} (${latency}ms)`);
    
    process.exit(0);
  } catch (error) {
    console.error('   ❌ Connection failed:', error.message);
    
    // Provide specific recommendations
    console.log('\n💡 Recommendations:');
    
    if (error.message.includes('ENOTFOUND') && error.message.includes('railway.internal')) {
      console.log('   1. You are trying to use Railway internal hostname outside Railway');
      console.log('   2. Solutions:');
      console.log('      a) Use a public Redis instance URL for local development');
      console.log('      b) Run this service inside Railway');
      console.log('      c) Use Railway CLI to run locally with: railway run <command>');
      console.log('      d) Set up port forwarding with: railway link && railway service');
    }
    
    process.exit(1);
  }
}

// Run diagnostics
diagnoseRedis().catch(console.error);