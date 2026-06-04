// Polyfill browser globals for pdf-parse compatibility in Node cloud environments
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {};
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {};
}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', async (err, result) => {
    if (err) {
      release();
      return console.error('Error executing query', err.stack);
    }
    console.log('Connected to PostgreSQL database');
    
    // Add columns dynamically if they do not exist
    try {
      await client.query(`
        ALTER TABLE job_listings 
        ADD COLUMN IF NOT EXISTS location VARCHAR(150) DEFAULT 'Remote',
        ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
        ADD COLUMN IF NOT EXISTS min_gpa_cutoff NUMERIC(5, 2) DEFAULT 75.00;
      `);
      await client.query(`
        ALTER TABLE user_job_matches 
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Not Applied';
      `);
      
      // Seed additional job profiles if they do not exist
      const jobsCountResult = await client.query('SELECT COUNT(*) FROM job_listings');
      const count = parseInt(jobsCountResult.rows[0].count);
      if (count <= 5) {
         // Insert additional technical and non-technical jobs
         await client.query(`
           INSERT INTO job_listings (company_name, role_title, description, keywords, location, deadline_date, min_gpa_cutoff) VALUES 
           ('Meta', 'React Native Developer', 'Looking for a React Native developer to build next-generation social applications. Proficiency in React, JavaScript, TypeScript, CSS, Tailwind and Git is required.', '["react", "javascript", "css", "tailwind", "typescript", "git"]', 'London', CURRENT_TIMESTAMP + INTERVAL '15 days', 75.00),
           ('Tesla', 'Cybersecurity Analyst', 'Tesla is seeking a Cybersecurity Analyst to protect core energy and vehicle systems. Requirements: cloud security protocols, computing network defense, and basic knowledge of Git, AWS, and Azure.', '["cybersecurity", "cloud", "computing", "git", "aws", "azure"]', 'Austin', CURRENT_TIMESTAMP + INTERVAL '18 days', 80.00),
           ('OpenAI', 'Machine Learning Researcher', 'Join OpenAI to work on advanced generative architectures. Must have strong Python foundation, experience with neural structures (CNN, RNN, GANs), cloud computing, Docker, and Git.', '["python", "cnn", "rnn", "gans", "cloud", "computing", "docker", "git"]', 'San Francisco', CURRENT_TIMESTAMP + INTERVAL '25 days', 85.00),
           ('Uber', 'Systems Architect', 'Looking for a Systems Architect to design robust, high-traffic APIs. Requirements: system design, docker, AWS, PostgreSQL database optimization, Node.js backend pipelines, and Git.', '["system design", "docker", "aws", "postgresql", "node", "git"]', 'Bangalore', CURRENT_TIMESTAMP + INTERVAL '11 days', 80.00),
           ('Airbnb', 'UX Designer', 'Seeking a UX Designer to map user interactions and build stunning layouts. Must have knowledge of HTML, CSS, Tailwind, Javascript, and responsive design systems.', '["html", "css", "tailwind", "javascript"]', 'San Francisco', CURRENT_TIMESTAMP + INTERVAL '14 days', 70.00),
           ('Goldman Sachs', 'Financial Data Analyst', 'We need a Financial Data Analyst to build analytics frameworks. Required: Python, SQL databases (MySQL), PowerBI data dashboards, and advanced Excel modeling.', '["python", "mysql", "powerbi", "excel"]', 'New York', CURRENT_TIMESTAMP + INTERVAL '9 days', 75.00),
           ('McKinsey', 'Management Consultant', 'Seeking a Management Consultant to solve corporate operations problems. Expected: advanced Excel, Powerpoint deck preparation, excellent communication, teamwork, and leadership skills.', '["excel", "powerpoint", "communication", "teamwork", "leadership", "problem solving"]', 'Mumbai', CURRENT_TIMESTAMP + INTERVAL '7 days', 80.00),
           ('Nike', 'Marketing Operations Associate', 'Nike is seeking a Marketing Operations Associate. Must be comfortable running tasks in Excel, practicing Agile methodology, using Jira or Trello, and coordinating communication across departments.', '["excel", "agile", "jira", "trello", "communication"]', 'Amsterdam', CURRENT_TIMESTAMP + INTERVAL '16 days', 70.00)
         `);
         console.log('Seeded additional job listings.');
      }
      console.log('Database migrations applied successfully.');
      
      // Drop check constraints on recruitment_events to support custom event types
      await client.query(`
        DO $$ 
        DECLARE 
            r RECORD;
        BEGIN
            FOR r IN 
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = 'recruitment_events'::regclass AND contype = 'c'
            LOOP
                EXECUTE 'ALTER TABLE recruitment_events DROP CONSTRAINT ' || quote_ident(r.conname);
            END LOOP;
        END $$;
      `);
    } catch (migError) {
      console.error('Error running dynamic migrations:', migError);
    } finally {
      release();
    }
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Modular Routes
const authRoutes = require('./routes/auth.routes');
const intelligenceRoutes = require('./routes/intelligence.routes');
const logisticsRoutes = require('./routes/logistics.routes');
const placementHubRoutes = require('./routes/placement-hub.routes');

app.use('/api/auth', authRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/placement-hub', placementHubRoutes);

const authMiddleware = require('./middlewares/auth.middleware');
const authController = require('./controllers/auth.controller');
app.post('/api/profile/update-password', authMiddleware, authController.updatePassword);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
