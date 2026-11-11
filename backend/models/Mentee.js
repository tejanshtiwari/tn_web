
const mongoose = require('mongoose');

const CompletedResourceSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },

  completedOn: {
    type: Date,
    default: Date.now
  },

  score: {
    type: Number,
    default: 0,
    min: 0
  },

  githubLink: {
    type: String,
    trim: true
  },

  deployedLink: {
    type: String,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  submittedOn: Date,

  verified: {
    type: Boolean,
    default: false
  }
});

const MenteeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  programs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  }],

  completedResources: {
    type: [CompletedResourceSchema],
    default: []
  },

  interests: [{
    type: String,
    trim: true,
    maxlength: 40
  }],

  streak: {
    type: Number,
    default: 0,
    min: 0
  },

  totalScore: {
    type: Number,
    default: 0,
    min: 0
  },

  lastActiveDate: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor'
  }

}, { timestamps: true });

module.exports = mongoose.model('Mentee', MenteeSchema);
