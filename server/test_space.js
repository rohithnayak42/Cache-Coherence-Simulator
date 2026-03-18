const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const testWithSpace = async () => {
  const url = process.env.DATABASE_URL;
  // Replace /Cache with /Cache%20
  const spaceUrl = url.replace(/\/Cache(\?|$)/, '/Cache%20$1');
  console.log('Testing connection with space:', spaceUrl.split('@')[1]);
  
  const client = new Client({
    connectionString: spaceUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Cache (with space) SUCCESSFULLY!');
    await client.end();
  } catch (err) {
    console.error('Connection failed even with space:', err.message);
  }
};

testWithSpace();
