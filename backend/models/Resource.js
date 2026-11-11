
const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true,
    default: ''
  },

  type: {
    type: String,
    enum: ['video', 'quiz', 'project'],
    required: true
  },

  url: {
    type: String,
    trim: true
  },

  deadline: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },

  maxScore: {
    type: Number,
    default: 300,
    min: 0
  },

  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true
  },

  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },

  isLocked: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model('Resource', ResourceSchema);