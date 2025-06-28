require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['http://billing.exportbazaar.in', 'https://billing.exportbazaar.in'],
  credentials: true
}));
app.use(express.json());

// ✅ FIXED: use connection pool
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
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
      console.warn("User not found");
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    console.log("User found:", user);

    console.log("Password entered by user:", password);
    console.log("Password stored in DB:", user.password);


    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        console.warn("Password mismatch");
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log("Login successful");
      res.json({
        message: 'Login successful',
        user: { email: user.email, role: user.role }
      });
    } catch (e) {
      console.error("Bcrypt error:", e);
      res.status(500).json({ error: 'Password comparison failed' });
    }
  });
});

app.get('/', (req, res) => {
  res.send('🚀 Export Bazaar API is running');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
