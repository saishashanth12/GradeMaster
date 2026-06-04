require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'GMdatabase',
  password: process.env.DB_PASSWORD || 'Saiss@1202',
  port: process.env.DB_PORT || 5432,
});

pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'").then(r => {
    console.log("Tables:", r.rows);
    process.exit(0);
}).catch(console.error);
