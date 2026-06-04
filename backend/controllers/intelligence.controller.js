const pool = require('../db');

// Helper to extract basic skills text
const extractKeywords = (text) => {
  if (!text) return [];
  // simple tokenization logic, splitting by spaces / punctuation
  return text.toLowerCase().match(/\b(\w+)\b/g) || [];
};

exports.getDashboard = async (req, res) => {
  const userId = req.user.id;

  try {
    const userResult = await pool.query('SELECT profile_json, readiness_metrics FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = userResult.rows[0];
    const metrics = user.readiness_metrics || { technical: 0, soft: 0, experience: 0 };
    
    // Readiness Gauge average
    const readiness_gauge = Math.round((metrics.technical + metrics.soft + metrics.experience) / 3);

    // Selection Alerts feed - compute match manually (simple custom rule engine)
    const profile = user.profile_json || {};
    const techDNA = profile.techDNA || {};
    const techStack = techDNA.tech_stack || [];
    
    const jobsResult = await pool.query('SELECT * FROM job_listings');
    const jobs = jobsResult.rows;

    const selection_alerts = jobs.map(job => {
      let matchCount = 0;
      const jobKeywords = (job.keywords || []).map(k => k.toLowerCase());
      const userKeywords = techStack.map(k => k.toLowerCase());

      userKeywords.forEach(uk => {
        if (jobKeywords.includes(uk) || jobKeywords.some(jk => jk.includes(uk) || uk.includes(jk))) {
          matchCount++;
        }
      });

      let matchScore = 0;
      if (jobKeywords.length > 0) {
         matchScore = Math.round((matchCount / jobKeywords.length) * 100);
      }
      
      let matchLevel = 'Low';
      if (matchScore >= 80) matchLevel = 'High';
      else if (matchScore >= 60) matchLevel = 'Medium';

      return {
        ...job,
        matchScore,
        matchLevel
      };
    }).filter(job => job.matchLevel === 'High' || job.matchLevel === 'Medium');

    res.json({
      readiness_gauge,
      metrics,
      selection_alerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error loading dashboard' });
  }
};

const TechnicalSkillsDictionary = [
  // Frontend/Design
  'react', 'typescript', 'tailwind', 'css', 'javascript', 'html', 'next.js', 'vue',
  // Backend/API
  'node', 'express', 'fastapi', 'python', 'java', 'rest apis', 'graphql',
  // Data Tier
  'postgresql', 'mysql', 'mongodb', 'redis', 'sql server',
  // Cloud/Security/Architectures
  'cloud', 'computing', 'cybersecurity', 'cnn', 'rnn', 'docker', 'aws', 'azure', 'system design', 'gans', 'git'
];

const extractWords = (text) => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const tokens = [];

  // Match multi-word or dotted skills first
  TechnicalSkillsDictionary.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      tokens.push(skill);
    }
  });

  // Extract other single words
  const words = lowerText.match(/\b(\w+)\b/g) || [];
  words.forEach(w => {
    if (TechnicalSkillsDictionary.includes(w)) {
      tokens.push(w);
    }
  });

  return tokens;
};

exports.analyzeProximity = async (req, res) => {
  const userId = req.user.id;
  const { job_id, job_description_text } = req.body; // Can accept either a DB job_id or a raw text

  try {
    const userResult = await pool.query('SELECT profile_json FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const profile = userResult.rows[0].profile_json || {};
    
    // Extracted resume text
    const resumeText = (profile.documentData ? profile.documentData.extracted_content : '') + 
                       ' ' + 
                       (profile.techDNA ? profile.techDNA.tech_stack.join(' ') : '');

    let jdText = job_description_text;
    let targetJobId = job_id;

    if (job_id && !jdText) {
       const jobResult = await pool.query('SELECT description FROM job_listings WHERE id = $1', [job_id]);
       if (jobResult.rows.length > 0) {
         jdText = jobResult.rows[0].description;
       }
    }

    if (!jdText) {
      return res.status(400).json({ error: 'Job description text or valid job_id is required' });
    }

    if (!targetJobId && jdText) {
      // It's a custom job description. Let's create a dynamic job listing for it to persist the history.
      const customJobResult = await pool.query(`
        INSERT INTO job_listings (company_name, role_title, description, location)
        VALUES ('Custom Application', 'Analyzed Position', $1, 'Remote')
        RETURNING id
      `, [jdText]);
      targetJobId = customJobResult.rows[0].id;
    }

    // Step 1: Clean and lowercase both the text fields
    const cleanResumeTokens = extractWords(resumeText).map(t => t.toLowerCase());
    const cleanJdTokens = extractWords(jdText).map(t => t.toLowerCase());

    // Step 2: Intersect text tokens with the Technical Skills Dictionary ONLY
    const isolatedResumeSkills = cleanResumeTokens.filter(token => TechnicalSkillsDictionary.includes(token));
    const isolatedJdSkills = cleanJdTokens.filter(token => TechnicalSkillsDictionary.includes(token));

    // Convert to unique Sets to eliminate repetition weight inflation
    const uniqueResumeSkills = [...new Set(isolatedResumeSkills)];
    const uniqueJdSkills = [...new Set(isolatedJdSkills)];

    // Step 3: Compute the exact Matching Sets
    const matchedSkills = uniqueJdSkills.filter(skill => uniqueResumeSkills.includes(skill));
    const missingSkills = uniqueJdSkills.filter(skill => !uniqueResumeSkills.includes(skill));

    // Step 4: Calculate the explicit Technical Score
    const technicalReadinessScore = uniqueJdSkills.length > 0 
      ? (matchedSkills.length / uniqueJdSkills.length) * 100 
      : 0;

    const proximity_score = Math.round(technicalReadinessScore);

    // Save mapping securely
    if (targetJobId) {
       await pool.query(`
          INSERT INTO user_job_matches (user_id, job_id, proximity_score, matched_keywords, missing_keywords)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, job_id) 
          DO UPDATE SET proximity_score=$3, matched_keywords=$4, missing_keywords=$5, updated_at=CURRENT_TIMESTAMP
       `, [userId, targetJobId, proximity_score, JSON.stringify(matchedSkills), JSON.stringify(missingSkills)]);
    }

    res.json({
      proximity_score,
      matched_keywords: matchedSkills,
      missing_keywords: missingSkills,
      matched_skills: matchedSkills,
      missing_skills: missingSkills
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error running proximity analysis' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, company_name, role_title FROM job_listings ORDER BY company_name, role_title');
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to retrieve jobs list:', error);
    res.status(500).json({ error: 'Server error loading jobs list' });
  }
};

