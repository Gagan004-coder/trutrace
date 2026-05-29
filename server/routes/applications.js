const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/applications — list all applications
router.get('/', auth, async (req, res) => {
  try {
    const { status, risk_tier, search } = req.query;
    let query = 'SELECT * FROM applications WHERE 1=1';
    const params = [];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (risk_tier) { query += ' AND risk_tier = ?'; params.push(risk_tier); }
    if (search) { query += ' AND (applicant_name LIKE ? OR id LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY submitted_at DESC';
    const [rows] = await pool.execute(query, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/:id — single application with flags, docs, signals, timeline
router.get('/:id', auth, async (req, res) => {
  try {
    const [apps] = await pool.execute('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    if (apps.length === 0) return res.status(404).json({ error: 'Application not found' });
    const app = apps[0];

    const [flags] = await pool.execute('SELECT * FROM flags WHERE application_id = ? ORDER BY severity DESC', [req.params.id]);
    const [docs] = await pool.execute('SELECT * FROM documents WHERE application_id = ?', [req.params.id]);
    const [signals] = await pool.execute('SELECT * FROM behavioral_signals WHERE application_id = ?', [req.params.id]);
    const [timeline] = await pool.execute('SELECT * FROM timeline_events WHERE application_id = ? ORDER BY event_time ASC', [req.params.id]);
    const [actions] = await pool.execute('SELECT * FROM application_actions WHERE application_id = ? ORDER BY created_at DESC', [req.params.id]);

    return res.json({ ...app, flags, documents: docs, behavioralSignals: signals, timeline, actions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/applications — create new application + trigger analysis
router.post('/', auth, async (req, res) => {
  try {
    const { applicant_name, loan_type, amount, amount_display, branch, doc_count } = req.body;
    const id = 'APP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000);

    // Simulate AI analysis scores
    const forensic = Math.floor(Math.random() * 60) + 20;
    const semantic = Math.floor(Math.random() * 60) + 20;
    const behavioral = Math.floor(Math.random() * 60) + 20;
    const metadata = Math.floor(Math.random() * 60) + 20;
    const riskScore = Math.round((forensic * 0.35 + semantic * 0.3 + behavioral * 0.2 + metadata * 0.15));
    const riskTier = riskScore >= 86 ? 'critical' : riskScore >= 61 ? 'high' : riskScore >= 31 ? 'medium' : 'low';
    const flagCount = riskScore >= 86 ? 7 : riskScore >= 61 ? 4 : riskScore >= 31 ? 2 : 0;
    const status = riskTier === 'critical' ? 'Flagged' : riskTier === 'high' ? 'Flagged' : 'Under Review';

    const aiSummary = generateAISummary(applicant_name, riskScore, riskTier, forensic, semantic, behavioral);

    await pool.execute(
      `INSERT INTO applications (id, applicant_name, loan_type, amount, amount_display, branch, submitted_at, status, risk_score, risk_tier, doc_count, flag_count, analyst_id, analyst_name, ai_summary, forensic_score, semantic_score, behavioral_score, metadata_score)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, applicant_name, loan_type, amount, amount_display, branch, status, riskScore, riskTier, doc_count || 0, flagCount, req.user.id, req.user.name, aiSummary, forensic, semantic, behavioral, metadata]
    );

    // Log timeline event
    await pool.execute(
      'INSERT INTO timeline_events (application_id, event_time, event_text, event_type) VALUES (?, NOW(), ?, ?)',
      [id, `Application submitted by ${req.user.name}`, 'info']
    );
    await pool.execute(
      'INSERT INTO timeline_events (application_id, event_time, event_text, event_type) VALUES (?, NOW(), ?, ?)',
      [id, `TruTrace AI analysis complete — Score: ${riskScore} (${riskTier.toUpperCase()} RISK)`, riskTier === 'critical' || riskTier === 'high' ? 'critical' : 'info']
    );

    const [newApp] = await pool.execute('SELECT * FROM applications WHERE id = ?', [id]);
    return res.status(201).json(newApp[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create application' });
  }
});

// PATCH /api/applications/:id/action — escalate/hold/approve/reject
router.patch('/:id/action', auth, async (req, res) => {
  try {
    const { action, notes } = req.body;
    const validActions = ['Approve', 'Reject', 'Escalate', 'Hold', 'Flag for Review'];
    if (!validActions.includes(action)) return res.status(400).json({ error: 'Invalid action' });

    const statusMap = {
      'Approve': 'Approved', 'Reject': 'Rejected',
      'Escalate': 'Escalated', 'Hold': 'On Hold', 'Flag for Review': 'Flagged'
    };
    const newStatus = statusMap[action];

    await pool.execute('UPDATE applications SET status = ? WHERE id = ?', [newStatus, req.params.id]);

    await pool.execute(
      'INSERT INTO application_actions (application_id, action, user_id, user_name, notes) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, action, req.user.id, req.user.name, notes || '']
    );
    await pool.execute(
      'INSERT INTO timeline_events (application_id, event_time, event_text, event_type) VALUES (?, NOW(), ?, ?)',
      [req.params.id, `${action} by ${req.user.name}${notes ? ': ' + notes : ''}`,
       action === 'Escalate' || action === 'Reject' ? 'critical' : action === 'Hold' ? 'alert' : 'info']
    );

    const [updated] = await pool.execute('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    return res.json({ message: `Application ${action}d successfully`, application: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Action failed' });
  }
});

// GET /api/applications/stats/dashboard — dashboard statistics
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM applications WHERE DATE(submitted_at) = CURDATE()');
    const [[{ flagged }]] = await pool.execute("SELECT COUNT(*) as flagged FROM applications WHERE DATE(submitted_at) = CURDATE() AND status IN ('Flagged','Escalated')");
    const [[{ approved }]] = await pool.execute("SELECT COUNT(*) as approved FROM applications WHERE DATE(submitted_at) = CURDATE() AND status = 'Approved'");
    const [[{ critical }]] = await pool.execute("SELECT COUNT(*) as critical FROM applications WHERE risk_tier = 'critical' AND status NOT IN ('Approved','Rejected')");

    const [riskDist] = await pool.execute('SELECT risk_tier, COUNT(*) as count FROM applications GROUP BY risk_tier');
    const [recent] = await pool.execute('SELECT * FROM applications ORDER BY submitted_at DESC LIMIT 10');

    return res.json({ total, flagged, approved, critical, riskDist, recent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Stats failed' });
  }
});

function generateAISummary(name, score, tier, f, s, b) {
  if (tier === 'critical' || tier === 'high') {
    return `Application from ${name} presents multiple high-confidence fraud indicators. Forensic layer score ${f}/100 indicates document tampering. Semantic cross-validation score ${s}/100 reveals entity mismatches across submitted documents. Behavioral analysis score ${b}/100 shows anomalous submission patterns. Recommended action: ${tier === 'critical' ? 'Reject and escalate to fraud team' : 'Hold for manual investigation'}.`;
  } else if (tier === 'medium') {
    return `Application from ${name} shows moderate risk signals. Some entity discrepancies detected during cross-document validation. Secondary review recommended before approval.`;
  }
  return `Application from ${name} passed all three intelligence layers with low risk indicators. Documents appear authentic and consistent. Approved for standard underwriting process.`;
}

module.exports = router;
