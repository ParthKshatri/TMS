const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const createSessionConfig = require('./config/session');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy for production deployment behind reverse proxies (e.g., Render, Railway, Nginx)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS configuration
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(createSessionConfig());

// Mount API routes
app.use('/api', routes);

// Serve built static frontend files in production or if dist directory exists
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

// Centralized error handling
app.use(errorHandler);

module.exports = app;
