import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BRANCHES = [
  'Mumbai Central', 'Delhi Connaught Place', 'Bengaluru Koramangala',
  'Pune Shivaji Nagar', 'Jaipur Malviya Nagar', 'Chennai Anna Nagar',
  'Hyderabad Banjara Hills', 'Ahmedabad CG Road', 'Kolkata Park Street',
  'Lucknow Hazratganj',
];

/* ─── Forgot-password state machine ───────────────────────────────────────
   step 1 → enter email
   step 2 → OTP shown (prototype: returned from API), user enters it
   step 3 → enter + confirm new password
   step 4 → success
─────────────────────────────────────────────────────────────────────────── */

export default function AuthPage() {
  const { login, register, loading, error, setError } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup | forgot

  // Login / Signup form
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'underwriter', branch: '', employee_id: '', phone: '',
  });

  // Forgot-password state
  const [fpStep, setFpStep]         = useState(1);   // 1 | 2 | 3 | 4
  const [fpEmail, setFpEmail]       = useState('');
  const [fpToken, setFpToken]       = useState('');   // generated token (shown to user in prototype)
  const [fpOtp, setFpOtp]           = useState('');   // what user typed
  const [fpUserName, setFpUserName] = useState('');
  const [fpPassword, setFpPassword] = useState('');
  const [fpConfirm, setFpConfirm]   = useState('');
  const [fpLoading, setFpLoading]   = useState(false);
  const [fpError, setFpError]       = useState('');
  const [fpSuccess, setFpSuccess]   = useState('');

  const set = (k, v) => { setError(''); setForm(f => ({ ...f, [k]: v })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      await register(form);
    } else {
      await login(form.email, form.password);
    }
  };

  // ── Forgot step 1: request OTP (sent via email) ──
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setFpError(''); setFpLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: fpEmail });
      // devOtp is only present in local dev when SMTP is not configured
      if (res.data.devOtp) setFpToken(res.data.devOtp);
      setFpUserName(res.data.userName || '');
      setFpStep(2);
    } catch (err) {
      setFpError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setFpLoading(false);
    }
  };

  // ── Forgot step 2: verify OTP (entered by user from email) ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFpError('');
    // In dev mode with devOtp, verify locally; in prod the server verifies during reset
    if (fpToken && fpOtp.trim() !== fpToken) {
      setFpError('Incorrect code. Please check and try again.');
      return;
    }
    setFpStep(3);
  };

  // ── Forgot step 3: set new password ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFpError('');
    if (fpPassword !== fpConfirm) { setFpError('Passwords do not match.'); return; }
    if (fpPassword.length < 6)   { setFpError('Password must be at least 6 characters.'); return; }
    setFpLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', {
        email: fpEmail,
        token: fpOtp,        // what the user typed from their email
        newPassword: fpPassword,
      });
      setFpSuccess(res.data.message);
      setFpStep(4);
    } catch (err) {
      setFpError(err.response?.data?.error || 'Reset failed. Try requesting a new code.');
    } finally {
      setFpLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setFpStep(1); setFpEmail(''); setFpToken(''); setFpOtp('');
    setFpPassword(''); setFpConfirm(''); setFpError(''); setFpSuccess('');
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    resetForgotFlow();
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.07) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 480, padding: 24 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 0 30px rgba(59,130,246,0.4)',
          }}>🛡️</div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 900 }}>TruTrace</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            Real-Time Document Fraud Intelligence · Canara Bank
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>

          {/* ─── Login / Signup mode ─── */}
          {mode !== 'forgot' && (
            <>
              <div className="tab-bar" style={{ marginBottom: 24 }}>
                <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => switchMode('login')} id="tab-login">
                  🔐 Login
                </button>
                <button className={`tab-btn ${mode === 'signup' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => switchMode('signup')} id="tab-signup">
                  ✨ Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <>
                    <InputField label="Full Name *" id="inp-name" value={form.name} onChange={v => set('name', v)} placeholder="Priya Mehta" required />
                    <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role *</label>
                        <select id="inp-role" value={form.role} onChange={e => set('role', e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          <option value="underwriter">Underwriter</option>
                          <option value="manager">Manager</option>
                          <option value="fraud_analyst">Fraud Analyst</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Employee ID</label>
                        <input id="inp-empid" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
                          placeholder="CB-2024-001"
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Branch</label>
                      <select id="inp-branch" value={form.branch} onChange={e => set('branch', e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        <option value="">Select branch…</option>
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <InputField label="Phone" id="inp-phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 98765 43210" type="tel" />
                  </>
                )}

                <InputField label="Email Address *" id="inp-email" value={form.email} onChange={v => set('email', v)} placeholder="priya@canarabank.com" type="email" required />
                <InputField label="Password *" id="inp-password" value={form.password} onChange={v => set('password', v)} placeholder="Min. 6 characters" type="password" required />
                {mode === 'signup' && (
                  <InputField label="Confirm Password *" id="inp-confirm" value={form.confirmPassword} onChange={v => set('confirmPassword', v)} placeholder="Re-enter password" type="password" required />
                )}

                {error && <ErrorBox msg={error} />}

                <button
                  type="submit" disabled={loading}
                  id="auth-submit-btn"
                  style={{
                    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1, boxShadow: '0 0 20px rgba(59,130,246,0.3)',
                    transition: 'all 0.2s', fontFamily: 'Space Grotesk',
                  }}
                  onMouseEnter={e => !loading && (e.target.style.boxShadow = '0 0 30px rgba(59,130,246,0.5)')}
                  onMouseLeave={e => e.target.style.boxShadow = '0 0 20px rgba(59,130,246,0.3)'}
                >
                  {loading ? '⏳ Please wait…' : mode === 'login' ? '🔐 Sign In to TruTrace' : '✨ Create Account'}
                </button>

                {/* Forgot password link */}
                {mode === 'login' && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button
                      type="button"
                      id="btn-forgot-password"
                      onClick={() => switchMode('forgot')}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--accent-blue)', fontSize: '0.82rem', fontWeight: 600,
                        textDecoration: 'underline', textUnderlineOffset: 3,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.target.style.opacity = '0.75'}
                      onMouseLeave={e => e.target.style.opacity = '1'}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </form>
            </>
          )}

          {/* ─── Forgot Password mode ─── */}
          {mode === 'forgot' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <button
                  id="btn-back-to-login"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                    borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                    color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  ← Back
                </button>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk', fontSize: '1rem' }}>Reset Password</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Step {fpStep === 4 ? '3' : fpStep} of 3
                  </div>
                </div>
              </div>

              {/* Step progress dots */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: (fpStep === 4 ? 3 : fpStep) >= s
                      ? 'linear-gradient(90deg,#3b82f6,#6366f1)'
                      : 'var(--border-default)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>

              {/* ── Step 1: Email ── */}
              {fpStep === 1 && (
                <form onSubmit={handleForgotRequest}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                    Enter your registered email address and we'll send a 6-digit reset code to your inbox.
                  </p>
                  <InputField
                    label="Registered Email *" id="fp-email"
                    value={fpEmail} onChange={setFpEmail}
                    placeholder="priya@canarabank.com" type="email" required
                  />
                  {fpError && <ErrorBox msg={fpError} />}
                  <SubmitBtn id="fp-request-btn" loading={fpLoading} label="📧 Send Reset Code" />
                </form>
              )}

              {/* ── Step 2: Enter OTP from email ── */}
              {fpStep === 2 && (
                <form onSubmit={handleVerifyOtp}>
                  {/* Email sent confirmation */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 12, padding: '16px', marginBottom: 20, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📧</div>
                    <div style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '0.9rem', marginBottom: 4 }}>Code sent to your email!</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Check <strong style={{ color: 'var(--text-secondary)' }}>{fpEmail}</strong> for a 6-digit code.
                      It expires in 15 minutes.
                    </div>
                  </div>

                  {/* Dev-only fallback when SMTP is not configured */}
                  {fpToken && (
                    <div style={{
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 9, padding: '10px 14px', marginBottom: 16,
                      fontSize: '0.8rem', color: '#fcd34d',
                    }}>
                      ⚙️ <strong>Dev mode</strong> — SMTP not configured. Your code: <strong style={{ letterSpacing: '0.2em', fontFamily: 'monospace' }}>{fpToken}</strong>
                    </div>
                  )}

                  <InputField
                    label="6-digit reset code *" id="fp-otp"
                    value={fpOtp} onChange={setFpOtp}
                    placeholder="e.g. 482910" required
                  />
                  {fpError && <ErrorBox msg={fpError} />}
                  <SubmitBtn id="fp-verify-btn" loading={false} label="Verify Code →" />

                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button type="button" onClick={() => { setFpStep(1); setFpError(''); setFpToken(''); setFpOtp(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      ↺ Resend to a different email
                    </button>
                  </div>
                </form>
              )}

              {/* ── Step 3: New password ── */}
              {fpStep === 3 && (
                <form onSubmit={handleResetPassword}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                    ✅ Code verified! Choose a strong new password.
                  </p>
                  <InputField
                    label="New Password *" id="fp-new-pass"
                    value={fpPassword} onChange={setFpPassword}
                    placeholder="Min. 6 characters" type="password" required
                  />
                  <InputField
                    label="Confirm New Password *" id="fp-confirm-pass"
                    value={fpConfirm} onChange={setFpConfirm}
                    placeholder="Re-enter password" type="password" required
                  />
                  {fpError && <ErrorBox msg={fpError} />}
                  <SubmitBtn id="fp-reset-btn" loading={fpLoading} label="🔑 Reset Password" />
                </form>
              )}

              {/* ── Step 4: Success ── */}
              {fpStep === 4 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, marginBottom: 8 }}>Password Reset!</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.6 }}>
                    {fpSuccess || 'Your password has been updated successfully.'}
                  </p>
                  <button
                    id="fp-go-login-btn"
                    onClick={() => switchMode('login')}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(59,130,246,0.3)', fontFamily: 'Space Grotesk',
                    }}
                  >
                    🔐 Sign In Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 16 }}>
          Secured with JWT · Data stored in TiDB Cloud · RBI Compliant
        </p>
      </div>
    </div>
  );
}

/* ─── Shared sub-components ─────────────────────────────────────────────── */

function InputField({ label, id, value, onChange, placeholder, type = 'text', required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <input
        id={id} type={type} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--bg-elevated)',
          border: `1px solid ${focused ? 'var(--accent-blue)' : 'var(--border-default)'}`,
          borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem',
          outline: 'none', transition: 'border-color 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
        }}
      />
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 9, padding: '10px 14px', marginBottom: 16,
      fontSize: '0.82rem', color: '#fca5a5',
    }}>⚠️ {msg}</div>
  );
}

function SubmitBtn({ id, loading, label }) {
  return (
    <button
      type="submit" id={id} disabled={loading}
      style={{
        width: '100%', padding: '13px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        color: 'white', fontWeight: 700, fontSize: '0.95rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        boxShadow: '0 0 20px rgba(59,130,246,0.3)',
        transition: 'all 0.2s', fontFamily: 'Space Grotesk',
      }}
      onMouseEnter={e => !loading && (e.target.style.boxShadow = '0 0 30px rgba(59,130,246,0.5)')}
      onMouseLeave={e => e.target.style.boxShadow = '0 0 20px rgba(59,130,246,0.3)'}
    >
      {loading ? '⏳ Please wait…' : label}
    </button>
  );
}
