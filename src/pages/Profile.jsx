import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const BRANCHES = [
  'Mumbai Central', 'Delhi Connaught Place', 'Bengaluru Koramangala',
  'Pune Shivaji Nagar', 'Jaipur Malviya Nagar', 'Chennai Anna Nagar',
  'Hyderabad Banjara Hills', 'Ahmedabad CG Road', 'Kolkata Park Street',
  'Lucknow Hazratganj',
];

function InputField({ label, id, value, onChange, placeholder, type = 'text', disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        id={id} type={type} value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px',
          background: disabled ? 'rgba(71,85,105,0.2)' : 'var(--bg-elevated)',
          border: `1px solid ${focused && !disabled ? 'var(--accent-blue)' : 'var(--border-default)'}`,
          borderRadius: 9, color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          fontSize: '0.85rem', outline: 'none', cursor: disabled ? 'not-allowed' : 'text',
          boxShadow: focused && !disabled ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
        }}
      />
    </div>
  );
}

export default function Profile({ onClose }) {
  const { user, updateProfile, logout, loading, error, setError } = useAuth();
  const [tab, setTab] = useState('profile'); // profile | security
  const [form, setForm] = useState({
    name: user?.name || '',
    branch: user?.branch || '',
    employee_id: user?.employee_id || '',
    phone: user?.phone || '',
  });
  const [pwForm, setPwForm] = useState({ password: '', confirmPassword: '' });
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setError(''); setForm(f => ({ ...f, [k]: v })); };
  const setPw = (k, v) => { setError(''); setPwForm(f => ({ ...f, [k]: v })); };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    const res = await updateProfile(form);
    setSaving(false);
    if (res.success) showToast('✅ Profile updated successfully');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.password !== pwForm.confirmPassword) { setError('Passwords do not match'); return; }
    if (pwForm.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true);
    const res = await updateProfile({ password: pwForm.password });
    setSaving(false);
    if (res.success) { showToast('✅ Password updated successfully'); setPwForm({ password: '', confirmPassword: '' }); }
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto',
        animation: 'fadeInUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: user?.avatar_color || '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.3rem', color: 'white',
            boxShadow: `0 0 20px ${user?.avatar_color || '#3b82f6'}60`,
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem' }}>{user?.name}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span className="chip chip-blue">{user?.role?.replace('_', ' ')}</span>
              {user?.branch && <span className="chip chip-cyan">{user?.branch}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted)', padding: 4 }} id="close-profile-btn">✕</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '16px 28px 0' }}>
          <div className="tab-bar" style={{ marginBottom: 0 }}>
            <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')} id="profile-tab-info">👤 Profile Info</button>
            <button className={`tab-btn ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')} id="profile-tab-security">🔐 Security</button>
          </div>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: '#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <InputField label="Full Name" id="prof-name" value={form.name} onChange={v => set('name', v)} placeholder="Your full name" />
              <InputField label="Email (cannot change)" id="prof-email" value={user?.email} onChange={() => {}} disabled />
              <InputField label="Employee ID" id="prof-empid" value={form.employee_id} onChange={v => set('employee_id', v)} placeholder="CB-2024-001" />
              <InputField label="Phone" id="prof-phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 98765 43210" type="tel" />
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Branch</label>
                <select id="prof-branch" value={form.branch} onChange={e => set('branch', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  <option value="">Select branch…</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" disabled={saving || loading} id="save-profile-btn"
                  className="topbar-btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 12 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Profile'}
                </button>
              </div>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={handleChangePassword}>
              <div style={{ padding: '14px', background: 'rgba(59,130,246,0.07)', borderRadius: 10, marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                🔐 Changing your password will log you out of all other sessions.
              </div>
              <InputField label="New Password" id="pw-new" value={pwForm.password} onChange={v => setPw('password', v)} type="password" placeholder="Min. 6 characters" />
              <InputField label="Confirm New Password" id="pw-confirm" value={pwForm.confirmPassword} onChange={v => setPw('confirmPassword', v)} type="password" placeholder="Re-enter new password" />
              <button type="submit" disabled={saving || loading} id="save-password-btn"
                className="topbar-btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8 }}>
                {saving ? '⏳ Updating…' : '🔐 Update Password'}
              </button>
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={logout} id="logout-btn"
                  className="topbar-btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                  🚪 Sign Out
                </button>
              </div>
            </form>
          )}

          {toast && (
            <div style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
              background: 'var(--bg-card)', border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: 12, padding: '14px 20px', fontSize: '0.85rem',
              animation: 'slideInRight 0.3s ease', color: 'var(--accent-emerald)',
            }}>{toast}</div>
          )}
        </div>
      </div>
    </div>
  );
}
