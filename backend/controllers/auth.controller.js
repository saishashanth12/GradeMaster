const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'grademaster_secret', { expiresIn: '30d' });
};

// Step 1: Basic Identity (Name, Email, Password)
exports.registerStep1 = async (req, res) => {
  const { full_name, email, password } = req.body;
  try {
    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email',
      [full_name, email, password_hash]
    );

    const user = newUser.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ 
      message: 'Step 1 complete', 
      user, 
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server errror during registration' });
  }
};

// Step 2: Technical DNA (Tech Stack, Experience Level, Projects)
exports.registerStep2 = async (req, res) => {
  const userId = req.user.id; // User must be authenticated from step 1
  const { tech_stack, experience_level, project_history } = req.body;

  try {
    // Current profile_json
    const userResult = await pool.query('SELECT profile_json FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    let profile = userResult.rows[0].profile_json || {};
    profile.techDNA = {
      tech_stack: tech_stack || [], // Array of strings e.g. ["React", "Node"]
      experience_level: experience_level || 'Beginner',
      project_history: project_history || ''
    };

    await pool.query('UPDATE users SET profile_json = $1 WHERE id = $2', [JSON.stringify(profile), userId]);
    
    res.status(200).json({ message: 'Step 2 complete', techDNA: profile.techDNA });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating Technical DNA' });
  }
};

// Step 3: Document Processing (Upload Base Resume)
exports.registerStep3 = async (req, res) => {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    let extractedText = '';
    
    // Process PDF Content to extract text
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
      const parsedData = await parser.getText();
      extractedText = parsedData.text;
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    } else {
      // Stub for Docx processing or others
      extractedText = 'Extracted text from docx stub';
    }

    const documentData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      extracted_content: extractedText.trim()
    };

    // Update profile_json
    const userResult = await pool.query('SELECT profile_json FROM users WHERE id = $1', [userId]);
    let profile = userResult.rows[0].profile_json || {};
    profile.documentData = documentData;

    await pool.query('UPDATE users SET profile_json = $1 WHERE id = $2', [JSON.stringify(profile), userId]);

    // Cleanup: optionally we can delete the file from local storage after extracting text if we only care about text
    // fs.unlinkSync(req.file.path); 
    // But requirement says "Implement an upload handler for the Base Resume", so we will keep it.

    res.status(200).json({ message: 'Step 3 complete. Resume processed.', documentProcessed: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error processing document' });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, profile: user.profile_json } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Server error updating password.' });
  }
};
