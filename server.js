const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const contactRoutes = require('./routes/contactRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Check if MongoDB URI exists
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
}

// Parse allowed origins from environment variable (comma-separated list)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

console.log('✅ Allowed CORS origins:', allowedOrigins);

// Connect to MongoDB (with retry logic for serverless)
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('📦 Using cached database connection');
    return cachedDb;
  }
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB Connected');
    return cachedDb;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't throw, just return null to handle gracefully
    return null;
  }
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// ============================================
// FIXED CORS CONFIGURATION
// ============================================
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins[0] === '*') {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (adjust for serverless)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5,
  message: { success: false, message: 'Too many contact requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/contact/submit', limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const db = await connectToDatabase();
    res.status(200).json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      mongodb: db ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
      allowedOrigins: allowedOrigins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'Error',
      message: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Contact Form API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      submit: 'POST /api/contact/submit',
      admin: 'GET /api/contact/admin/submissions (requires auth)'
    }
  });
});

// Routes
app.use('/api/contact', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
}, contactRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorMiddleware);

// IMPORTANT: For Vercel serverless, export the app directly
// DO NOT call app.listen() in production
module.exports = app;

// For local development only - this will NOT run on Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
  });
}