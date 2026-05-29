const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/applications');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', appRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TruTrace API', timestamp: new Date().toISOString() });
});

// Start server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🛡️  TruTrace Backend running on http://localhost:${PORT}`);
      console.log(`📊  TiDB connected: ${process.env.TIDB_HOST}:${process.env.TIDB_PORT}`);
      console.log(`✅  All routes ready\n`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err.message);
    console.log('\n⚠️  Running in OFFLINE MODE — using mock data fallback\n');
    app.listen(PORT, () => {
      console.log(`🛡️  TruTrace Backend (offline) running on http://localhost:${PORT}`);
    });
  });
