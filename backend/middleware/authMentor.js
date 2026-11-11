
const jwt = require('jsonwebtoken');

const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');

const getToken = (req) => {
  return req.header('x-auth-token');
};

// Mentor Authentication
exports.authenticate = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: 'Authentication configuration error'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    const mentor = await Mentor.findById(decoded.id).select('-password');

    if (!mentor) {
      return res.status(401).json({
        error: 'Mentor not found'
      });
    }

    req.mentor = mentor;
    next();

  } catch (err) {
    if (err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    console.error('Mentor authentication error:', err.message);

    return res.status(500).json({
      error: 'Authentication failed'
    });
  }
};


// Mentee Authentication
exports.authenticateMentee = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: 'Authentication configuration error'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    const mentee = await Mentee.findById(decoded.id).select('-password');

    if (!mentee) {
      return res.status(401).json({
        error: 'Mentee not found'
      });
    }

    req.mentee = mentee;
    next();

  } catch (err) {
    if (err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    console.error('Mentee authentication error:', err.message);

    return res.status(500).json({
      error: 'Authentication failed'
    });
  }
};
