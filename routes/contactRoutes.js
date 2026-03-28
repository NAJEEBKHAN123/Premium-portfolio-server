const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { validateContact, validateReply, handleValidationErrors } = require('../middleware/validationMiddleware');

// Public routes
router.post(
  '/submit',
  validateContact,
  handleValidationErrors,
  contactController.submitContact
);

// Admin routes (you might want to add authentication middleware here)
router.get('/admin/contacts', contactController.getAllContacts);
router.get('/admin/contacts/:id', contactController.getContactById);
router.post(
  '/admin/contacts/:id/reply',
  validateReply,
  handleValidationErrors,
  contactController.replyToContact
);
router.delete('/admin/contacts/:id', contactController.deleteContact);
router.get('/admin/stats', contactController.getStats);
router.post('/admin/bulk-update', contactController.bulkUpdateStatus);

module.exports = router;