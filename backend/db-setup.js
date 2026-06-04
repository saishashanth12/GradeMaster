require('dotenv').config();
const { Pool } = require('pg');

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
    const checkJobs = await pool.query('SELECT COUNT(*) FROM job_listings');
    if (parseInt(checkJobs.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO job_listings (company_name, role_title, description, keywords, location, deadline_date, min_gpa_cutoff) VALUES 
        ('Google', 'Frontend Developer', 'We are looking for a highly skilled frontend developer. Requirements: Strong proficiency in React, JavaScript, TypeScript, and modern CSS/Tailwind. Experience with building responsive UI, Redux state management, and consuming REST APIs.', '["react", "javascript", "css", "tailwind", "typescript", "ui", "redux", "rest api", "frontend"]', 'Bangalore', CURRENT_TIMESTAMP + INTERVAL '10 days', 75.00),
        ('Microsoft', 'Backend Engineer', 'We need a robust Node.js backend developer. You should have 3+ years of experience in Node, Express, PostgreSQL, and REST APIs. Familiarity with Docker, AWS, microservices, and system design is a big plus.', '["node", "express", "postgresql", "rest api", "backend", "docker", "aws", "microservices", "system design"]', 'Hyderabad', CURRENT_TIMESTAMP + INTERVAL '12 days', 80.00),
        ('Amazon', 'Full Stack Developer', 'Looking for a full stack ninja. Frontend: React, Redux. Backend: Node.js, Python, Django. Database: SQL, NoSQL (MongoDB). Cloud: AWS (EC2, S3, Lambda). You will build end-to-end scalable web applications.', '["react", "node", "sql", "aws", "fullstack", "python", "django", "nosql", "mongodb", "redux", "lambda"]', 'Chennai', CURRENT_TIMESTAMP + INTERVAL '14 days', 70.00),
        ('Netflix', 'Data Scientist', 'Seeking a Data Scientist to improve our recommendation engine. Required skills: Python, Machine Learning, SQL, PyTorch, TensorFlow, Data Visualization (Tableau), and Statistics. Big data processing with Spark or Hadoop.', '["python", "machine learning", "sql", "pytorch", "tensorflow", "statistics", "data visualization", "spark", "hadoop", "tableau"]', 'Remote', CURRENT_TIMESTAMP + INTERVAL '20 days', 85.00),
        ('Apple', 'Product Manager', 'Join Apple as a Product Manager. You will oversee the product lifecycle from conception to launch. Required: Agile methodology, Jira, Scrum, UI/UX design sense, market research, and excellent cross-functional communication skills.', '["agile", "scrum", "jira", "ui/ux", "market research", "communication", "product management", "leadership"]', 'Bangalore', CURRENT_TIMESTAMP + INTERVAL '8 days', 75.00)
      `);
      console.log('Seeded robust Job Listings table.');
    }

    console.log('Database setup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

setupDatabase();
