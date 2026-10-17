const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  plan: {
    type: String,
    default: 'pro-8-monthly'
  },
  source: {
    type: String,
    default: 'pricing-page'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Waitlist', WaitlistSchema);
