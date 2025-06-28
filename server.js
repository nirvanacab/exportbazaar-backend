require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());

// ✅ CORS configuration
const allowedOrigins = [
  'http://billing.exportbazaar.in',
  'https://billing.exportbazaar.in'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ MySQL connection
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

// ✅ Login route
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


// ✅ Health check route
app.get('/', (req, res) => {
  res.send('🚀 Export Bazaar API is running');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
