require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'GMdatabase',
      password: process.env.DB_PASSWORD || 'Saiss@1202',
      port: process.env.DB_PORT || 5432,
    });

const setupDatabase = async () => {
  try {
    await pool.connect();
    console.log('Connected to the database. Creating tables...');

    // Drop existing tables for a clean slate
    await pool.query('DROP TABLE IF EXISTS recruitment_events, user_job_matches, job_listings, users CASCADE;');
    console.log('Dropped existing tables.');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_json JSONB DEFAULT '{}',
        readiness_metrics JSONB DEFAULT '{"technical": 0, "soft": 0, "experience": 0}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created Users table.');

    // Job Listings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_listings (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(150),
        role_title VARCHAR(150) NOT NULL,
        description TEXT,
        keywords JSONB DEFAULT '[]',
        location VARCHAR(150) DEFAULT 'Remote',
        deadline_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
        min_gpa_cutoff NUMERIC(5, 2) DEFAULT 75.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created Job Listings table.');

    // User Job Matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_job_matches (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_id INTEGER REFERENCES job_listings(id) ON DELETE CASCADE,
        proximity_score NUMERIC(5, 2) DEFAULT 0.00,
        matched_keywords JSONB DEFAULT '[]',
        missing_keywords JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'Not Applied',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, job_id)
      );
    `);
    console.log('Created User Job Matches table.');

    // Recruitment Events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recruitment_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(150) NOT NULL,
        company_name VARCHAR(150),
        event_type VARCHAR(50) CHECK (event_type IN ('aptitude', 'placement')),
        event_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created Recruitment Events table.');

    // Add Performance Indexes to make DB robust
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_job_listings_role ON job_listings(role_title);
      CREATE INDEX IF NOT EXISTS idx_user_job_matches_score ON user_job_matches(proximity_score DESC);
      CREATE INDEX IF NOT EXISTS idx_recruitment_events_date ON recruitment_events(event_date);
    `);
    console.log('Created performance indexes.');

    // Seed robust Job Listings for accurate proximity analyzer testing
    const insertJobsResult = await pool.query(`
      INSERT INTO job_listings (company_name, role_title, description, keywords, location, deadline_date, min_gpa_cutoff) VALUES 
      ('Google', 'Frontend Developer', 'We are looking for a highly skilled frontend developer. Requirements: Strong proficiency in React, JavaScript, TypeScript, and modern CSS/Tailwind. Experience with building responsive UI, Redux state management, and consuming REST APIs.', '["react", "javascript", "css", "tailwind", "typescript", "ui", "redux", "rest api", "frontend"]', 'Bangalore', CURRENT_TIMESTAMP + INTERVAL '10 days', 75.00),
      ('Microsoft', 'Backend Engineer', 'We need a robust Node.js backend developer. You should have 3+ years of experience in Node, Express, PostgreSQL, and REST APIs. Familiarity with Docker, AWS, microservices, and system design is a big plus.', '["node", "express", "postgresql", "rest api", "backend", "docker", "aws", "microservices", "system design"]', 'Hyderabad', CURRENT_TIMESTAMP + INTERVAL '12 days', 80.00),
      ('Amazon', 'Full Stack Developer', 'Looking for a full stack ninja. Frontend: React, Redux. Backend: Node.js, Python, Django. Database: SQL, NoSQL (MongoDB). Cloud: AWS (EC2, S3, Lambda). You will build end-to-end scalable web applications.', '["react", "node", "sql", "aws", "fullstack", "python", "django", "nosql", "mongodb", "redux", "lambda"]', 'Chennai', CURRENT_TIMESTAMP + INTERVAL '14 days', 70.00),
      ('Netflix', 'Data Scientist', 'Seeking a Data Scientist to improve our recommendation engine. Required skills: Python, Machine Learning, SQL, PyTorch, TensorFlow, Data Visualization (Tableau), and Statistics. Big data processing with Spark or Hadoop.', '["python", "machine learning", "sql", "pytorch", "tensorflow", "statistics", "data visualization", "spark", "hadoop", "tableau"]', 'Remote', CURRENT_TIMESTAMP + INTERVAL '20 days', 85.00),
      ('Apple', 'Product Manager', 'Join Apple as a Product Manager. You will oversee the product lifecycle from conception to launch. Required: Agile methodology, Jira, Scrum, UI/UX design sense, market research, and excellent cross-functional communication skills.', '["agile", "scrum", "jira", "ui/ux", "market research", "communication", "product management", "leadership"]', 'Bangalore', CURRENT_TIMESTAMP + INTERVAL '8 days', 75.00)
      RETURNING id, company_name, role_title
    `);
    console.log('Seeded robust Job Listings table.');

    // Pre-calculate password hashes for users
    const salt1 = await bcrypt.genSalt(10);
    const hash1 = await bcrypt.hash('Shashanth@1200', salt1);
    
    const salt2 = await bcrypt.genSalt(10);
    const hash2 = await bcrypt.hash('Go_kutty@123', salt2);

    // Create user profiles
    const profile1 = {
      academics: 82,
      certifications_score: 85,
      techDNA: {
        tech_stack: ["react", "node.js", "express", "postgresql", "javascript", "tailwind", "css", "html"],
        experience_level: "Intermediate",
        project_history: "Developed GradeMaster portal."
      },
      documentData: {
        extracted_content: "Sai Shashanth R. Experienced developer with skills in React, Node.js, Express, PostgreSQL, Javascript, Tailwind, CSS, HTML. Academic GPA 8.2.",
        parsed_tokens: ["react", "node.js", "express", "postgresql", "javascript", "tailwind", "css", "html"]
      }
    };

    const profile2 = {
      academics: 78,
      certifications_score: 80,
      techDNA: {
        tech_stack: ["python", "fastapi", "mysql", "javascript", "html", "css"],
        experience_level: "Beginner",
        project_history: "Built TraceHub, a lost and found management system."
      },
      documentData: {
        extracted_content: "Gowthaman R. Skills include Python, FastAPI, MySQL, Javascript, HTML, CSS. Academic GPA 7.8.",
        parsed_tokens: ["python", "fastapi", "mysql", "javascript", "html", "css"]
      }
    };

    // Insert demo users
    const user1Result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, profile_json, readiness_metrics) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Sai Shashanth R', '24mcaa54@kristujayanti.com', hash1, JSON.stringify(profile1), JSON.stringify({ technical: 80, soft: 75, experience: 80, academics: 82, certifications: 85 })]
    );

    const user2Result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, profile_json, readiness_metrics) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Gowthaman R', 'gowthaman21@gmail.com', hash2, JSON.stringify(profile2), JSON.stringify({ technical: 60, soft: 70, experience: 65, academics: 78, certifications: 80 })]
    );
    console.log('Seeded demo users.');

    const user1Id = user1Result.rows[0].id;
    const user2Id = user2Result.rows[0].id;

    // Seed dummy matches for user 1 and user 2
    const jobs = insertJobsResult.rows;
    if (jobs.length > 0) {
      // Find Google job id (usually index 0)
      const googleJob = jobs.find(j => j.company_name === 'Google');
      const microsoftJob = jobs.find(j => j.company_name === 'Microsoft');

      if (googleJob) {
        await pool.query(
          `INSERT INTO user_job_matches (user_id, job_id, proximity_score, matched_keywords, missing_keywords, status) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user1Id, googleJob.id, 85.00, JSON.stringify(['react', 'javascript', 'css', 'tailwind']), JSON.stringify(['typescript', 'redux']), 'Applied']
        );
      }

      if (microsoftJob) {
        await pool.query(
          `INSERT INTO user_job_matches (user_id, job_id, proximity_score, matched_keywords, missing_keywords, status) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user1Id, microsoftJob.id, 90.00, JSON.stringify(['node', 'express', 'postgresql']), JSON.stringify(['docker', 'aws']), 'Not Applied']
        );
      }
      console.log('Seeded initial job match logs.');
    }

    // Seed recruitment events
    await pool.query(
      `INSERT INTO recruitment_events (user_id, title, company_name, event_type, event_date) 
       VALUES 
       ($1, 'Google Technical Round', 'Google', 'placement', CURRENT_DATE + INTERVAL '2 days' + INTERVAL '10 hours'),
       ($1, 'Microsoft Aptitude Drill', 'Microsoft', 'aptitude', CURRENT_DATE + INTERVAL '5 days' + INTERVAL '9 hours')`,
      [user1Id]
    );
    console.log('Seeded recruitment events.');

    console.log('Database setup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

setupDatabase();
