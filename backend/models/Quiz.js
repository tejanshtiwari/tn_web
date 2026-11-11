
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },

  options: {
    type: [String],
    required: true,
    validate: {
      validator: options => options.length >= 2,
      message: 'A question must have at least two options'
    }
  },

  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function (value) {
        return value < this.options.length;
      },
      message: 'Correct option index must refer to an existing option'
    }
  },

  marks: {
    type: Number,
    default: 1,
    min: 0
  }
});

const QuizSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
    unique: true
  },

  questions: {
    type: [QuestionSchema],
    required: true,
    validate: {
      validator: questions => questions.length > 0,
      message: 'A quiz must contain at least one question'
    }
  },

  startTime: Date,

  endTime: Date,

  revealScores: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
