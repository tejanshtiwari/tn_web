
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Mentee = require('../models/Mentee');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Resource = require('../models/Resource');

const { authenticateMentee } = require('../middleware/authMentor');

const router = express.Router();


// --------------------------------------------------
// Helper: Check whether mentee is enrolled in program
// --------------------------------------------------

const isEnrolled = (mentee, programId) => {
  return mentee.programs.some(
    id => id.toString() === programId.toString()
  );
};


// --------------------------------------------------
// Helper: Validate MongoDB ObjectId
// --------------------------------------------------

const isValidId = id => mongoose.isValidObjectId(id);


// --------------------------------------------------
// Helper: Validate HTTP/HTTPS URL
// --------------------------------------------------

const isValidUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};


// --------------------------------------------------
// Helper: Update mentee streak
// --------------------------------------------------

async function updateStreak(mentee) {
  const today = new Date().toISOString().slice(0, 10);

  const lastActive = mentee.lastActiveDate
    ? mentee.lastActiveDate.toISOString().slice(0, 10)
    : null;

  if (lastActive === today) {
    return;
  }

  const yesterday = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString().slice(0, 10);

  mentee.streak = lastActive === yesterday
    ? (mentee.streak || 0) + 1
    : 1;

  mentee.lastActiveDate = new Date();
}


// --------------------------------------------------
// Helper: Recalculate total score
// --------------------------------------------------

function calculateTotalScore(mentee) {
  return mentee.completedResources.reduce(
    (total, entry) => total + (entry.score || 0),
    0
  );
}


// --------------------------------------------------
// Mentee Login
// POST /api/m/login
// --------------------------------------------------

router.post('/login', async (req, res) => {
  try {
    const { enrollmentNumber, password } = req.body;

    if (!enrollmentNumber?.trim() || !password) {
      return res.status(400).json({
        error: 'Enrollment number and password are required'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Authentication configuration error'
      });
    }

    const mentee = await Mentee.findOne({
      enrollmentNumber: enrollmentNumber.trim()
    });

    if (
      !mentee ||
      !(await bcrypt.compare(password, mentee.password))
    ) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: mentee._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ token });

  } catch (err) {
    console.error('Mentee login error:', err.message);

    res.status(500).json({
      error: 'Server error'
    });
  }
});


// --------------------------------------------------
// Mentee Dashboard
// GET /api/m/dashboard
// --------------------------------------------------

router.get('/dashboard', authenticateMentee, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.mentee._id)
      .populate({
        path: 'programs',
        populate: {
          path: 'resources',
          model: 'Resource'
        }
      })
      .populate({
        path: 'completedResources.resource',
        model: 'Resource'
      });

    if (!mentee) {
      return res.status(404).json({
        error: 'Mentee not found'
      });
    }

    // Create a map of completed resources.
    const completedMap = new Map();

    mentee.completedResources.forEach(item => {
      if (!item.resource) return;

      completedMap.set(item.resource._id.toString(), {
        score: item.score,
        completedOn: item.completedOn
      });
    });

    // Add completion information to program resources.
    const updatedPrograms = mentee.programs
      .filter(program => program)
      .map(program => {
        const updatedResources = program.resources
          .filter(resource => resource)
          .map(resource => {
            const completed = completedMap.get(
              resource._id.toString()
            );

            return {
              ...resource.toObject(),
              completed: Boolean(completed),
              score: completed ? completed.score : null,
              completedOn: completed
                ? completed.completedOn
                : null
            };
          });

        return {
          ...program.toObject(),
          resources: updatedResources
        };
      });

    const totalScore = calculateTotalScore(mentee);

    const rank = await calculateRank(mentee._id);

    res.status(200).json({
      name: mentee.name,
      programs: updatedPrograms,
      streak: mentee.streak,
      totalScore,
      rank
    });

  } catch (err) {
    console.error('Dashboard error:', err.message);

    res.status(500).json({
      error: 'Could not load dashboard'
    });
  }
});


// --------------------------------------------------
// Complete a Video Resource
// POST /api/m/resources/:id/complete
// --------------------------------------------------

router.post(
  '/resources/:id/complete',
  authenticateMentee,
  async (req, res) => {
    try {
      const resourceId = req.params.id;
      const mentee = req.mentee;

      if (!isValidId(resourceId)) {
        return res.status(400).json({
          error: 'Invalid resource ID'
        });
      }

      const resource = await Resource.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          error: 'Resource not found'
        });
      }

      if (resource.type !== 'video') {
        return res.status(400).json({
          error: 'Only video resources can be completed using this endpoint'
        });
      }

      if (resource.isLocked) {
        return res.status(403).json({
          error: 'Resource is locked'
        });
      }

      if (!isEnrolled(mentee, resource.program)) {
        return res.status(403).json({
          error: 'You are not enrolled in this program'
        });
      }

      // Calculate late penalty.
      const deadline = resource.deadline;

      const isLate = deadline && new Date() > deadline;

      const latePenalty = isLate
        ? Math.floor(
            (Date.now() - deadline.getTime()) /
            (1000 * 60 * 60 * 24)
          )
        : 0;

      const score = Math.max(
        0,
        (resource.maxScore || 0) - latePenalty
      );

      const existingCompletion = mentee.completedResources.find(
        entry => entry.resource.toString() === resource._id.toString()
      );

      if (existingCompletion) {
        return res.status(409).json({
          error: 'Resource has already been completed'
        });
      }

      mentee.completedResources.push({
        resource: resource._id,
        score,
        completedOn: new Date()
      });

      await updateStreak(mentee);

      mentee.totalScore = calculateTotalScore(mentee);

      await mentee.save();

      res.status(200).json({
        message: 'Resource marked as completed',
        score,
        totalScore: mentee.totalScore
      });

    } catch (err) {
      console.error('Resource completion error:', err.message);

      res.status(500).json({
        error: 'Could not complete resource'
      });
    }
  }
);


// --------------------------------------------------
// Submit Quiz
// POST /api/m/resources/:id/quiz/submit
// --------------------------------------------------

router.post(
  '/resources/:id/quiz/submit',
  authenticateMentee,
  async (req, res) => {
    let submission;

    try {
      const resourceId = req.params.id;
      const mentee = req.mentee;
      const { answers } = req.body;

      if (!isValidId(resourceId)) {
        return res.status(400).json({
          error: 'Invalid resource ID'
        });
      }

      if (!Array.isArray(answers)) {
        return res.status(400).json({
          error: 'Answers must be an array'
        });
      }

      const resource = await Resource.findById(resourceId);

      if (!resource || resource.type !== 'quiz') {
        return res.status(404).json({
          error: 'Quiz resource not found'
        });
      }

      if (!isEnrolled(mentee, resource.program)) {
        return res.status(403).json({
          error: 'You are not enrolled in this program'
        });
      }

      if (resource.isLocked) {
        return res.status(403).json({
          error: 'Quiz is locked'
        });
      }

      const quiz = await Quiz.findOne({
        resource: resource._id
      });

      if (!quiz) {
        return res.status(404).json({
          error: 'Quiz not found'
        });
      }

      // Check quiz timing when the dates are configured.
      const now = new Date();

      if (quiz.startTime && now < quiz.startTime) {
        return res.status(403).json({
          error: 'Quiz has not started yet'
        });
      }

      if (quiz.endTime && now > quiz.endTime) {
        return res.status(403).json({
          error: 'Quiz deadline has passed'
        });
      }

      // Prevent duplicate submissions.
      const existing = await QuizSubmission.findOne({
        quiz: quiz._id,
        mentee: mentee._id
      });

      if (existing) {
        return res.status(409).json({
          error: 'Quiz already submitted'
        });
      }

      // Validate all submitted answers.
      const answerMap = new Map();

      for (const answer of answers) {
        if (
          !answer.questionId ||
          !isValidId(answer.questionId) ||
          !Number.isInteger(answer.selectedOptionIndex) ||
          answer.selectedOptionIndex < 0
        ) {
          return res.status(400).json({
            error: 'Invalid answer format'
          });
        }

        const questionId = answer.questionId.toString();

        if (answerMap.has(questionId)) {
          return res.status(400).json({
            error: 'Duplicate answer for a question'
          });
        }

        const question = quiz.questions.find(
          q => q._id.toString() === questionId
        );

        if (!question) {
          return res.status(400).json({
            error: 'Answer contains an invalid question ID'
          });
        }

        if (answer.selectedOptionIndex >= question.options.length) {
          return res.status(400).json({
            error: 'Selected option does not exist'
          });
        }

        answerMap.set(questionId, answer.selectedOptionIndex);
      }

      // Calculate quiz score.
      let totalScore = 0;

      for (const question of quiz.questions) {
        const selectedOption = answerMap.get(
          question._id.toString()
        );

        if (
          selectedOption !== undefined &&
          selectedOption === question.correctOptionIndex
        ) {
          totalScore += question.marks || 1;
        }
      }

      // Never exceed the resource's maximum score.
      totalScore = Math.min(
        totalScore,
        resource.maxScore || 0
      );

      // Save quiz submission.
      submission = new QuizSubmission({
        quiz: quiz._id,
        resource: resource._id,
        mentee: mentee._id,
        answers,
        score: totalScore
      });

      await submission.save();

      // Update mentee progress.
      const existingCompletion = mentee.completedResources.find(
        entry => entry.resource.toString() === resource._id.toString()
      );

      if (existingCompletion) {
        existingCompletion.score = totalScore;
        existingCompletion.completedOn = new Date();
      } else {
        mentee.completedResources.push({
          resource: resource._id,
          score: totalScore,
          completedOn: new Date()
        });
      }

      await updateStreak(mentee);

      mentee.totalScore = calculateTotalScore(mentee);

      await mentee.save();

      res.status(200).json({
        message: 'Quiz submitted successfully',
        score: totalScore,
        totalScore: mentee.totalScore
      });

    } catch (err) {
      // Remove the new submission if updating mentee progress failed.
      if (submission) {
        try {
          await QuizSubmission.findByIdAndDelete(submission._id);
        } catch (cleanupError) {
          console.error('Quiz submission cleanup error:', cleanupError.message);
        }
      }

      if (err.code === 11000) {
        return res.status(409).json({
          error: 'Quiz already submitted'
        });
      }

      console.error('Quiz submission error:', err.message);

      res.status(500).json({
        error: 'Could not submit quiz'
      });
    }
  }
);


// --------------------------------------------------
// Get Quiz Questions
// GET /api/m/resources/:id/quiz
// --------------------------------------------------

router.get(
  '/resources/:id/quiz',
  authenticateMentee,
  async (req, res) => {
    try {
      const resourceId = req.params.id;
      const mentee = req.mentee;

      if (!isValidId(resourceId)) {
        return res.status(400).json({
          error: 'Invalid resource ID'
        });
      }

      const resource = await Resource.findById(resourceId);

      if (!resource || resource.type !== 'quiz') {
        return res.status(404).json({
          error: 'Quiz resource not found'
        });
      }

      if (!isEnrolled(mentee, resource.program)) {
        return res.status(403).json({
          error: 'You are not enrolled in this program'
        });
      }

      if (resource.isLocked) {
        return res.status(403).json({
          error: 'Quiz is locked'
        });
      }

      const quiz = await Quiz.findOne({
        resource: resource._id
      });

      if (!quiz) {
        return res.status(404).json({
          error: 'Quiz not found'
        });
      }

      // Never send correctOptionIndex to the mentee.
      res.status(200).json({
        title: resource.title,
        description: resource.description,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        questions: quiz.questions.map(question => ({
          id: question._id,
          questionText: question.questionText,
          options: question.options
        }))
      });

    } catch (err) {
      console.error('Get quiz error:', err.message);

      res.status(500).json({
        error: 'Could not load quiz'
      });
    }
  }
);


// --------------------------------------------------
// Submit Project
// POST /api/m/resources/:resourceId/project
// --------------------------------------------------

router.post(
  '/resources/:resourceId/project',
  authenticateMentee,
  async (req, res) => {
    try {
      const resourceId = req.params.resourceId;
      const mentee = req.mentee;

      const {
        githubLink,
        deployedLink,
        description
      } = req.body;

      if (!isValidId(resourceId)) {
        return res.status(400).json({
          error: 'Invalid resource ID'
        });
      }

      const resource = await Resource.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          error: 'Resource not found'
        });
      }

      if (resource.type !== 'project') {
        return res.status(400).json({
          error: 'Invalid resource type'
        });
      }

      if (resource.isLocked) {
        return res.status(403).json({
          error: 'Resource is locked'
        });
      }

      if (!isEnrolled(mentee, resource.program)) {
        return res.status(403).json({
          error: 'You are not enrolled in this program'
        });
      }

      if (
        !githubLink?.trim() ||
        !deployedLink?.trim() ||
        !description?.trim()
      ) {
        return res.status(400).json({
          error: 'GitHub link, deployed link and description are required'
        });
      }

      if (
        !isValidUrl(githubLink.trim()) ||
        !isValidUrl(deployedLink.trim())
      ) {
        return res.status(400).json({
          error: 'Please provide valid HTTP or HTTPS links'
        });
      }

      const existing = mentee.completedResources.find(
        entry => entry.resource.toString() === resource._id.toString()
      );

      if (existing?.verified) {
        return res.status(409).json({
          error: 'This project has already been verified'
        });
      }

      if (existing) {
        // Allow editing an unverified submission.
        existing.githubLink = githubLink.trim();
        existing.deployedLink = deployedLink.trim();
        existing.description = description.trim();
        existing.submittedOn = new Date();
        existing.score = 0;
        existing.verified = false;
      } else {
        mentee.completedResources.push({
          resource: resource._id,
          githubLink: githubLink.trim(),
          deployedLink: deployedLink.trim(),
          description: description.trim(),
          score: 0,
          submittedOn: new Date(),
          verified: false
        });
      }

      await updateStreak(mentee);

      mentee.totalScore = calculateTotalScore(mentee);

      await mentee.save();

      res.status(200).json({
        message: 'Project submitted successfully'
      });

    } catch (err) {
      console.error('Project submission error:', err.message);

      res.status(500).json({
        error: 'Could not submit project'
      });
    }
  }
);


// --------------------------------------------------
// Helper: Calculate mentee rank
// --------------------------------------------------

async function calculateRank(menteeId) {
  const mentee = await Mentee.findById(menteeId)
    .select('streak lastActiveDate completedResources.score')
    .lean();

  if (!mentee) {
    return null;
  }

  const myScore = (mentee.completedResources || []).reduce(
    (total, entry) => total + (entry.score || 0),
    0
  );

  const myStreak = mentee.streak || 0;
  const myLastActive = mentee.lastActiveDate || new Date(0);

  // Count mentees ranked above this mentee.
  const better = await Mentee.aggregate([
    {
      $project: {
        streak: { $ifNull: ['$streak', 0] },

        lastActiveDate: {
          $ifNull: ['$lastActiveDate', new Date(0)]
        },

        totalScore: {
          $sum: {
            $map: {
              input: { $ifNull: ['$completedResources', []] },
              as: 'entry',
              in: { $ifNull: ['$$entry.score', 0] }
            }
          }
        }
      }
    },
    {
      $match: {
        $or: [
          { totalScore: { $gt: myScore } },

          {
            totalScore: myScore,
            streak: { $gt: myStreak }
          },

          {
            totalScore: myScore,
            streak: myStreak,
            lastActiveDate: { $gt: myLastActive }
          },

          {
            totalScore: myScore,
            streak: myStreak,
            lastActiveDate: myLastActive,
            _id: { $lt: menteeId }
          }
        ]
      }
    },
    { $count: 'count' }
  ]);

  return (better[0]?.count || 0) + 1;
}


// --------------------------------------------------
// Public Leaderboard
// GET /api/m/leaderboard
// --------------------------------------------------

router.get('/leaderboard', async (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit || '50', 10);
    const requestedSkip = parseInt(req.query.skip || '0', 10);

    const limit = Number.isNaN(requestedLimit)
      ? 50
      : Math.min(Math.max(requestedLimit, 1), 200);

    const skip = Number.isNaN(requestedSkip)
      ? 0
      : Math.max(requestedSkip, 0);

    const rows = await Mentee.aggregate([
      {
        $project: {
          name: 1,
          streak: { $ifNull: ['$streak', 0] },
          lastActiveDate: {
            $ifNull: ['$lastActiveDate', new Date(0)]
          },
          totalScore: {
            $sum: {
              $map: {
                input: { $ifNull: ['$completedResources', []] },
                as: 'entry',
                in: { $ifNull: ['$$entry.score', 0] }
              }
            }
          }
        }
      },
      {
        $sort: {
          totalScore: -1,
          streak: -1,
          lastActiveDate: -1,
          _id: 1
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    const leaderboard = rows.map((mentee, index) => ({
      rank: skip + index + 1,
      name: mentee.name,
      totalScore: mentee.totalScore || 0,
      streak: mentee.streak || 0
    }));

    res.status(200).json(leaderboard);

  } catch (err) {
    console.error('Leaderboard error:', err.message);

    res.status(500).json({
      error: 'Could not load leaderboard'
    });
  }
});


module.exports = router;
