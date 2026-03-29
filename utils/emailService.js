const nodemailer = require('nodemailer');

// Helper function to get Pakistan time
const getPakistanTime = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
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
};

// Send user confirmation
const sendUserConfirmation = async (userEmail, userName, message) => {
  const transporter = createTransporter();
  const pakistanTime = getPakistanTime();
  
  const mailOptions = {
    from: `"Najeeb Ullah" <${process.env.EMAIL_FROM}>`,
    to: userEmail,
    subject: 'Thank you for contacting me!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #00b4d8;">Thank You! 🎉</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Thank you for reaching out to me. I have received your message and will get back to you within 24-48 hours.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Your message:</strong></p>
          <p>${message}</p>
        </div>
        <p><small>Submitted: ${pakistanTime} (Pakistan Time)</small></p>
        <p>Best regards,<br>Najeeb Ullah</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is an automated confirmation. Please do not reply.</p>
      </div>
    `,
    text: `Thank you for contacting me!\n\nHello ${userName},\n\nThank you for your message. I will get back to you within 24-48 hours.\n\nYour message: ${message}\n\nSubmitted: ${pakistanTime} (Pakistan Time)\n\nBest regards,\nNajeeb Ullah`
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ User confirmation sent');
    return true;
  } catch (error) {
    console.error('❌ User email error:', error);
    return false;
  }
};

// Send admin notification
const sendAdminNotification = async (contactData) => {
  const transporter = createTransporter();
  const pakistanTime = getPakistanTime();
  
  const mailOptions = {
    from: `"Portfolio Contact" <${process.env.EMAIL_FROM}>`,
    to: process.env.ADMIN_EMAIL,
    subject: '🔔 New Contact Form Submission',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #f87171;">New Contact Form Submission</h2>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Name:</strong> ${contactData.name}</p>
          <p><strong>Email:</strong> ${contactData.email}</p>
          <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${contactData.subject || 'Not provided'}</p>
          <p><strong>Message:</strong></p>
          <p style="background: white; padding: 10px; border-radius: 5px;">${contactData.message}</p>
        </div>
        <p><small>Submitted at: ${pakistanTime} (Pakistan Time)</small></p>
        <hr>
        <p><small>You can reply to this email to respond to the sender.</small></p>
      </div>
    `,
    text: `New Contact Form Submission\n\nName: ${contactData.name}\nEmail: ${contactData.email}\nPhone: ${contactData.phone || 'Not provided'}\nSubject: ${contactData.subject || 'Not provided'}\n\nMessage:\n${contactData.message}\n\nSubmitted at: ${pakistanTime} (Pakistan Time)`
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent');
    return true;
  } catch (error) {
    console.error('❌ Admin email error:', error);
    return false;
  }
};

module.exports = {
  sendUserConfirmation,
  sendAdminNotification
};