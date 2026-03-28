const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send confirmation email to user
const sendUserConfirmation = async (userEmail, userName) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Contact Form'}" <${process.env.EMAIL_FROM}>`,
    to: userEmail,
    subject: 'Thank you for contacting us!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting Us</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #00b4d8;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Thank You! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Thank you for reaching out to us. We have received your message and will get back to you within 24-48 hours.</p>
          <p>Here's what we received:</p>
          <ul>
            <li><strong>Name:</strong> ${userName}</li>
            <li><strong>Email:</strong> ${userEmail}</li>
          </ul>
          <p>Our team will review your message and respond as soon as possible.</p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Thank you for contacting us!
      
      Hello ${userName},
      
      Thank you for reaching out to us. We have received your message and will get back to you within 24-48 hours.
      
      Here's what we received:
      - Name: ${userName}
      - Email: ${userEmail}
      
      Our team will review your message and respond as soon as possible.
      
      This is an automated confirmation email. Please do not reply to this message.
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
};

// Send notification to admin
const sendAdminNotification = async (contactData) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Contact Form" <${process.env.EMAIL_FROM}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Contact Message: ${contactData.subject || 'No Subject'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Message</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #f87171;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .info-box {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🔔 New Contact Form Submission</h2>
        </div>
        <div class="content">
          <div class="info-box">
            <h3>Contact Details:</h3>
            <p><strong>Name:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${contactData.subject || 'Not provided'}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <h3>Message:</h3>
          <p>${contactData.message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>You can reply to this email to respond to the sender.</small></p>
        </div>
      </body>
      </html>
    `,
    text: `
      New Contact Message
      
      Name: ${contactData.name}
      Email: ${contactData.email}
      Phone: ${contactData.phone || 'Not provided'}
      Subject: ${contactData.subject || 'Not provided'}
      
      Message:
      ${contactData.message}
      
      You can reply to this email to respond to the sender.
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent');
    return true;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return false;
  }
};

// Send reply to user
const sendReplyEmail = async (userEmail, userName, replyMessage) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Support Team" <${process.env.EMAIL_FROM}>`,
    to: userEmail,
    subject: 'Response to your inquiry',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Response to Your Inquiry</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .reply-box {
            background: #f3f4f6;
            padding: 20px;
            border-left: 4px solid #10b981;
            margin: 20px 0;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>📧 Response to Your Inquiry</h2>
        </div>
        <div class="content">
          <h3>Hello ${userName},</h3>
          <p>Thank you for reaching out to us. Here's our response to your inquiry:</p>
          <div class="reply-box">
            ${replyMessage.replace(/\n/g, '<br>')}
          </div>
          <p>If you have any further questions, feel free to reply to this email.</p>
          <p>Best regards,<br>Support Team</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Response to Your Inquiry
      
      Hello ${userName},
      
      Thank you for reaching out to us. Here's our response to your inquiry:
      
      ${replyMessage}
      
      If you have any further questions, feel free to reply to this email.
      
      Best regards,
      Support Team
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reply email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending reply email:', error);
    return false;
  }
};

module.exports = {
  sendUserConfirmation,
  sendAdminNotification,
  sendReplyEmail
};