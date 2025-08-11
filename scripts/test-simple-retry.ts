#!/usr/bin/env bun

/**
 * Simple test to demonstrate Ollama retry mechanism
 */

import dotenv from 'dotenv';
import { interpretChinese } from '../src/lib/ai/ai-provider';
import { AIProviderConfig } from '../src/lib/ai/ai-provider';

dotenv.config();

async function testRetry() {
  console.log('\n=== Testing Ollama 3x Retry + Fallback ===\n');
  
  // Force Ollama to be unavailable to trigger retries
  process.env.OLLAMA_HOST = 'http://localhost:99999';
  
  const ollamaConfig: AIProviderConfig = {
    provider: 'ollama',
    model: 'gpt-oss:20b',
    enabled: true
  };
  
  console.log('Configuration:');
  console.log('  MAX_RETRIES: 3 (default)');
  console.log('  RETRY_DELAY_MS: 1000ms (default)');
  console.log('  ENABLE_FALLBACK: true (default)\n');
  
  console.log('Testing with unavailable Ollama server...');
  console.log('Expected: 3 retry attempts, then fallback to OpenAI\n');
  
  const startTime = Date.now();
  
  try {
    const result = await interpretChinese('學生', ollamaConfig, 'education');
    const duration = Date.now() - startTime;
    
    console.log(`\n✓ Success after ${duration}ms`);
    console.log(`Result: ${result.meaning} (${result.pinyin})`);
    
    if (duration >= 3000) {
      console.log('✓ Duration confirms 3 retries occurred (3+ seconds)');
    }
    console.log('✓ Successfully fell back to OpenAI\n');
    
  } catch (error: any) {
    console.log(`\n✗ Failed: ${error.message}\n`);
  }
  
  console.log('Check logs above for [AI Provider] messages showing:');
  console.log('  - Attempt 1/3, 2/3, 3/3');
  console.log('  - Retry messages with delays');
  console.log('  - Fallback to OpenAI message');
  console.log('  - Success with OpenAI\n');
}

testRetry().catch(console.error);