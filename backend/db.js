const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon.tech
  },
});

// Test the connection if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('❌ Error connecting to PostgreSQL:', err.message);
    } else {
      console.log('✅ Connected to PostgreSQL (Neon.tech)');
      release();
    }
  });
} else {
  console.warn('⚠️ WARNING: DATABASE_URL environment variable is not defined.');
}

module.exports = pool;
