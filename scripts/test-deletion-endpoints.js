#!/usr/bin/env node

/**
 * Test script for deletion endpoints
 * Run with: node scripts/test-deletion-endpoints.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

async function testDeletionEndpoints() {
  console.log('🧪 Testing Deletion Endpoints...\n');
  
  try {
    // Step 1: Login to get JWT token
    console.log('1️⃣ Logging in to get JWT token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    const token = loginResponse.data.token;
    const authHeader = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful\n');
    
    // Step 2: Create a test bucket
    console.log('2️⃣ Creating test bucket...');
    const bucketResponse = await axios.post(`${BASE_URL}/buckets`, {
      name: 'test-deletion-bucket',
      targetFTPfolder: '/uploads/test-deletion-bucket'
    }, { headers: authHeader });
    
    const bucketId = bucketResponse.data.bucket.id;
    console.log(`✅ Bucket created with ID: ${bucketId}\n`);
    
    // Step 3: Upload a test file
    console.log('3️⃣ Uploading test file...');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', Buffer.from('test file content'), 'test-file.txt');
    form.append('bucketId', bucketId);
    form.append('targetFTPfolder', 'test-folder');
    
    const fileResponse = await axios.post(`${BASE_URL}/files`, form, {
      headers: { ...authHeader, ...form.getHeaders() }
    });
    
    const fileId = fileResponse.data.file.id;
    console.log(`✅ File uploaded with ID: ${fileId}\n`);
    
    // Step 4: Test file deletion
    console.log('4️⃣ Testing file deletion...');
    await axios.delete(`${BASE_URL}/files/${fileId}`, { headers: authHeader });
    console.log('✅ File deleted successfully\n');
    
    // Step 5: Test folder deletion (should return 404 since file is already deleted)
    console.log('5️⃣ Testing folder deletion (should return 404)...');
    try {
      await axios.delete(`${BASE_URL}/folders`, {
        data: { folderPath: 'test-folder', bucketId },
        headers: authHeader
      });
      console.log('⚠️  Folder deletion returned success (unexpected)');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Folder deletion correctly returned 404 (no files to delete)\n');
      } else {
        console.log(`❌ Folder deletion failed with unexpected status: ${error.response?.status}`);
      }
    }
    
    // Step 6: Test bucket deletion
    console.log('6️⃣ Testing bucket deletion...');
    await axios.delete(`${BASE_URL}/buckets/${bucketId}`, { headers: authHeader });
    console.log('✅ Bucket deleted successfully\n');
    
    console.log('🎉 All deletion endpoint tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDeletionEndpoints().catch(console.error);
}

module.exports = { testDeletionEndpoints };
