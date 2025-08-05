import { getRedis } from '../src/lib/queue/redis';

async function testRedis() {
  console.log('🔍 Testing Redis connection...\n');
  
  // Display environment variables (masked)
  console.log('Environment variables:');
  console.log('  REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not set');
  console.log('  REDIS_HOST:', process.env.REDIS_HOST || '(not set - will use localhost)');
  console.log('  REDIS_PORT:', process.env.REDIS_PORT || '(not set - will use 6379)');
  console.log('  REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('');
  
  // Railway-specific variables
  console.log('Railway variables (if available):');
  console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || '(not in Railway)');
  console.log('  REDISHOST:', process.env.REDISHOST || '(not set)');
  console.log('  REDISPORT:', process.env.REDISPORT || '(not set)');
  console.log('  REDISUSER:', process.env.REDISUSER || '(not set)');
  console.log('  REDISPASSWORD:', process.env.REDISPASSWORD ? '✅ Set' : '❌ Not set');
  console.log('');
  
  try {
    const redis = getRedis();
    
    // Test ping
    console.log('📡 Sending PING...');
    const pong = await redis.ping();
    console.log('✅ PING response:', pong);
    
    // Test write
    console.log('\n📝 Testing write operation...');
    await redis.set('test:connection', 'success', 'EX', 60);
    console.log('✅ Write successful');
    
    // Test read
    console.log('\n📖 Testing read operation...');
    const value = await redis.get('test:connection');
    console.log('✅ Read value:', value);
    
    // Test delete
    console.log('\n🗑️  Testing delete operation...');
    await redis.del('test:connection');
    console.log('✅ Delete successful');
    
    // Get server info
    console.log('\n📊 Redis server info:');
    const info = await redis.info('server');
    const lines = info.split('\n');
    for (const line of lines) {
      if (line.includes('redis_version:') || line.includes('tcp_port:')) {
        console.log('  ', line.trim());
      }
    }
    
    console.log('\n✅ All Redis tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Redis connection test failed:', error);
    
    if (error.message?.includes('ENOTFOUND redis.railway.internal')) {
      console.error('\n🔧 Solution: You are trying to connect to Railway\'s internal Redis hostname.');
      console.error('   This only works when deployed on Railway.');
      console.error('   For local development, use one of these options:');
      console.error('   1. Set REDIS_HOST=localhost (or 127.0.0.1)');
      console.error('   2. Use docker-compose to run Redis locally');
      console.error('   3. Set REDIS_URL to a public Redis instance URL');
    }
    
    process.exit(1);
  }
}

// Run the test
testRedis().catch(console.error);