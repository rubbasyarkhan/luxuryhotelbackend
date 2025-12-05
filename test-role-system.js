import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/user';

// Test data
const testUsers = {
  admin: {
    name: 'Test Admin',
    email: 'testadmin@luxurystay.com',
    password: 'admin123',
    role: 'Admin'
  },
  manager: {
    name: 'Test Manager',
    email: 'testmanager@luxurystay.com',
    password: 'manager123',
    role: 'Manager'
  },
  receptionist: {
    name: 'Test Receptionist',
    email: 'testreceptionist@luxurystay.com',
    password: 'receptionist123',
    role: 'Receptionist'
  },
  housekeeping: {
    name: 'Test Housekeeping',
    email: 'testhousekeeping@luxurystay.com',
    password: 'housekeeping123',
    role: 'Housekeeping'
  },
  guest: {
    name: 'Test Guest',
    email: 'testguest@luxurystay.com',
    password: 'guest123',
    role: 'Guest'
  }
};

let tokens = {};

// Helper function to make authenticated requests
const makeAuthRequest = (token, endpoint, method = 'GET') => {
  return axios({
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Test user registration
const registerUser = async (userData) => {
  try {
    const formData = new FormData();
    formData.append('name', userData.name);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('role', userData.role);
    formData.append('profileImage', 'test-image.jpg'); // Mock image

    const response = await axios.post(`${BASE_URL}/Signup`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log(`✅ ${userData.role} registration successful:`, response.data.message);
    return response.data.user.token;
  } catch (error) {
    console.log(`❌ ${userData.role} registration failed:`, error.response?.data?.message || error.message);
    return null;
  }
};

// Test user login
const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/Login`, { email, password });
    console.log(`✅ Login successful for ${email}:`, response.data.message);
    return response.data.user.token;
  } catch (error) {
    console.log(`❌ Login failed for ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
};

// Test role-based access
const testRoleAccess = async (role, token) => {
  console.log(`\n🔐 Testing access for ${role}...`);
  
  const endpoints = [
    '/admin/dashboard',
    '/manager/dashboard', 
    '/receptionist/dashboard',
    '/housekeeping/dashboard',
    '/guest/dashboard',
    '/users'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeAuthRequest(token, endpoint);
      console.log(`✅ ${role} can access ${endpoint}: ${response.data.message}`);
    } catch (error) {
      console.log(`❌ ${role} cannot access ${endpoint}: ${error.response?.data?.message || 'Access denied'}`);
    }
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Role-Based Authentication Tests...\n');

  // Register test users
  console.log('📝 Registering test users...');
  for (const [role, userData] of Object.entries(testUsers)) {
    const token = await registerUser(userData);
    if (token) {
      tokens[role] = token;
    }
  }

  // Login test users
  console.log('\n🔑 Logging in test users...');
  for (const [role, userData] of Object.entries(testUsers)) {
    const token = await loginUser(userData.email, userData.password);
    if (token) {
      tokens[role] = token;
    }
  }

  // Test role-based access
  console.log('\n🎯 Testing role-based access...');
  for (const [role, token] of Object.entries(tokens)) {
    if (token) {
      await testRoleAccess(role, token);
    }
  }

  console.log('\n✨ Role-based authentication tests completed!');
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export default runTests;
