const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const Mentor = require('../models/Mentor');
const Program = require('../models/Program');
const Resource = require('../models/Resource');
const Mentee = require('../models/Mentee');
const Quiz = require('../models/Quiz');

const { authenticate } = require('../middleware/authMentor');
const router = express.Router();

const isMentorAssigned = (program, mentorId) => {
  return program.mentors.some(
    id => id.equals(mentorId)
  );
};


// Create Mentor
router.post('/mentors', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        error: 'Name, email and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must contain at least 8 characters'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingMentor = await Mentor.findOne({
      email: normalizedEmail
    });

    if (existingMentor) {
      return res.status(409).json({
        error: 'Mentor with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const mentor = new Mentor({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    await mentor.save();

    res.status(201).json({
      _id: mentor._id,
      name: mentor.name,
      email: mentor.email,
      programs: mentor.programs
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Mentor with this email already exists'
      });
    }

    console.error('Mentor registration error:', err.message);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// Get all mentors
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await Mentor.find()
      .select('-password')
      .populate('programs');

    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all programs
router.get('/programs', async (req, res) => {
  try {
    const programs = await Program.find()
      .populate({
        path: 'mentors',
        select: '-password'
      })
      .populate('resources');

    res.json(programs);

  } catch (err) {
    console.error('Get programs error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mentor Login
router.post('/mentors/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Authentication configuration error'
      });
    }

    const mentor = await Mentor.findOne({
      email: email.trim().toLowerCase()
    });

    if (!mentor) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      mentor.password
    );

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: mentor._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      mentor: {
        _id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        programs: mentor.programs
      }
    });

  } catch (err) {
    console.error('Mentor login error:', err.message);

    res.status(500).json({
      error: 'Server error'
    });
  }
});


// Create Program (Assign to Mentor)
router.post('/programs', authenticate, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Program name is required'
      });
    }

    const program = new Program({
      name: name.trim(),
      mentors: [req.mentor._id]
    });

    await program.save();

    req.mentor.programs.push(program._id);
    await req.mentor.save();

    res.status(201).json(program);

  } catch (err) {
    console.error('Create program error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add Mentor to Program (Manual via Thunder Client)
router.post(
  '/programs/:programId/add-mentor',
  authenticate,
  async (req, res) => {
    try {
      const { programId } = req.params;
      const { mentorId } = req.body;

      if (!mentorId) {
        return res.status(400).json({
          error: 'Mentor ID is required'
        });
      }

      const program = await Program.findById(programId);

      if (!program) {
        return res.status(404).json({
          error: 'Program not found'
        });
      }

      if (!isMentorAssigned(program, req.mentor._id)) {
        return res.status(403).json({
          error: 'Not authorized for this program'
        });
      }

      const mentor = await Mentor.findById(mentorId);

      if (!mentor) {
        return res.status(404).json({
          error: 'Mentor not found'
        });
      }

      if (!program.mentors.some(id => id.equals(mentor._id))) {
        program.mentors.push(mentor._id);
      }

      if (!mentor.programs.some(id => id.equals(program._id))) {
        mentor.programs.push(program._id);
      }

      await program.save();
      await mentor.save();

      res.json({
        message: 'Mentor assigned successfully',
        program,
        mentor: {
          _id: mentor._id,
          name: mentor.name,
          email: mentor.email,
          programs: mentor.programs
        }
      });

    } catch (err) {
      console.error('Add mentor error:', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Add Resource (Only for assigned programs)
router.post('/resources', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      url,
      deadline,
      maxScore,
      program: programId,
      isLocked
    } = req.body;

    if (!title?.trim() || !type || !programId) {
      return res.status(400).json({
        error: 'Title, type and program are required'
      });
    }

    if (!['video', 'project'].includes(type)) {
      return res.status(400).json({
        error: 'Use the quiz creation endpoint for quiz resources'
      });
    }

    if (
      maxScore !== undefined &&
      (!Number.isFinite(maxScore) || maxScore < 0)
    ) {
      return res.status(400).json({
        error: 'Invalid maximum score'
      });
    }

    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({
        error: 'Program not found'
      });
    }

    if (!isMentorAssigned(program, req.mentor._id)) {
      return res.status(403).json({
        error: 'Not authorized for this program'
      });
    }

    const resource = new Resource({
      title: title.trim(),
      description,
      type,
      url,
      deadline,
      maxScore,
      program: program._id,
      addedBy: req.mentor._id,
      isLocked: isLocked ?? false
    });

    await resource.save();

    program.resources.push(resource._id);
    await program.save();

    res.status(201).json(resource);

  } catch (err) {
    console.error('Create resource error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/resources/quiz', authenticate, async (req, res) => {
  let resource;
  let quiz;

  try {
    const {
      title,
      description,
      program: programId,
      questions,
      startTime,
      endTime,
      maxScore
    } = req.body;

    if (
      !title?.trim() ||
      !programId ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        error: 'Title, program and questions are required'
      });
    }

    if (
      maxScore !== undefined &&
      (!Number.isFinite(maxScore) || maxScore < 0)
    ) {
      return res.status(400).json({
        error: 'Invalid maximum score'
      });
    }

    if (startTime && Number.isNaN(new Date(startTime).getTime())) {
  return res.status(400).json({
    error: 'Invalid quiz start time'
  });
}

if (endTime && Number.isNaN(new Date(endTime).getTime())) {
  return res.status(400).json({
    error: 'Invalid quiz end time'
  });
}

if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
  return res.status(400).json({
    error: 'Quiz start time must be before end time'
  });
}

    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({
        error: 'Program not found'
      });
    }

    if (!isMentorAssigned(program, req.mentor._id)) {
      return res.status(403).json({
        error: 'Not authorized for this program'
      });
    }

    resource = new Resource({
      title: title.trim(),
      description,
      type: 'quiz',
      program: program._id,
      maxScore,
      deadline: endTime,
      isLocked: true,
      addedBy: req.mentor._id
    });

    await resource.save();

    quiz = new Quiz({
      resource: resource._id,
      questions,
      startTime,
      endTime
    });

    await quiz.save();

    // Link the quiz back to its resource.
    resource.quiz = quiz._id;
    await resource.save();

    program.resources.push(resource._id);
    await program.save();

    res.status(201).json({
      message: 'Quiz resource created successfully',
      resource,
      quiz
    });

  } catch (err) {
    if (quiz) {
      await Quiz.findByIdAndDelete(quiz._id);
    }

    if (resource) {
      await Resource.findByIdAndDelete(resource._id);
    }

    console.error('Create quiz error:', err.message);

    res.status(500).json({
      error: 'Could not create quiz'
    });
  }
});


// Mentor adds a mentee (with auto-generated credentials)
router.post('/mentees', authenticate, async (req, res) => {
  try {
    const { email, name, enrollmentNumber, programId } = req.body;

    if (
      !email?.trim() ||
      !name?.trim() ||
      !enrollmentNumber?.trim() ||
      !programId
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEnrollment = enrollmentNumber.trim();

    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    if (!isMentorAssigned(program, req.mentor._id)) {
      return res.status(403).json({
        error: 'Not authorized for this program'
      });
    }

    const existingMentee = await Mentee.findOne({
      $or: [
        { email: normalizedEmail },
        { enrollmentNumber: normalizedEnrollment }
      ]
    });

    if (existingMentee) {
      return res.status(409).json({
        error: 'Mentee with this email or enrollment number already exists'
      });
    }

    const tempPassword = crypto.randomBytes(9).toString('base64url');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const mentee = new Mentee({
      email: normalizedEmail,
      name: name.trim(),
      enrollmentNumber: normalizedEnrollment,
      password: hashedPassword,
      programs: [program._id],
      createdBy: req.mentor._id
    });

    await mentee.save();

    res.status(201).json({
      message: 'Mentee created successfully',
      mentee: {
        _id: mentee._id,
        email: mentee.email,
        name: mentee.name,
        enrollmentNumber: mentee.enrollmentNumber,
        programs: mentee.programs
      },
      tempPassword
    });
  } catch (err) {
    console.error('Create mentee error:', err);

    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Email or enrollment number already exists'
      });
    }

    res.status(500).json({ error: 'Failed to create mentee' });
  }
});


// Get all mentees for a program
router.get('/:programId/mentees', authenticate, async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);

    if (!program) {
      return res.status(404).json({
        error: 'Program not found'
      });
    }

    if (!isMentorAssigned(program, req.mentor._id)) {
      return res.status(403).json({
        error: 'Not authorized for this program'
      });
    }

    const mentees = await Mentee.find({
      programs: program._id
    })
      .select('-password')
      .populate('completedResources.resource', 'title type');

    res.json(mentees);

  } catch (err) {
    console.error('Get mentees error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:programId/resources', authenticate, async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);

    if (!program) {
      return res.status(404).json({
        error: 'Program not found'
      });
    }

    if (!isMentorAssigned(program, req.mentor._id)) {
      return res.status(403).json({
        error: 'Not authorized for this program'
      });
    }

    const resources = await Resource.find({
      program: program._id
    })
      .sort({ createdAt: -1 })
      .populate('addedBy', 'name email');

    res.json(resources);

  } catch (err) {
    console.error('Get resources error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /mentees/:menteeId/resources/:resourceId/verify
// Verify a mentee's project submission
router.patch(
  '/:menteeId/resources/:resourceId/verify',
  authenticate,
  async (req, res) => {
    try {
      const { menteeId, resourceId } = req.params;
      const { score } = req.body;

      if (
        typeof score !== 'number' ||
        !Number.isFinite(score) ||
        score < 0
      ) {
        return res.status(400).json({
          error: 'Score must be a valid non-negative number'
        });
      }

      const resource = await Resource.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (resource.type !== 'project') {
        return res.status(400).json({
          error: 'Only project-type resources can be verified'
        });
      }

      if (resource.isLocked) {
        return res.status(403).json({
          error: 'Resource is currently locked'
        });
      }

      if (score > resource.maxScore) {
        return res.status(400).json({
          error: `Score cannot exceed ${resource.maxScore}`
        });
      }

      const program = await Program.findById(resource.program);

      if (!program) {
        return res.status(404).json({ error: 'Program not found' });
      }

      if (!isMentorAssigned(program, req.mentor._id)) {
        return res.status(403).json({
          error: 'Not authorized to verify projects in this program'
        });
      }

      const mentee = await Mentee.findById(menteeId);

      if (!mentee) {
        return res.status(404).json({ error: 'Mentee not found' });
      }

      const isEnrolled = mentee.programs.some(
        id => id.toString() === resource.program.toString()
      );

      if (!isEnrolled) {
        return res.status(403).json({
          error: 'Mentee is not enrolled in this program'
        });
      }

      const submission = mentee.completedResources.find(
        entry => entry.resource.toString() === resourceId
      );

      if (!submission) {
        return res.status(400).json({
          error: 'Project has not been submitted by this mentee'
        });
      }

      if (submission.verified) {
        return res.status(400).json({
          error: 'This project has already been verified'
        });
      }

      submission.score = score;
      submission.verified = true;

      // Recalculate totalScore from all completed resource scores.
      mentee.totalScore = mentee.completedResources.reduce(
        (total, entry) => total + (entry.score || 0),
        0
      );

      await mentee.save();

      res.status(200).json({
        message: 'Project verified successfully',
        finalScore: score,
        totalScore: mentee.totalScore
      });
    } catch (err) {
      console.error('Project verification error:', err);
      res.status(500).json({ error: 'Failed to verify project' });
    }
  }
);

// Get unverified project submissions for the logged-in mentor
router.get('/unverified-projects', authenticate, async (req, res) => {
  try {
    const mentorProgramIds = new Set(
      req.mentor.programs.map(id => id.toString())
    );

    const mentees = await Mentee.find({
      'completedResources.verified': false
    })
      .select('name completedResources')
      .populate({
        path: 'completedResources.resource',
        select: 'title type program',
        populate: {
          path: 'program',
          select: 'name'
        }
      });

    const unverifiedProjects = [];

    for (const mentee of mentees) {
      for (const entry of mentee.completedResources) {
        const resource = entry.resource;

        if (
          !resource ||
          resource.type !== 'project' ||
          entry.verified !== false ||
          !resource.program ||
          !mentorProgramIds.has(resource.program._id.toString())
        ) {
          continue;
        }

        unverifiedProjects.push({
          menteeId: mentee._id,
          menteeName: mentee.name,
          resourceId: resource._id,
          resourceTitle: resource.title,
          programName: resource.program.name,
          githubLink: entry.githubLink,
          deployedLink: entry.deployedLink,
          description: entry.description,
          submittedOn: entry.submittedOn
        });
      }
    }

    res.status(200).json({ unverifiedProjects });
  } catch (err) {
    console.error('Fetch unverified projects error:', err);
    res.status(500).json({
      error: 'Failed to fetch unverified projects'
    });
  }
});


module.exports = router;