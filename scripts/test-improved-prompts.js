#!/usr/bin/env node
/**
 * Test demonstration of improved image prompt generation
 */

console.log('Improved Image Prompt Generation Examples');
console.log('==========================================\n');

const examples = [
  {
    character: '奶奶',
    oldPrompt: 'A simple, clear illustration of the Chinese character 奶奶 (grandmother)',
    newPrompt: 'A warm, friendly Asian elderly grandmother smiling, wearing comfortable clothes, sitting in a cozy living room with traditional decorations, full body view, high quality, educational illustration, clear and simple, appropriate for language learning, family-friendly, respectful, culturally appropriate, no stereotypes'
  },
  {
    character: '爺爺',
    oldPrompt: 'A simple, clear illustration of the Chinese character 爺爺 (grandfather)',
    newPrompt: 'A kind Asian elderly grandfather with gentle expression, wearing traditional or casual clothes, sitting or standing in a home setting, full body view, high quality, educational illustration, clear and simple, appropriate for language learning, family-friendly, respectful, culturally appropriate, no stereotypes'
  },
  {
    character: '老人',
    oldPrompt: 'elderly person with weathered hands',
    newPrompt: 'A wise elderly Asian person with peaceful expression, sitting on a park bench or in a garden, full body view showing dignity and respect, high quality, educational illustration, clear and simple, appropriate for language learning, family-friendly, respectful, culturally appropriate, no stereotypes'
  },
  {
    character: '別人',
    oldPrompt: 'other people',
    newPrompt: 'A diverse group of different people of various ages and ethnicities standing together in a public space, showing community and diversity, high quality, educational illustration, clear and simple, appropriate for language learning, family-friendly, respectful, culturally appropriate, no stereotypes'
  }
];

examples.forEach((example, index) => {
  console.log(`\n${index + 1}. Character: ${example.character}`);
  console.log('   ❌ OLD PROMPT (problematic):');
  console.log(`      "${example.oldPrompt}"`);
  console.log('   ✅ NEW PROMPT (improved):');
  console.log(`      "${example.newPrompt}"`);
  console.log('   🎯 Key Improvements:');
  console.log('      - Shows full body to avoid hand/feet anomalies');
  console.log('      - Culturally appropriate representation');
  console.log('      - Educational and respectful tone');
  console.log('      - Promotes diversity where applicable');
});

console.log('\n\n📋 Summary of Improvements:');
console.log('============================================');
console.log('1. PEOPLE DETECTION: Automatically detects person-related terms');
console.log('2. FULL BODY VIEWS: Avoids close-ups that cause AI anomalies');
console.log('3. CULTURAL SENSITIVITY: Uses appropriate Asian context for family terms');
console.log('4. DIVERSITY: Shows diverse groups for "other people" concepts');
console.log('5. EDUCATIONAL FOCUS: All prompts optimized for language learning');
console.log('6. SAFETY: Adds family-friendly and no-stereotype modifiers');
console.log('7. SKIP ABSTRACT: Grammar particles automatically skipped');
console.log('\n✨ These improvements ensure better quality images that:');
console.log('   - Help learners instantly understand the meaning');
console.log('   - Avoid AI-generated anomalies (bad hands/feet)');
console.log('   - Respect cultural context');
console.log('   - Promote inclusivity and diversity');