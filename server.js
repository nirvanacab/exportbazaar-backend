require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();

// Allow frontend (billing.exportbazaar.in) to make API calls
app.use(cors({
  origin: ['https://billing.exportbazaar.in', 'http://billing.exportbazaar.in'],
  credentials: true
}));
app.use(express.json());

// MySQL connection using env variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL');
});

// Simple test route
app.get('/', (req, res) => {
  res.send('✅ Export Bazaar API is running');
});

// Login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received for:", email);

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      console.log("No user found");
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    console.log("User found:", user);

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        console.log("Password mismatch");
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({ message: 'Login successful', user: { email: user.email, role: user.role } });
    } catch (e) {
      console.error("Bcrypt error:", e);
      return res.status(500).json({ error: 'Internal error' });
    }
  });
});


// Listen on port required by Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
