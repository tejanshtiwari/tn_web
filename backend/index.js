
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', require('./routes/mentorRoutes'));
app.use('/api/m', require('./routes/menteeRoutes'));
app.use('/api', require('./routes/aiProfileRoutes'));

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Mentorship API Running',
    status: 'OK'
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  res.status(err.status || 500).json({
    error: err.status && err.status < 500
      ? err.message
      : 'Internal server error'
  });
});

// Start server only after database connection
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
