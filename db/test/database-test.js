// Simple Database Test for Choosy
// Tests database connectivity and basic operations

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Test configuration
const TEST_DATA = {
  user: {
    phone: '+15551234567',
    name: 'Test User'
  },
  plan: {
    topic: 'foodie',
    group_size: 'solo',
    zip_code: '10001',
    host_name: 'Test Host',
    host_phone: '+15551234567'
  }
};

// Test 1: Environment Variables
function testEnvironmentVariables() {
  console.log('🔧 Testing environment variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:', missing.join(', '));
    return false;
  }
  
  console.log('✅ Environment variables configured');
  return true;
}

// Test 2: Backend API Health
async function testBackendAPI() {
  console.log('\n🔌 Testing backend API...');
  
  try {
    const response = await fetch('http://localhost:8000/docs');
    
    if (!response.ok) {
      console.log('❌ Backend API not accessible');
      return false;
    }
    
    console.log('✅ Backend API accessible');
    return true;
  } catch (err) {
    console.log('❌ Backend API error:', err.message);
    return false;
  }
}

// Test 3: Frontend API Health
async function testFrontendAPI() {
  console.log('\n🌐 Testing frontend API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/createPlan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_DATA.plan)
    });
    
    if (!response.ok) {
      console.log('❌ Frontend API not accessible');
      return false;
    }
    
    console.log('✅ Frontend API accessible');
    return true;
  } catch (err) {
    console.log('❌ Frontend API error:', err.message);
    return false;
  }
}

// Test 4: Database Connection via Backend
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing database connection...');
  
  try {
    const response = await fetch('http://localhost:8000/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_DATA.plan)
    });
    
    if (response.ok) {
      console.log('✅ Database connection working');
      return true;
    } else {
      console.log('❌ Database connection failed:', response.status);
      return false;
    }
  } catch (err) {
    console.log('❌ Database connection error:', err.message);
    return false;
  }
}

// Test 5: Performance Check
async function testPerformance() {
  console.log('\n⚡ Testing API performance...');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:8000/');
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ API response in ${duration}ms`);
      return duration < 2000; // Should complete in under 2 seconds
    } else {
      console.log('❌ Performance test failed');
      return false;
    }
  } catch (err) {
    console.log('❌ Performance test error:', err.message);
    return false;
  }
}

// Main test runner
async function runDatabaseTests() {
  console.log('🚀 Starting Choosy Database Tests...\n');
  
  const results = {
    environment: testEnvironmentVariables(),
    backend: await testBackendAPI(),
    frontend: await testFrontendAPI(),
    database: await testDatabaseConnection(),
    performance: await testPerformance()
  };
  
  // Summary
  console.log('\n📊 Test Results:');
  console.log('================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${test}: ${status}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Database is ready!');
    return true;
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
    console.log('\n💡 Make sure:');
    console.log('  - Backend is running: cd backend && python main.py');
    console.log('  - Frontend is running: npm run dev');
    console.log('  - Environment variables are set in .env');
    return false;
  }
}

// Export for use in other files
module.exports = {
  testEnvironmentVariables,
  testBackendAPI,
  testFrontendAPI,
  testDatabaseConnection,
  testPerformance,
  runDatabaseTests
};

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runDatabaseTests();
} 