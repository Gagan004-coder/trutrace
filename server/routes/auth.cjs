const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { pool } = require('../db.cjs');
require('dotenv').config();

const router = express.Router();

/* ─── Nodemailer SMTP transporter ─────────────────────────────────────────── */
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // SMTP not configured — dev fallback
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendResetEmail = async (toEmail, userName, otp) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`\n📧 [DEV] Password reset OTP for ${toEmail}: ${otp}\n`);
    return { devMode: true };
  }

  const fromName = process.env.SMTP_FROM_NAME || 'TruTrace Security';
  const fromEmail = process.env.SMTP_USER;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px;text-align:center;">
              <div style="font-size:2.5rem;margin-bottom:8px;">🛡️</div>
              <h1 style="color:#fff;margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-0.5px;">TruTrace</h1>
              <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:0.85rem;">Real-Time Document Fraud Intelligence &middot; Canara Bank</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#94a3b8;margin:0 0 8px;font-size:0.9rem;">Hello, <strong style="color:#e2e8f0;">${userName}</strong></p>
              <h2 style="color:#f1f5f9;margin:0 0 16px;font-size:1.2rem;font-weight:700;">Password Reset Request</h2>
              <p style="color:#94a3b8;font-size:0.88rem;line-height:1.6;margin:0 0 24px;">
                We received a request to reset your TruTrace account password.
                Use the code below to proceed. This code is valid for
                <strong style="color:#e2e8f0;">15 minutes</strong>.
              </p>
              <div style="background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.15));border:1px solid rgba(99,102,241,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="color:#94a3b8;margin:0 0 8px;font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;">Your Reset Code</p>
                <p style="color:#60a5fa;font-size:2.8rem;font-weight:900;letter-spacing:0.4em;margin:0;font-family:'Courier New',monospace;">${otp}</p>
                <p style="color:#64748b;margin:8px 0 0;font-size:0.75rem;">&#8987; Expires in 15 minutes</p>
              </div>
              <p style="color:#64748b;font-size:0.8rem;line-height:1.6;margin:0 0 8px;">
                If you did not request a password reset, please ignore this email.
                Your password will remain unchanged.
              </p>
              <p style="color:#64748b;font-size:0.8rem;margin:0;">
                For security, never share this code with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:20px 32px;text-align:center;border-top:1px solid #1e293b;">
              <p style="color:#475569;font-size:0.75rem;margin:0;">
                &copy; ${new Date().getFullYear()} TruTrace &middot; Canara Bank &middot; Secured with JWT &amp; TiDB Cloud
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `Your TruTrace Password Reset Code: ${otp}`,
    text: `Hello ${userName},\n\nYour TruTrace password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\n— TruTrace Security`,
    html,
  });
};

/* ─── Routes ──────────────────────────────────────────────────────────────── */

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, branch, employee_id, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 12);
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, branch, employee_id, phone, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashed, role || 'underwriter', branch || '', employee_id || '', phone || '', color]
    );
    const token = jwt.sign(
      { id: result.insertId, email, name, role: role || 'underwriter' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      user: { id: result.insertId, name, email, role: role || 'underwriter', branch, employee_id, phone, avatar_color: color }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, branch: user.branch, employee_id: user.employee_id,
        phone: user.phone, avatar_color: user.avatar_color, created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
const authMiddleware = require('../middleware/auth.cjs');
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, branch, employee_id, phone, avatar_color, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, branch, employee_id, phone, password } = req.body;
    let updates = [];
    let params = [];

    if (name)                    { updates.push('name = ?');        params.push(name); }
    if (branch !== undefined)    { updates.push('branch = ?');      params.push(branch); }
    if (employee_id !== undefined) { updates.push('employee_id = ?'); params.push(employee_id); }
    if (phone !== undefined)     { updates.push('phone = ?');       params.push(phone); }
    if (password) {
      const hashed = await bcrypt.hash(password, 12);
      updates.push('password = ?');
      params.push(hashed);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.user.id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, branch, employee_id, phone, avatar_color, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return res.json({ message: 'Profile updated', user: rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/auth/forgot-password — generates OTP and sends via SMTP email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const [rows] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.json({ message: 'If that email is registered, a reset code has been sent.' });
    }

    const user = rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
      [otp, expires, email]
    );

    const result = await sendResetEmail(email, user.name, otp);

    return res.json({
      message: result?.devMode
        ? 'Dev mode: OTP logged to server console. Configure SMTP env vars for real emails.'
        : 'Reset code sent! Check your email inbox.',
      // Only expose OTP in non-production dev mode
      ...(result?.devMode && process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// POST /api/auth/reset-password — validates OTP and sets new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [rows] = await pool.execute(
      'SELECT id, reset_token, reset_expires FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid request' });

    const user = rows[0];
    if (!user.reset_token || user.reset_token !== token) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }
    if (new Date() > new Date(user.reset_expires)) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [hashed, user.id]
    );

    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
