const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB...');
    console.log(`📡 Using URI: ${process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide credentials
    
    // For Mongoose 7+, we don't need these options
    // They are now the default behavior
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    
    // Check for specific error types
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 MongoDB server selection error. This usually means:');
      console.log('1. MongoDB is not running');
      console.log('2. Wrong connection string');
      console.log('3. Network/firewall issues\n');
      
      console.log('🔧 To fix this:');
      console.log('• Make sure MongoDB is installed and running');
      console.log('• For local MongoDB: Run "mongod" in a new terminal');
      console.log('• For MongoDB Atlas: Check your connection string and IP whitelist');
    }
    
    console.log('\n🔄 Retrying connection in 5 seconds...');
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect to MongoDB...');
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;