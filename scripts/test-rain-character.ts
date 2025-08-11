#!/usr/bin/env bun

/**
 * Test script to verify the '下雨' (rain) character doesn't generate text in images
 */

import dotenv from 'dotenv';
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { generateSharedImage } from '../src/lib/enrichment/shared-media';
import { interpretChinese as interpretChineseWithProvider } from '../src/lib/ai/ai-provider';

dotenv.config();

async function testRainCharacter() {
  console.log('=== Testing 下雨 (rain) Image Generation ===\n');
  
  try {
    // Connect to database
    await connectDB();
    console.log('✓ Connected to MongoDB\n');

    const hanzi = '下雨';
    
    // Test with Ollama
    console.log('📝 Testing with Ollama Provider');
    console.log('=' .repeat(50));
    
    const ollamaConfig = {
      provider: 'ollama' as const,
      model: 'gpt-oss:20b',
      enabled: true
    };
    
    console.log('1. Getting interpretation from Ollama...');
    const interpretation = await interpretChineseWithProvider(hanzi, ollamaConfig);
    
    if (interpretation) {
      console.log(`   Meaning: ${interpretation.meaning}`);
      console.log(`   Pinyin: ${interpretation.pinyin}`);
      console.log(`   Original Image Prompt:\n   "${interpretation.imagePrompt}"\n`);
      
      // Check for problematic content
      const hasChineseChars = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(interpretation.imagePrompt || '');
      const hasTextReferences = /\b(written|text|characters|words|letters|writing|labeled)\b/i.test(interpretation.imagePrompt || '');
      
      if (hasChineseChars) {
        console.log('   ❌ Contains Chinese characters');
      } else {
        console.log('   ✅ No Chinese characters');
      }
      
      if (hasTextReferences) {
        console.log('   ⚠️  Contains text references\n');
      } else {
        console.log('   ✅ No text references\n');
      }
    }
    
    console.log('2. Generating image with cleaned prompt...');
    const imageResult = await generateSharedImage(
      hanzi,
      interpretation?.meaning || 'rain',
      interpretation?.pinyin || 'xià yǔ',
      true, // force
      undefined,
      'ollama'
    );
    
    if (imageResult.prompt) {
      console.log(`   Final Prompt Sent to fal.ai:\n   "${imageResult.prompt}"\n`);
      
      // Check final prompt
      const finalHasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(imageResult.prompt);
      const finalHasText = /\b(written|text|characters|words|letters|writing|labeled)\b/i.test(imageResult.prompt);
      
      if (finalHasChinese) {
        console.log('   ❌ FINAL PROMPT: Still contains Chinese characters!');
      } else {
        console.log('   ✅ FINAL PROMPT: Chinese characters removed');
      }
      
      if (finalHasText) {
        console.log('   ⚠️  FINAL PROMPT: May still reference text');
      } else {
        console.log('   ✅ FINAL PROMPT: Text references removed');
      }
    }
    
    if (imageResult.imageUrl) {
      console.log(`\n   ✓ Image generated: ${imageResult.imageUrl}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('Test complete!\n');
    
  } catch (error: any) {
    console.error('\n✗ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testRainCharacter().catch(console.error);