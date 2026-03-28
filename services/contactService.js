// services/contactService.js
const Contact = require('../models/Contact');  // Make sure this import is correct
const emailService = require('../utils/emailService');

class ContactService {
  // Create new contact message
  async createContact(data, ipAddress, userAgent) {
    try {
      // Make sure Contact model is imported
      if (!Contact) {
        throw new Error('Contact model is not loaded');
      }
      
      const contact = new Contact({
        ...data,
        ipAddress,
        userAgent
      });
      
      await contact.save();
      
      // Send emails asynchronously (don't wait for response)
      Promise.all([
        emailService.sendUserConfirmation(data.email, data.name),
        emailService.sendAdminNotification(data)
      ]).catch(err => console.error('Email sending failed:', err));
      
      return {
        success: true,
        data: contact,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error in createContact:', error);
      throw error;
    }
  }
  
  // Get all contacts with pagination and filtering
  async getAllContacts(page = 1, limit = 10, status = null) {
    try {
      const query = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      
      const skip = (page - 1) * limit;
      
      const [contacts, total] = await Promise.all([
        Contact.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Contact.countDocuments(query)
      ]);
      
      return {
        success: true,
        data: contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Get single contact by ID
  async getContactById(id) {
    try {
      const contact = await Contact.findById(id);
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      // Mark as read if it's pending
      if (contact.status === 'pending') {
        contact.status = 'read';
        await contact.save();
      }
      
      return {
        success: true,
        data: contact
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Reply to contact
  async replyToContact(id, replyMessage) {
    try {
      const contact = await Contact.findById(id);
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      await contact.markAsReplied(replyMessage);
      
      // Send reply email
      await emailService.sendReplyEmail(
        contact.email,
        contact.name,
        replyMessage
      );
      
      return {
        success: true,
        data: contact,
        message: 'Reply sent successfully'
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Delete contact
  async deleteContact(id) {
    try {
      const contact = await Contact.findByIdAndDelete(id);
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      return {
        success: true,
        message: 'Contact deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Get statistics
  async getStats() {
    try {
      const stats = await Contact.getStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Bulk update status
  async bulkUpdateStatus(ids, status) {
    try {
      await Contact.updateMany(
        { _id: { $in: ids } },
        { status }
      );
      
      return {
        success: true,
        message: `${ids.length} contacts updated successfully`
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ContactService();