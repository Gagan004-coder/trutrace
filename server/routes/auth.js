const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, branch, employee_id, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    // Check duplicate
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
const authMiddleware = require('../middleware/auth');
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

// PUT /api/auth/profile — update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, branch, employee_id, phone, password } = req.body;
    let updates = [];
    let params = [];

    if (name)        { updates.push('name = ?');        params.push(name); }
    if (branch !== undefined) { updates.push('branch = ?'); params.push(branch); }
    if (employee_id !== undefined) { updates.push('employee_id = ?'); params.push(employee_id); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
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

module.exports = router;
