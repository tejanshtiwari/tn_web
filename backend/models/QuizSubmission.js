
const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  selectedOptionIndex: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const QuizSubmissionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },

  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentee',
    required: true
  },

  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },

  answers: {
    type: [AnswerSchema],
    default: []
  },

  score: {
    type: Number,
    default: 0,
    min: 0
  },

  submittedAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

QuizSubmissionSchema.index(
  { quiz: 1, mentee: 1 },
  { unique: true }
);

module.exports = mongoose.model('QuizSubmission', QuizSubmissionSchema);
