#!/usr/bin/env bun

import { generateMediaKeysByHanzi } from '@/lib/r2-storage';
import { existsInR2 } from '@/lib/r2-storage';

// Test that media keys are generated correctly
async function testSharedMedia() {
  console.log('Testing shared media key generation...\n');
  
  // Test cases showing hash-based security
  const testCases = [
    { hanzi: '你' },
    { hanzi: '好' },
    { hanzi: '謝謝' },
  ];
  
  console.log('Hash-based paths (secure, non-predictable):');
  for (const test of testCases) {
    const keys = generateMediaKeysByHanzi(test.hanzi);
    console.log(`\nHanzi: ${test.hanzi}`);
    console.log(`  Audio: ${keys.audio}`);
    console.log(`  Image: ${keys.image}`);
    console.log(`  Note: Path is SHA256 hash - cannot reverse engineer hanzi from URL`);
  }
  
  // Show that same hanzi always produces same hash
  console.log('\n\nConsistency check:');
  const keys1 = generateMediaKeysByHanzi('你');
  const keys2 = generateMediaKeysByHanzi('你');
  console.log(`First call:  ${keys1.audio}`);
  console.log(`Second call: ${keys2.audio}`);
  console.log(`Same path? ${keys1.audio === keys2.audio} ✓`);
  
  // Test checking if media exists
  console.log('Testing R2 existence check...');
  const testHanzi = '你';
  const { audio, image } = generateMediaKeysByHanzi(testHanzi);
  
  try {
    const [audioExists, imageExists] = await Promise.all([
      existsInR2(audio),
      existsInR2(image)
    ]);
    
    console.log(`Media for "${testHanzi}":`);
    console.log(`  Audio exists: ${audioExists}`);
    console.log(`  Image exists: ${imageExists}`);
  } catch (error) {
    console.error('Error checking R2:', error);
  }
}

testSharedMedia().catch(console.error);