const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Contact Form API',
    version: '1.0.0',
    status: 'running',
    message: 'Server is working!'
  });
});

// Contact endpoint
app.post('/api/contact/submit', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  console.log('Received submission:', { name, email, phone, subject, message });
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and message are required'
    });
  }
  
  res.json({
    success: true,
    message: 'Message received successfully!'
  });
});

// Export for Vercel - THIS IS CRITICAL
module.exports = app;

// For local development only
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
  });
}