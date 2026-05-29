import { useState, useEffect } from 'react';
import api from '../api/client';

const BRANCHES = [
  'Mumbai Central', 'Delhi Connaught Place', 'Bengaluru Koramangala',
  'Pune Shivaji Nagar', 'Jaipur Malviya Nagar', 'Chennai Anna Nagar',
  'Hyderabad Banjara Hills', 'Ahmedabad CG Road', 'Kolkata Park Street',
  'Lucknow Hazratganj',
];

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // User creation state
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'underwriter',
    branch: '', employee_id: '', phone: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load users. Are you signed in as Admin?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await api.put(`/auth/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.role } : u));
      showToast(`Role updated to ${newRole.replace('_', ' ')} successfully`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user role', 'error');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast(`User "${userName}" deleted successfully`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const { data } = await api.post('/auth/users', form);
      setUsers(prev => [...prev, data]);
      setShowAddModal(false);
      setForm({ name: '', email: '', password: '', role: 'underwriter', branch: '', employee_id: '', phone: '' });
      showToast(`User "${data.name}" registered successfully`);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Registration failed');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          (u.employee_id && u.employee_id.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate statistics
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const managerCount = users.filter(u => u.role === 'manager').length;
  const analystCount = users.filter(u => u.role === 'fraud_analyst').length;
  const underwriterCount = users.filter(u => u.role === 'underwriter').length;

  if (loading && users.length === 0) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-secondary)' }}>Loading identity data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-up">
      {/* User Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card" style={{ '--stat-color': 'var(--grad-blue)' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)' }}>👥</div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-label">Total Staff Accounts</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--grad-cyan)' }}>
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)' }}>🛡️</div>
          <div className="stat-value">{adminCount}</div>
          <div className="stat-label">System Admins</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--grad-success)' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)' }}>💼</div>
          <div className="stat-value">{managerCount}</div>
          <div className="stat-label">Credit Managers</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--grad-warning)' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)' }}>🔍</div>
          <div className="stat-value">{analystCount + underwriterCount}</div>
          <div className="stat-label">Analysts & Underwriters</div>
        </div>
      </div>

      {/* Main card */}
      <div className="card">
        <div className="section-header" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="section-title">User Account Directory</div>
            <div className="section-sub">Manage system roles, departments, and register new credit officers</div>
          </div>
          <button className="topbar-btn btn-primary" onClick={() => setShowAddModal(true)} id="btn-add-user">
            ✨ Add User Account
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, padding: '12px 16px', marginBottom: 20, color: '#fca5a5', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 260, padding: '10px 14px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)',
              fontSize: '0.85rem', outline: 'none'
            }}
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', minWidth: 160
            }}
          >
            <option value="all">All Roles</option>
            <option value="underwriter">Underwriter</option>
            <option value="manager">Manager</option>
            <option value="fraud_analyst">Fraud Analyst</option>
            <option value="admin">System Admin</option>
          </select>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: 'auto' }}>
          {filteredUsers.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Employee ID</th>
                  <th>Branch Location</th>
                  <th>Access Role</th>
                  <th>Phone Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, background: user.avatar_color || '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem',
                            fontWeight: 700, color: 'white', boxShadow: `0 0 10px ${user.avatar_color || '#3b82f6'}40`
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem', color: 'var(--text-accent)' }}>
                          {user.employee_id || 'N/A'}
                        </code>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {user.branch || 'Corporate Office'}
                      </td>
                      <td>
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          style={{
                            padding: '4px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                            borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none'
                          }}
                        >
                          <option value="underwriter">Underwriter</option>
                          <option value="manager">Manager</option>
                          <option value="fraud_analyst">Fraud Analyst</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {user.phone || '—'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="topbar-btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: 6 }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ padding: 48 }}>
              <div className="empty-icon">👥</div>
              <div className="empty-text">No user accounts match your search filters</div>
            </div>
          )}
        </div>
      </div>

      {/* User Creation Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card animate-fade-up" style={{ maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.2rem' }}>✨ Register New Staff Account</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: '#fca5a5' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input
                  type="text" required placeholder="Aarav Sharma"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email Address *</label>
                <input
                  type="email" required placeholder="aarav@canarabank.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Temporary Password *</label>
                <input
                  type="password" required placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role *</label>
                  <select
                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  >
                    <option value="underwriter">Underwriter</option>
                    <option value="manager">Manager</option>
                    <option value="fraud_analyst">Fraud Analyst</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Employee ID</label>
                  <input
                    type="text" placeholder="CB-2026-901"
                    value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Branch</label>
                  <select
                    value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  >
                    <option value="">Select branch...</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Phone Number</label>
                  <input
                    type="tel" placeholder="+91 99999 88888"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <button type="submit" disabled={formLoading} className="topbar-btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {formLoading ? '⏳ Registering...' : '💾 Register Staff'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="topbar-btn btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast" style={{
          borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)',
          background: toast.type === 'error' ? 'rgba(10,5,5,0.97)' : 'var(--bg-card)'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
