const contactService = require('../services/contactService');

class ContactController {
  // Submit new contact form
  async submitContact(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');
      
      const result = await contactService.createContact(
        req.body,
        ipAddress,
        userAgent
      );
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Get all contacts (admin)
  async getAllContacts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      
      const result = await contactService.getAllContacts(page, limit, status);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Get single contact (admin)
  async getContactById(req, res, next) {
    try {
      const result = await contactService.getContactById(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Reply to contact (admin)
  async replyToContact(req, res, next) {
    try {
      const { replyMessage } = req.body;
      const result = await contactService.replyToContact(
        req.params.id,
        replyMessage
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Delete contact (admin)
  async deleteContact(req, res, next) {
    try {
      const result = await contactService.deleteContact(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Get statistics (admin)
  async getStats(req, res, next) {
    try {
      const result = await contactService.getStats();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Bulk update status (admin)
  async bulkUpdateStatus(req, res, next) {
    try {
      const { ids, status } = req.body;
      
      if (!ids || !ids.length) {
        return res.status(400).json({
          success: false,
          message: 'No IDs provided'
        });
      }
      
      const result = await contactService.bulkUpdateStatus(ids, status);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContactController();