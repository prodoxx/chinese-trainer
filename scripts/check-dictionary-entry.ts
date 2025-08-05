#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Dictionary from '../src/lib/db/models/Dictionary';

async function checkDictionaryEntry() {
  try {
    await connectDB();
    
    // Look for the character 行
    const entries = await Dictionary.find({ traditional: '行' });
    
    console.log(`\nFound ${entries.length} entries for 行:\n`);
    
    entries.forEach((entry, index) => {
      console.log(`Entry ${index + 1}:`);
      console.log(`  Pinyin: ${entry.pinyin}`);
      console.log(`  Definitions:`);
      entry.definitions.forEach((def: string, i: number) => {
        console.log(`    ${i + 1}. ${def}`);
      });
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDictionaryEntry();