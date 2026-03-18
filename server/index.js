const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running and connected to Neon' });
});

// Save Simulation Result
app.post('/api/simulation/save', async (req, res) => {
  const { protocol, processor_count, hit_rate, bus_traffic, events_count } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO simulation_history (protocol, processor_count, hit_rate, bus_traffic, events_count) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [protocol, processor_count, hit_rate, bus_traffic, events_count]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save simulation data' });
  }
});

// Get Simulation History
app.get('/api/simulation/history', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM simulation_history ORDER BY created_at DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Initialize Database Tables
const initDB = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS simulation_history (
      id SERIAL PRIMARY KEY,
      protocol VARCHAR(10) NOT NULL,
      processor_count INTEGER NOT NULL,
      hit_rate NUMERIC,
      bus_traffic INTEGER,
      events_count INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await db.query(queryText);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initDB();
});
