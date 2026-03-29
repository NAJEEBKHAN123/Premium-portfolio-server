const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());

// MongoDB connection with caching
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('📦 Using cached connection');
    return cachedDb;
  }
  
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ No MongoDB URI');
    return null;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB Connected');
    return cachedDb;
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
    return null;
  }
}

// Contact Schema
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String },
  message: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

// Email setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send emails function
async function sendEmails(name, email, phone, subject, message) {
  try {
    // 1. Send confirmation to the person who contacted you
    await transporter.sendMail({
      from: `"Najeeb Ullah" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Thank you for contacting me!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #00b4d8;">Thank You! 🎉</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for reaching out to me. I have received your message and will get back to you within 24-48 hours.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Your message:</strong></p>
            <p>${message}</p>
          </div>
          <p>Best regards,<br>Najeeb Ullah</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">This is an automated confirmation.</p>
        </div>
      `
    });
    console.log('✅ User confirmation email sent to:', email);
    
    // 2. Send notification to YOU (admin)
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_FROM}>`,
      to: process.env.ADMIN_EMAIL,
      subject: '🔔 New Contact Form Submission',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #f87171;">New Contact Form Submission</h2>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          </div>
          <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
        </div>
      `
    });
    console.log('✅ Admin notification email sent to:', process.env.ADMIN_EMAIL);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
}

// Health check
app.get('/health', async (req, res) => {
  const db = await connectToDatabase();
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongodb: db ? 'connected' : 'disconnected',
    email: 'configured',
    environment: process.env.NODE_ENV,
    version: 'full'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Contact Form API',
    version: '3.0.0',
    status: 'running',
    features: ['mongodb', 'email', 'cors'],
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Contact endpoint
app.post('/api/contact/submit', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  console.log('📝 Submission received:', { name, email });
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and message are required'
    });
  }
  
  try {
    // Save to MongoDB
    const db = await connectToDatabase();
    if (db) {
      const contact = new Contact({ name, email, phone, subject, message });
      await contact.save();
      console.log('✅ Saved to MongoDB');
    } else {
      console.log('⚠️ No database connection, skipping save');
    }
    
    // Send emails
    console.log('📧 Sending emails...');
    const emailResult = await sendEmails(name, email, phone, subject, message);
    
    if (emailResult.success) {
      console.log('✅ Emails sent successfully');
      res.json({
        success: true,
        message: 'Message sent! Check your email for confirmation.'
      });
    } else {
      console.log('⚠️ Email failed:', emailResult.error);
      res.json({
        success: true,
        message: 'Message saved, but email notification had issues. I will still get back to you.'
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Export for Vercel
module.exports = app;

// Local development only
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Full server with email running on port ${PORT}`);
  });
}