const pool = require('../db');

// Helper to get user metrics for strict score formula
const getUserMetrics = (user) => {
  const profile = user.profile_json || {};
  const metrics = user.readiness_metrics || {};

  // 1. Academics: From profile_json.academics or readiness_metrics.academics or fallback to 85
  let academics = 85;
  if (profile.academics !== undefined) academics = Number(profile.academics);
  else if (metrics.academics !== undefined) academics = Number(metrics.academics);
  else if (profile.education && profile.education.gpa) {
    const parsedGpa = parseFloat(profile.education.gpa);
    if (!isNaN(parsedGpa)) {
      academics = parsedGpa <= 4.0 ? Math.round((parsedGpa / 4.0) * 100) : Math.round((parsedGpa / 10.0) * 100);
    }
  }

  // 2. Technical Capabilities: From readiness_metrics.technical or fallback to 80
  let technical = metrics.technical !== undefined ? Number(metrics.technical) : 80;
  if (technical === 0) technical = 80; // fallback if unseeded

  // 3. Certifications: From profile_json.certifications_score or calculated from array length or fallback to 75
  let certifications = 75;
  if (profile.certifications_score !== undefined) {
    certifications = Number(profile.certifications_score);
  } else if (Array.isArray(profile.certifications)) {
    certifications = Math.min(70 + profile.certifications.length * 10, 100);
  } else if (profile.techDNA && Array.isArray(profile.techDNA.certifications)) {
    certifications = Math.min(70 + profile.techDNA.certifications.length * 10, 100);
  } else if (metrics.certifications !== undefined) {
    certifications = Number(metrics.certifications);
  }

  return { academics, technical, certifications };
};

// GET /api/placement-hub/analyzed-opportunities
exports.getAnalyzedOpportunities = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch User profile and metrics
    const userResult = await pool.query('SELECT profile_json, readiness_metrics FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    const user = userResult.rows[0];
    const { academics, technical, certifications } = getUserMetrics(user);

    // Calculate selection probability using formula:
    // Score = (0.40 * Academics) + (0.40 * Technical) + (0.20 * Certifications)
    const selectionProbability = Math.round((0.40 * academics) + (0.40 * technical) + (0.20 * certifications));

    // 2. Run inner join query between corporate records (job_listings) and evaluation cache (user_job_matches)
    // Filter strictly by the logged-in student's credential token
    const query = `
      SELECT 
        jl.id,
        jl.company_name,
        jl.role_title,
        jl.description,
        jl.keywords,
        jl.location,
        jl.deadline_date,
        ujm.proximity_score,
        ujm.matched_keywords,
        ujm.missing_keywords,
        ujm.status,
        ujm.updated_at
      FROM job_listings jl
      INNER JOIN user_job_matches ujm ON jl.id = ujm.job_id
      WHERE ujm.user_id = $1
    `;
    const opportunitiesResult = await pool.query(query, [userId]);

    // Map opportunities to include calculated selection probability score
    const opportunities = opportunitiesResult.rows.map(opp => {
      // If proximity score is low, let's adjust the score, but wait - the prompt says:
      // "computed using the system's strict architectural formula: Score = (0.40 * Academics) + (0.40 * Technical Capabilities) + (0.20 * Certifications)"
      // So we will use the exact calculated score for selection probability
      return {
        ...opp,
        academics_score: academics,
        technical_score: technical,
        certifications_score: certifications,
        selection_probability: selectionProbability
      };
    });

    // Sort by highest selection probability first
    opportunities.sort((a, b) => b.selection_probability - a.selection_probability);

    res.json({
      student_metrics: { academics, technical, certifications },
      opportunities
    });
  } catch (error) {
    console.error('Error fetching analyzed opportunities:', error);
    res.status(500).json({ error: 'Server error retrieving analyzed opportunities' });
  }
};

// GET /api/placement-hub/job/:id
exports.getJobDetails = async (req, res) => {
  const userId = req.user.id;
  const jobId = req.params.id;

  try {
    const userResult = await pool.query('SELECT profile_json, readiness_metrics FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const user = userResult.rows[0];
    const { academics, technical, certifications } = getUserMetrics(user);
    const selectionProbability = Math.round((0.40 * academics) + (0.40 * technical) + (0.20 * certifications));

    const query = `
      SELECT 
        jl.*,
        ujm.proximity_score,
        ujm.matched_keywords,
        ujm.missing_keywords,
        ujm.status,
        ujm.updated_at
      FROM job_listings jl
      LEFT JOIN user_job_matches ujm ON jl.id = ujm.job_id AND ujm.user_id = $1
      WHERE jl.id = $2
    `;
    const result = await pool.query(query, [userId, jobId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vacancy description not found.' });
    }

    const job = result.rows[0];
    res.json({
      ...job,
      academics_score: academics,
      technical_score: technical,
      certifications_score: certifications,
      selection_probability: selectionProbability
    });
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({ error: 'Server error retrieving job details' });
  }
};

// POST /api/placement-hub/apply
exports.applyToJob = async (req, res) => {
  const userId = req.user.id;
  const { job_id } = req.body;

  if (!job_id) {
    return res.status(400).json({ error: 'Job ID is required to apply.' });
  }

  try {
    // Check if evaluation entry exists, if so update it. If not, create it.
    await pool.query(`
      INSERT INTO user_job_matches (user_id, job_id, status, updated_at)
      VALUES ($1, $2, 'Applied', CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, job_id)
      DO UPDATE SET status = 'Applied', updated_at = CURRENT_TIMESTAMP;
    `, [userId, job_id]);

    res.json({ message: 'Successfully applied to job position.', status: 'Applied' });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ error: 'Server error processing job application' });
  }
};

// POST /api/placement-hub/withdraw
exports.withdrawApplication = async (req, res) => {
  const userId = req.user.id;
  const { job_id } = req.body;

  if (!job_id) {
    return res.status(400).json({ error: 'Job ID is required to withdraw application.' });
  }

  try {
    await pool.query(`
      UPDATE user_job_matches
      SET status = 'Not Applied', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND job_id = $2;
    `, [userId, job_id]);

    res.json({ message: 'Successfully withdrew job application.', status: 'Not Applied' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ error: 'Server error withdrawing application' });
  }
};
