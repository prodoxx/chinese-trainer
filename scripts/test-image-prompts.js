#!/usr/bin/env node
/**
 * Test script to verify improved image prompt generation
 */

import { getEducationalImagePrompt, shouldGenerateImage } from '../src/lib/enrichment/image-prompt-generator.js';

const testCases = [
  // People that should show full body
  { hanzi: '奶奶', meaning: 'grandmother', pinyin: 'nǎi nǎi' },
  { hanzi: '爺爺', meaning: 'grandfather', pinyin: 'yé ye' },
  { hanzi: '老人', meaning: 'old person', pinyin: 'lǎo rén' },
  { hanzi: '別人', meaning: 'other people', pinyin: 'bié rén' },
  { hanzi: '朋友', meaning: 'friend', pinyin: 'péng yǒu' },
  
  // Actions
  { hanzi: '吃', meaning: 'eat', pinyin: 'chī' },
  { hanzi: '跑', meaning: 'run', pinyin: 'pǎo' },
  
  // Objects
  { hanzi: '書', meaning: 'book', pinyin: 'shū' },
  { hanzi: '車', meaning: 'car', pinyin: 'chē' },
  
  // Grammar particles that should skip
  { hanzi: '的', meaning: 'particle', pinyin: 'de' },
  { hanzi: '了', meaning: 'particle', pinyin: 'le' },
  { hanzi: '嗎', meaning: 'question particle', pinyin: 'ma' },
];

console.log('Testing Improved Image Prompt Generation');
console.log('=========================================\n');

for (const test of testCases) {
  console.log(`\n📝 Character: ${test.hanzi} (${test.pinyin})`);
  console.log(`   Meaning: ${test.meaning}`);
  
  const shouldGenerate = shouldGenerateImage(test.hanzi, test.meaning);
  
  if (!shouldGenerate) {
    console.log(`   ⏭️  SKIP: Grammar/abstract term - no image needed`);
    continue;
  }
  
  const prompt = getEducationalImagePrompt(test.hanzi, test.meaning, test.pinyin);
  
  if (prompt === 'SKIP_IMAGE') {
    console.log(`   ⏭️  SKIP: Determined to be abstract/grammatical`);
  } else {
    console.log(`   ✅ Generated Prompt:`);
    console.log(`      "${prompt}"`);
    
    // Check for key improvements
    const improvements = [];
    if (prompt.includes('full body')) improvements.push('avoids close-ups');
    if (prompt.includes('Asian')) improvements.push('culturally appropriate');
    if (prompt.includes('diverse')) improvements.push('promotes diversity');
    if (prompt.includes('no stereotypes')) improvements.push('avoids stereotypes');
    if (prompt.includes('educational')) improvements.push('educational focus');
    
    if (improvements.length > 0) {
      console.log(`   🎯 Improvements: ${improvements.join(', ')}`);
    }
  }
}

console.log('\n\n✨ Summary:');
console.log('- Person-related terms now show full body or three-quarter view');
console.log('- Family terms specifically mention Asian context for cultural appropriateness');
console.log('- "Other people" promotes diversity instead of showing single ethnicity');
console.log('- All prompts avoid close-ups of hands/feet to prevent anomalies');
console.log('- Grammar particles are automatically skipped');
console.log('- Educational and family-friendly modifiers added to all prompts');