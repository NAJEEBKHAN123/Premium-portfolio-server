// test-connection.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection\n');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI is missing in .env file');
    return;
  }
  
  // Show masked URI
  const maskedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log('Connection string:', maskedUri);
  console.log('');
  
  try {
    console.log('🔄 Attempting to connect...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    await mongoose.disconnect();
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.log('\n💡 FIX: Wrong username or password');
      console.log('1. Go to https://cloud.mongodb.com');
      console.log('2. Click "Database Access"');
      console.log('3. Edit user and reset password');
      console.log('4. Update .env with new password');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 FIX: Wrong cluster name or network issue');
      console.log('1. Check your cluster name: user-management-cluster');
      console.log('2. Check your internet connection');
    }
    
    if (error.message.includes('getaddrinfo')) {
      console.log('\n💡 FIX: DNS resolution failed');
      console.log('1. Check your connection string format');
      console.log('2. Make sure you have internet access');
    }
  }
}

testConnection();