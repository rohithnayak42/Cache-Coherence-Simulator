const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

// Try connecting to the provided URL
const testConnection = async () => {
  const url = process.env.DATABASE_URL;
  console.log('Testing connection to:', url.split('@')[1]); // Log masked URL
  
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT current_database()');
    console.log('Current database:', res.rows[0].current_database);
    await client.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.code === '3D000') {
      console.log('Attempting to connect to default database to list databases...');
      // Try root connection
      const rootUrl = url.substring(0, url.lastIndexOf('/')) + '/neondb';
      const rootClient = new Client({
        connectionString: rootUrl,
        ssl: { rejectUnauthorized: false }
      });
      try {
        await rootClient.connect();
        console.log('Connected to neondb successfully.');
        const dbList = await rootClient.query('SELECT datname FROM pg_database');
        console.log('Available databases:', dbList.rows.map(r => r.datname));
        await rootClient.end();
      } catch (rootErr) {
        console.error('Root connection failed:', rootErr.message);
      }
    }
  }
};

testConnection();
