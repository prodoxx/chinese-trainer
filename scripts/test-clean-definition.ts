#!/usr/bin/env bun
import { cleanDefinition } from '../src/lib/utils/clean-definition';

const testCases = [
  'used in 道行[dao4heng2]',
  'to accumulate (e.g. 累積[lei3ji1])',
  'simple text without pinyin',
  'multiple refs: 累積[lei3ji1] and 道行[dao4heng2]',
  'complex tone: 不好[bu4hao3]'
];

console.log('Testing cleanDefinition function:\n');

testCases.forEach(test => {
  const cleaned = cleanDefinition(test);
  console.log(`Original: ${test}`);
  console.log(`Cleaned:  ${cleaned}`);
  console.log('---');
});