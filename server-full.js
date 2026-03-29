// At the top of server-full.js, update the email sending function
const { sendUserConfirmation, sendAdminNotification } = require('./utils/emailService');

// In your contact endpoint, replace the email sending code:
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
      const contact = new Contact({ 
        name, 
        email, 
        phone, 
        subject, 
        message,
        createdAt: new Date() // This will be UTC in DB, but we'll format when displaying
      });
      await contact.save();
      console.log('✅ Saved to MongoDB');
    }
    
    // Send emails with correct time zone
    console.log('📧 Sending emails...');
    
    // Send confirmation to user
    await sendUserConfirmation(email, name, message);
    
    // Send notification to admin
    await sendAdminNotification({ name, email, phone, subject, message });
    
    console.log('✅ All emails sent');
    res.json({
      success: true,
      message: 'Message sent! Check your email for confirmation.',
      submittedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});