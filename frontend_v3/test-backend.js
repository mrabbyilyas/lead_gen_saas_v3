// Simple script to test backend connectivity
// Run with: node test-backend.js

const https = require('https');
const http = require('http');

// Test URLs
const urls = [
  'http://localhost:8000/health',
  'https://lead-gen-saas-backend-bagud5hkhwcaf9ey.canadacentral-01.azurewebsites.net/health'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`🔗 Testing: ${url}`);
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${url} - Status: ${res.statusCode}`);
        console.log(`📡 Response: ${data}`);
        resolve({ url, status: res.statusCode, data, success: true });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${url} - Error: ${error.message}`);
      resolve({ url, error: error.message, success: false });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏰ ${url} - Timeout`);
      resolve({ url, error: 'Timeout', success: false });
    });
  });
}

async function testBackends() {
  console.log('🚀 Testing backend connectivity...\n');
  
  for (const url of urls) {
    await testUrl(url);
    console.log(''); // Empty line
  }
  
  console.log('✅ Backend connectivity test complete!');
  console.log('\n💡 Recommendations:');
  console.log('1. If localhost fails: Start your backend server with "uvicorn app.main:app --reload"');
  console.log('2. If Azure fails: Check your Azure App Service deployment status');
  console.log('3. Update .env.local to use the working backend URL');
}

testBackends();