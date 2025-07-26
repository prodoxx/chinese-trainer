// Test the placeholder image directly
const testUrl = 'https://dummyimage.com/400x400/333333/ffffff&text=說';

async function testPlaceholder() {
  console.log('Testing dummyimage.com placeholder...\n');
  console.log(`URL: ${testUrl}`);
  
  try {
    const response = await fetch(testUrl);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      console.log('✅ Placeholder image service is working!');
    } else {
      console.log('❌ Placeholder image service returned error');
    }
  } catch (error) {
    console.error('Failed to fetch placeholder:', error);
  }
  
  // Also test with encoded Chinese
  const encodedUrl = `https://dummyimage.com/400x400/333333/ffffff&text=${encodeURIComponent('說')}`;
  console.log(`\nTesting with encoded Chinese character...`);
  console.log(`URL: ${encodedUrl}`);
  
  try {
    const response = await fetch(encodedUrl);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
  } catch (error) {
    console.error('Failed to fetch encoded placeholder:', error);
  }
}

testPlaceholder().catch(console.error);