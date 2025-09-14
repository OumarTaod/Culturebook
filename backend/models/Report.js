const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Post inapproprié', 'Spam', 'Harcèlement', 'Contenu offensant', 'Autre']
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ reportedPost: 1 });

module.exports = mongoose.model('Report', reportSchema);