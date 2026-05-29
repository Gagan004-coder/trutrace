const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDB } = require('./db.cjs');
const authRoutes = require('./routes/auth.cjs');
const appRoutes = require('./routes/applications.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow both local dev and production frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/applications', appRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'TruTrace API', timestamp: new Date().toISOString() }));

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🛡️  TruTrace Backend running on http://localhost:${PORT}`);
      console.log(`📊  TiDB: ${process.env.TIDB_HOST}:${process.env.TIDB_PORT} / ${process.env.TIDB_DATABASE}`);
      console.log(`✅  All routes ready\n`);
    });
  })
  .catch(err => {
    console.error('❌ TiDB connection failed:', err.message);
    console.log('\n⚠️  Running in OFFLINE MODE — configure .env with your TiDB credentials\n');
    app.listen(PORT, () => console.log(`🛡️  TruTrace Backend (offline) on http://localhost:${PORT}`));
  });

