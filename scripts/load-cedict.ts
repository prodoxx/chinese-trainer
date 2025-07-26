import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import Dictionary from '../src/lib/db/models/Dictionary';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese_app';
const CEDICT_FILE = './data/cedict_ts.u8';

async function loadCEDICT() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  
  console.log('Clearing existing dictionary entries...');
  await Dictionary.deleteMany({});
  
  const fileStream = fs.createReadStream(CEDICT_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let count = 0;
  const batch: any[] = [];
  const BATCH_SIZE = 1000;
  
  console.log('Loading CC-CEDICT entries...');
  
  for await (const line of rl) {
    // Skip comments
    if (line.startsWith('#') || !line.trim()) continue;
    
    // Parse line format: Traditional Simplified [pinyin] /definition1/definition2/
    const match = line.match(/^(.+?) (.+?) \[(.+?)\] \/(.+)\/$/);
    
    if (match) {
      const [, traditional, simplified, pinyin, definitionsStr] = match;
      const definitions = definitionsStr.split('/').filter(d => d.trim());
      
      batch.push({
        traditional: traditional.trim(),
        simplified: simplified.trim(),
        pinyin: pinyin.trim(),
        definitions
      });
      
      if (batch.length >= BATCH_SIZE) {
        await Dictionary.insertMany(batch);
        count += batch.length;
        batch.length = 0;
        
        if (count % 10000 === 0) {
          console.log(`Loaded ${count} entries...`);
        }
      }
    }
  }
  
  // Insert remaining batch
  if (batch.length > 0) {
    await Dictionary.insertMany(batch);
    count += batch.length;
  }
  
  console.log(`\nSuccessfully loaded ${count} dictionary entries!`);
  
  // Test a few lookups
  console.log('\nTesting lookups:');
  const testChars = ['我', '你', '好', '愛', '學'];
  
  for (const char of testChars) {
    const entry = await Dictionary.findOne({ traditional: char });
    if (entry) {
      console.log(`${char}: ${entry.pinyin} - ${entry.definitions[0]}`);
    }
  }
  
  await mongoose.connection.close();
  console.log('\nDone!');
}

loadCEDICT().catch(console.error);