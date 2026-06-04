const pool = require('../db');

const TargetEngineeringGroup = [
  'react', 'node.js', 'express', 'postgresql', 'mysql', 'javascript', 'typescript', 'tailwind', 'css', 'html', 'python', 'fastapi', 'java', 'powerbi', 'docker', 'aws', 'azure', 'system design', 'cnn', 'rnn', 'gans', 'data structures'
];

const GeneralTaxonomy = [
  'word', 'excel', 'powerpoint', 'communication', 'leadership', 'teamwork', 'agile', 'scrum', 'project management', 'problem solving', 'jira', 'trello', 'analytical', 'time management', 'english', 'public speaking', 'critical thinking', 'creativity'
];

exports.getDashboardData = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Relational profile load
    const userResult = await pool.query('SELECT profile_json, readiness_metrics FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const user = userResult.rows[0];
    const profile = user.profile_json || {};
    const metrics = user.readiness_metrics || {};

    // 2. Token taxonomy sorting loop
    let parsedTokens = [];
    if (profile.documentData && Array.isArray(profile.documentData.parsed_tokens)) {
      parsedTokens = profile.documentData.parsed_tokens;
    } else {
      const resumeText = (profile.documentData ? profile.documentData.extracted_content : '') + 
                         ' ' + 
                         (profile.techDNA ? (profile.techDNA.tech_stack || []).join(' ') : '');
      parsedTokens = resumeText.toLowerCase().match(/\b([a-zA-Z0-9.+#-]+)\b/g) || [];
    }

    const cleanResumeTokens = parsedTokens.map(t => t.toLowerCase());

    // Intersect with TargetEngineeringGroup
    const extractedTechStack = TargetEngineeringGroup.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = /\W/.test(skill) 
        ? new RegExp(escaped, 'i') 
        : new RegExp('\\b' + escaped + '\\b', 'i');
      return cleanResumeTokens.includes(skill) || regex.test(cleanResumeTokens.join(' '));
    });
    const uniqueTechStack = [...new Set(extractedTechStack)];

    // Intersect with GeneralTaxonomy
    const filteredGeneral = GeneralTaxonomy.filter(word => {
      const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('\\b' + escaped + '\\b', 'i');
      return cleanResumeTokens.includes(word) || regex.test(cleanResumeTokens.join(' '));
    });

    const defaultGeneral = ['Word', 'Excel', 'Communication', 'Agile', 'Teamwork', 'Leadership'];
    const finalGeneralCompetencies = filteredGeneral.length > 0 
      ? [...new Set(filteredGeneral.map(w => w.charAt(0).toUpperCase() + w.slice(1)))] 
      : defaultGeneral;

    // 3. Calculate mathematical weights
    // Academics: profile_json.academics or fallback from gpa or 85
    let academics = 85;
    if (profile.academics !== undefined) academics = Number(profile.academics);
    else if (metrics.academics !== undefined) academics = Number(metrics.academics);
    else if (profile.education && profile.education.gpa) {
      const parsedGpa = parseFloat(profile.education.gpa);
      if (!isNaN(parsedGpa)) {
        academics = parsedGpa <= 4.0 ? Math.round((parsedGpa / 4.0) * 100) : Math.round((parsedGpa / 10.0) * 100);
      }
    }

    // Technical Capabilities: mapped proportionally (each of the 8 skills adds 12.5%, max 100%)
    let technicalCapabilities = uniqueTechStack.length > 0 
      ? Math.min(Math.round((uniqueTechStack.length / 8) * 100), 100) 
      : (metrics.technical || 80);

    // Certifications: based on certifications count or score, fallback 75
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

    // Systemic Formula: Score = (0.40 * Academics) + (0.40 * Technical) + (0.20 * Certifications)
    const holisticScore = Math.round((0.40 * academics) + (0.40 * technicalCapabilities) + (0.20 * certifications));

    // Update database readiness metrics
    await pool.query(
      'UPDATE users SET readiness_metrics = $1 WHERE id = $2',
      [JSON.stringify({ technical: technicalCapabilities, soft: metrics.soft || 75, experience: metrics.experience || 80, academics, certifications }), userId]
    );

    // 4. Retrieve proximity history logs (user_job_matches joined with job_listings)
    const historyQuery = `
      SELECT 
        ujm.proximity_score,
        ujm.matched_keywords,
        ujm.missing_keywords,
        ujm.status,
        ujm.updated_at,
        jl.id as job_id,
        jl.company_name,
        jl.role_title AS job_role,
        jl.location,
        jl.min_gpa_cutoff
      FROM user_job_matches ujm
      INNER JOIN job_listings jl ON ujm.job_id = jl.id
      WHERE ujm.user_id = $1
      ORDER BY ujm.updated_at DESC
    `;
    const historyResult = await pool.query(historyQuery, [userId]);

    const historyLogs = historyResult.rows.map(row => {
      const cutoff = Number(row.min_gpa_cutoff) || 75.0;
      const isBelowCutoff = academics < cutoff;
      return {
        proximity_score: Number(row.proximity_score),
        matched_keywords: row.matched_keywords || [],
        missing_keywords: row.missing_keywords || [],
        status: row.status,
        updated_at: row.updated_at,
        job_id: row.job_id,
        company_name: row.company_name,
        role_title: row.job_role,
        job_role: row.job_role,
        location: row.location || 'Remote',
        min_gpa_cutoff: cutoff,
        is_below_cutoff: isBelowCutoff
      };
    });

    // 5. Query recruitment events occurring this week (or upcoming close events)
    const eventsQuery = `
      SELECT 
        id,
        title,
        company_name,
        event_type,
        event_date
      FROM recruitment_events
      WHERE user_id = $1 AND event_date >= CURRENT_DATE - INTERVAL '1 day'
      ORDER BY event_date ASC
      LIMIT 10
    `;
    const eventsResult = await pool.query(eventsQuery, [userId]);
    const upcomingEvents = eventsResult.rows.map(row => {
      return {
        id: row.id,
        title: row.title,
        company_name: row.company_name,
        event_type: row.event_type,
        event_date: row.event_date
      };
    });

    res.json({
      readiness_gauge: holisticScore,
      metrics: {
        academics,
        technical: technicalCapabilities,
        certifications
      },
      extracted_tech_stack: uniqueTechStack,
      general_competencies: finalGeneralCompetencies,
      history_logs: historyLogs,
      upcoming_events: upcomingEvents
    });

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    res.status(500).json({ error: 'Server error loading dashboard analytics' });
  }
};
