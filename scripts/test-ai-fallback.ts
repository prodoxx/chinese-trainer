#!/usr/bin/env bun

/**
 * Test script to demonstrate AI provider fallback behavior
 * Shows how the system automatically falls back from Ollama to OpenAI
 */

import dotenv from 'dotenv';
import chalk from 'chalk';
import { interpretChinese, analyzeCharacterWithAI } from '../src/lib/ai/ai-provider';
import { AIProviderConfig } from '../src/lib/ai/ai-provider';

// Load environment variables
dotenv.config();

const TEST_CHARACTERS = ['學生', '老師', '朋友'];

async function testFallbackBehavior() {
  console.log(chalk.bold.cyan('\n🧪 Testing AI Provider Fallback Behavior\n'));
  console.log(chalk.gray('This test will attempt to use Ollama first, then fallback to OpenAI if needed.\n'));
  
  // Test with Ollama config
  const ollamaConfig: AIProviderConfig = {
    provider: 'ollama',
    model: 'gpt-oss:20b',
    enabled: true
  };
  
  console.log(chalk.bold.yellow('📝 Test 1: Interpretation with Ollama (may fallback to OpenAI)\n'));
  
  for (const char of TEST_CHARACTERS) {
    console.log(chalk.bold(`\nTesting character: ${char}`));
    console.log(chalk.gray('─'.repeat(50)));
    
    try {
      console.log(chalk.cyan('Attempting with Ollama...'));
      const result = await interpretChinese(char, ollamaConfig, 'education');
      
      if (result.meaning && result.meaning !== 'Unknown') {
        console.log(chalk.green(`✓ Success with ${result.meaning}`));
        console.log(chalk.gray(`  Pinyin: ${result.pinyin}`));
        console.log(chalk.gray(`  Context: ${result.context?.substring(0, 50)}...`));
      } else {
        console.log(chalk.yellow('⚠ Result quality issues detected'));
      }
    } catch (error) {
      console.log(chalk.red(`✗ Error: ${error}`));
    }
  }
  
  console.log(chalk.bold.yellow('\n📊 Test 2: Linguistic Analysis with Ollama (may fallback to OpenAI)\n'));
  
  const testChar = '學生';
  console.log(chalk.bold(`Testing linguistic analysis for: ${testChar}`));
  console.log(chalk.gray('─'.repeat(50)));
  
  try {
    console.log(chalk.cyan('Attempting linguistic analysis with Ollama...'));
    const analysis = await analyzeCharacterWithAI(testChar, ollamaConfig, 'beginner');
    
    if (analysis.etymology?.origin && analysis.etymology.origin !== 'Analysis unavailable') {
      console.log(chalk.green('✓ Analysis completed'));
      console.log(chalk.gray(`  Etymology: ${analysis.etymology.origin.substring(0, 100)}...`));
      console.log(chalk.gray(`  Has mnemonics: ${!!analysis.mnemonics?.visual}`));
      console.log(chalk.gray(`  Has learning tips: ${!!analysis.learningTips?.forBeginners?.length}`));
    } else {
      console.log(chalk.yellow('⚠ Analysis incomplete, check logs for fallback'));
    }
  } catch (error) {
    console.log(chalk.red(`✗ Error: ${error}`));
  }
  
  console.log(chalk.bold.yellow('\n📋 Test 3: Simulating Ollama Server Down\n'));
  console.log(chalk.gray('Stop Ollama server and run this test to see automatic fallback to OpenAI'));
  
  // Test with unavailable Ollama (simulated by using wrong port)
  const unavailableOllamaConfig: AIProviderConfig = {
    provider: 'ollama',
    model: 'gpt-oss:20b',
    enabled: true
  };
  
  // Temporarily override the Ollama host to simulate it being down
  const originalHost = process.env.OLLAMA_HOST;
  process.env.OLLAMA_HOST = 'http://localhost:99999'; // Invalid port
  
  try {
    console.log(chalk.cyan('Attempting with unavailable Ollama (should fallback)...'));
    const result = await interpretChinese('測試', unavailableOllamaConfig);
    console.log(chalk.green('✓ Successfully fell back to OpenAI'));
    console.log(chalk.gray(`  Result: ${result.meaning}`));
  } catch (error) {
    console.log(chalk.red(`✗ Fallback failed: ${error}`));
  } finally {
    // Restore original host
    if (originalHost) {
      process.env.OLLAMA_HOST = originalHost;
    } else {
      delete process.env.OLLAMA_HOST;
    }
  }
  
  console.log(chalk.bold.cyan('\n✨ Fallback Test Complete!\n'));
  console.log(chalk.gray('Check the console logs above for [AI Provider] messages showing fallback behavior.\n'));
}

// Run the test
testFallbackBehavior().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});