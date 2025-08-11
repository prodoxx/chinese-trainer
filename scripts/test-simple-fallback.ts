#!/usr/bin/env bun

/**
 * Simple test to show AI provider fallback logging
 */

import dotenv from 'dotenv';
import { interpretChinese } from '../src/lib/ai/ai-provider';
import { AIProviderConfig } from '../src/lib/ai/ai-provider';

dotenv.config();

async function testFallback() {
  console.log('\n=== Testing AI Provider Fallback ===\n');
  
  // Test 1: Ollama with potential fallback
  console.log('TEST 1: Using Ollama (may fallback if unavailable or returns poor result)');
  console.log('Watch for [AI Provider] log messages...\n');
  
  const ollamaConfig: AIProviderConfig = {
    provider: 'ollama',
    model: 'gpt-oss:20b',
    enabled: true
  };
  
  try {
    const result = await interpretChinese('學生', ollamaConfig, 'education');
    console.log('Result:', {
      meaning: result.meaning,
      pinyin: result.pinyin,
      hasContext: !!result.context
    });
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  
  // Test 2: Simulate Ollama being down
  console.log('\n\nTEST 2: Simulating Ollama server down (should fallback to OpenAI)');
  console.log('Watch for [AI Provider] fallback messages...\n');
  
  // Temporarily break Ollama connection
  const originalHost = process.env.OLLAMA_HOST;
  process.env.OLLAMA_HOST = 'http://localhost:99999';
  
  try {
    const result = await interpretChinese('老師', ollamaConfig, 'education');
    console.log('Result after fallback:', {
      meaning: result.meaning,
      pinyin: result.pinyin
    });
  } catch (error: any) {
    console.log('Error:', error.message);
  } finally {
    // Restore
    if (originalHost) {
      process.env.OLLAMA_HOST = originalHost;
    } else {
      delete process.env.OLLAMA_HOST;
    }
  }
  
  console.log('\n=== Test Complete ===\n');
  console.log('Summary:');
  console.log('- When Ollama is selected but unavailable, system falls back to OpenAI');
  console.log('- When Ollama returns "Unknown" or poor quality, system falls back to OpenAI');
  console.log('- All fallbacks are logged with [AI Provider] prefix');
  console.log('- This ensures bulk imports never fail due to Ollama issues\n');
}

testFallback().catch(console.error);