const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema({
  slideNumber: { type: Number, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  layout: {
    type: String,
    enum: ['title', 'bullets', 'two-column', 'quote', 'metrics', 'timeline', 'conclusion'],
    default: 'bullets'
  },
  bullets: [{ type: String }],
  notes: { type: String, default: '' },
  visualCue: { type: String, default: '' },
  leftColumn: [{ type: String }],
  rightColumn: [{ type: String }],
  metrics: [{
    label: { type: String },
    value: { type: String },
    delta: { type: String }
  }]
}, { _id: false });

const PresentationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Presentation'
  },
  topic: {
    type: String,
    required: true
  },
  theme: {
    type: String,
    enum: ['cyber-dark', 'midnight-blue', 'minimal-light', 'emerald-tech', 'purple-aurora'],
    default: 'cyber-dark'
  },
  audience: {
    type: String,
    default: 'General'
  },
  tone: {
    type: String,
    enum: ['professional', 'persuasive', 'technical', 'inspirational', 'educational'],
    default: 'professional'
  },
  slideCount: {
    type: Number,
    default: 6
  },
  slides: [SlideSchema],
  aiModelUsed: {
    type: String,
    default: 'meta/llama-3.1-70b-instruct'
  },
  rawPrompt: {
    type: String,
    default: ''
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    default: null,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Presentation', PresentationSchema);
