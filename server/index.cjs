const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initDB } = require('./db.cjs');
const authRoutes = require('./routes/auth.cjs');
const appRoutes = require('./routes/applications.cjs');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// In production, frontend & backend share the same origin — no CORS needed.
// In dev, allow Vite dev server origins.
if (!isProd) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }));
}

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/applications', appRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'TruTrace API', timestamp: new Date().toISOString() }));

// ── Serve React frontend (production) ────────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  // All non-API routes → index.html (React Router handles them)
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🛡️  TruTrace Backend running on http://localhost:${PORT}`);
      console.log(`📊  TiDB: ${process.env.TIDB_HOST}:${process.env.TIDB_PORT} / ${process.env.TIDB_DATABASE}`);
      console.log(`✅  All routes ready\n`);
      if (isProd) console.log(`🌐  Serving React frontend from ./dist`);
    });
  })
  .catch(err => {
    console.error('❌ TiDB connection failed:', err.message);
    console.log('\n⚠️  Running in OFFLINE MODE — configure .env with your TiDB credentials\n');
    app.listen(PORT, () => console.log(`🛡️  TruTrace Backend (offline) on http://localhost:${PORT}`));
  });
