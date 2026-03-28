const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    sparse: true,
    match: [/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/, 'Please provide a valid phone number']
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'replied', 'spam'],
    default: 'pending'
  },
  ipAddress: {
    type: String,
    sparse: true
  },
  userAgent: {
    type: String,
    sparse: true
  },
  repliedAt: {
    type: Date
  },
  replyMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
contactSchema.index({ createdAt: -1 });
contactSchema.index({ email: 1, status: 1 });
contactSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted date
contactSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to mark as replied
contactSchema.methods.markAsReplied = async function(replyMessage) {
  this.status = 'replied';
  this.repliedAt = new Date();
  this.replyMessage = replyMessage;
  await this.save();
};

// Static method to get statistics
contactSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = await this.countDocuments();
  
  return {
    total,
    stats: stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {})
  };
};

// Make sure to export the model
const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;