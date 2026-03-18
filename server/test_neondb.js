const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const testDefault = async () => {
  const url = process.env.DATABASE_URL;
  // Replace /Cache with /neondb
  const defaultUrl = url.replace(/\/Cache(\?|$)/, '/neondb$1');
  console.log('Testing connection to default:', defaultUrl.split('@')[1]);
  
  const client = new Client({
    connectionString: defaultUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to neondb SUCCESSFULLY!');
    const res = await client.query('SELECT datname FROM pg_database');
    console.log('Available databases:', res.rows.map(r => r.datname));
    await client.end();
  } catch (err) {
    console.error('Connection to neondb failed:', err.message);
  }
};

testDefault();
