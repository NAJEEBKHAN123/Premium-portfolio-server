const { body, validationResult } = require('express-validator');

const validateContact = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Please provide a valid phone number'),
  
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
  
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters')
    .escape()
];

const validateReply = [
  body('replyMessage')
    .trim()
    .notEmpty().withMessage('Reply message is required')
    .isLength({ min: 1, max: 5000 }).withMessage('Reply must be between 1 and 5000 characters')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  validateContact,
  validateReply,
  handleValidationErrors
};