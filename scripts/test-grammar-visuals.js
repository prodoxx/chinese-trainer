#!/usr/bin/env bun
/**
 * Test demonstration of visual representations for grammar particles and abstract terms
 */

console.log('Visual Representations for Grammar & Abstract Terms');
console.log('====================================================\n');

const examples = [
  {
    category: 'Question Particles',
    items: [
      { hanzi: '嗎', meaning: 'question particle', visual: 'Large colorful question mark floating above confused person' },
      { hanzi: '呢', meaning: 'question particle', visual: 'Thoughtful person with hand on chin and question bubbles' },
      { hanzi: '吧', meaning: 'suggestion particle', visual: 'Person with open palms making a suggestion gesture' }
    ]
  },
  {
    category: 'Modal Verbs',
    items: [
      { hanzi: '可以', meaning: 'can/may', visual: 'Green thumbs up with checkmark (permission)' },
      { hanzi: '能', meaning: 'able to', visual: 'Person flexing muscles showing capability' },
      { hanzi: '會', meaning: 'know how to', visual: 'Lightbulb above head showing knowledge' },
      { hanzi: '要', meaning: 'want/need', visual: 'Reaching hands toward desired object' },
      { hanzi: '應該', meaning: 'should', visual: 'Scale of justice or moral compass' },
      { hanzi: '必須', meaning: 'must', visual: 'Red exclamation mark with urgent gesture' }
    ]
  },
  {
    category: 'Pronouns',
    items: [
      { hanzi: '我', meaning: 'I/me', visual: 'Person pointing to themselves' },
      { hanzi: '你', meaning: 'you', visual: 'Person pointing toward viewer' },
      { hanzi: '他', meaning: 'he', visual: 'Person pointing to male figure' },
      { hanzi: '她', meaning: 'she', visual: 'Person pointing to female figure' },
      { hanzi: '我們', meaning: 'we', visual: 'Group with arms around each other' }
    ]
  },
  {
    category: 'Aspect Markers',
    items: [
      { hanzi: '了', meaning: 'completed', visual: 'Checkmark with clock showing past time' },
      { hanzi: '過', meaning: 'experienced', visual: 'Footprints leading away (been there)' },
      { hanzi: '著', meaning: 'continuous', visual: 'Action frozen with motion blur' }
    ]
  },
  {
    category: 'Relationships',
    items: [
      { hanzi: '的', meaning: 'possessive', visual: 'Arrow linking two objects (possession)' },
      { hanzi: '把', meaning: 'disposal', visual: 'Hands grasping and moving object' },
      { hanzi: '被', meaning: 'passive', visual: 'Object with arrows pointing to it' },
      { hanzi: '給', meaning: 'give', visual: 'Hands offering something to another' }
    ]
  },
  {
    category: 'Conjunctions',
    items: [
      { hanzi: '和', meaning: 'and', visual: 'Two objects connected by plus sign' },
      { hanzi: '或', meaning: 'or', visual: 'Fork in the road showing choice' },
      { hanzi: '但是', meaning: 'but', visual: 'Road with barrier showing contrast' },
      { hanzi: '因為', meaning: 'because', visual: 'Cause-and-effect diagram with arrows' },
      { hanzi: '所以', meaning: 'therefore', visual: 'Conclusion symbol with result arrows' }
    ]
  },
  {
    category: 'Negation',
    items: [
      { hanzi: '不', meaning: 'not', visual: 'Red X or prohibition sign' },
      { hanzi: '沒', meaning: 'not have', visual: 'Empty container or crossed-out object' }
    ]
  },
  {
    category: 'Comparison',
    items: [
      { hanzi: '比', meaning: 'compare', visual: 'Balance scale showing comparison' },
      { hanzi: '更', meaning: 'more', visual: 'Upward arrow showing progression' },
      { hanzi: '最', meaning: 'most', visual: 'Gold medal or #1 trophy' }
    ]
  }
];

examples.forEach(category => {
  console.log(`\n📚 ${category.category}`);
  console.log('─'.repeat(50));
  
  category.items.forEach(item => {
    console.log(`\n  ${item.hanzi} (${item.meaning})`);
    console.log(`  🎨 Visual: ${item.visual}`);
  });
});

console.log('\n\n✨ Key Benefits of Visual Representations:');
console.log('============================================');
console.log('1. MEMORABLE: Visual metaphors help students remember abstract concepts');
console.log('2. UNIVERSAL: Symbols like ✓, ❌, 👍 are globally understood');
console.log('3. EDUCATIONAL: Each image reinforces the grammatical function');
console.log('4. INCLUSIVE: No text means it works for all language backgrounds');
console.log('5. CREATIVE: Turns "boring" grammar into engaging visuals');
console.log('\n💡 Examples of How This Helps Learning:');
console.log('- 嗎 with question mark → instantly understood as question particle');
console.log('- 可以 with thumbs up → clearly shows permission/possibility');
console.log('- 不 with red X → universal "not" symbol everyone recognizes');
console.log('- 的 with connecting arrow → visualizes possession relationship');
console.log('- 了 with checkmark → shows completion/past action');