import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Analyze from './pages/Analyze';
import Forensics from './pages/Forensics';
import Behavioral from './pages/Behavioral';
import Reports from './pages/Reports';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

const PAGE_META = {
  dashboard:    { title: 'Command Center',          subtitle: 'Real-time fraud intelligence overview · Canara Bank' },
  applications: { title: 'Applications',            subtitle: 'All loan applications under AI monitoring' },
  analyze:      { title: 'Analyze Document Bundle', subtitle: 'Upload documents and run AI fraud detection in real-time' },
  forensics:    { title: 'Forensics Lab',           subtitle: 'Layer 1 — ELA, metadata & font analysis' },
  behavioral:   { title: 'Behavioral Intelligence', subtitle: 'Layer 3 — Submission patterns & device analysis' },
  reports:      { title: 'Reports & Analytics',     subtitle: 'Performance metrics & RBI-compliant audit trail' },
  admin_panel:  { title: 'Identity & Access',       subtitle: 'System Administration · Role Management · TruTrace' },
};

const ROLE_PERMISSIONS = {
  admin: ['dashboard', 'applications', 'analyze', 'forensics', 'behavioral', 'reports', 'admin_panel'],
  fraud_analyst: ['dashboard', 'applications', 'analyze', 'forensics', 'behavioral', 'reports'],
  underwriter: ['dashboard', 'applications', 'analyze', 'reports'],
  manager: ['dashboard', 'applications', 'reports'],
};

function AppInner() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      const allowedPages = ROLE_PERMISSIONS[user.role] || ['dashboard', 'applications', 'reports'];
      if (!allowedPages.includes(page)) {
        setPage('dashboard');
      }
    }
  }, [user, page]);

  if (!user) return <AuthPage />;

  const navigate = (p) => {
    const allowedPages = ROLE_PERMISSIONS[user.role] || ['dashboard', 'applications', 'reports'];
    if (allowedPages.includes(p)) {
      setPage(p);
      if (p !== 'applications') setSelectedApp(null);
    } else {
      setPage('dashboard');
      if (p !== 'dashboard') setSelectedApp(null);
    }
  };

  const selectApp = (app) => {
    const allowedPages = ROLE_PERMISSIONS[user.role] || ['dashboard', 'applications', 'reports'];
    if (allowedPages.includes('applications')) {
      setSelectedApp(app);
      setPage('applications');
    }
  };

  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const meta = PAGE_META[page] || PAGE_META.dashboard;
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="app-container">
      <Sidebar activePage={page} onNavigate={navigate} onLogout={() => setShowLogoutModal(true)} />

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <div>
              <div className="page-title">{meta.title}</div>
              <div className="page-subtitle">{meta.subtitle}</div>
            </div>
          </div>
          <div className="topbar-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
              <span className="live-dot" />AI Engine Active
            </div>
            <button className="topbar-btn btn-ghost" style={{ position: 'relative', padding: '8px 12px' }}
              onClick={() => showToast('🚨 3 critical applications require immediate attention')}
              id="alert-bell-btn">
              🔔
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'blink 1s ease infinite' }} />
            </button>

            {/* User avatar — click to open profile */}
            <button onClick={() => setShowProfile(true)} id="user-avatar-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: user.avatar_color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>
                {initials}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user.role?.replace('_', ' ')}</div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>✏️</span>
            </button>
          </div>
        </header>

        <main>
          {page === 'dashboard'    && <Dashboard    onNavigate={navigate} onSelectApp={selectApp} />}
          {page === 'applications' && <Applications selectedApp={selectedApp} onSelectApp={setSelectedApp} />}
          {page === 'analyze'      && <Analyze />}
          {page === 'forensics'    && <Forensics />}
          {page === 'behavioral'   && <Behavioral />}
          {page === 'reports'      && <Reports />}
          {page === 'admin_panel'  && <AdminPanel />}
        </main>
      </div>

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}

      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card animate-fade-up" style={{ maxWidth: 400, width: '100%', padding: '24px 28px', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: 12 }}>🚪</div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
              Confirm Sign Out
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to sign out of TruTrace Fraud Intelligence? You will need to log in again to access the portal.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="topbar-btn btn-danger" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px', borderRadius: 9 }} 
                onClick={() => { logout(); setShowLogoutModal(false); }}
                id="modal-confirm-logout-btn"
              >
                Sign Out
              </button>
              <button 
                className="topbar-btn btn-ghost" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px', borderRadius: 9 }} 
                onClick={() => setShowLogoutModal(false)}
                id="modal-cancel-logout-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" style={{ borderColor: toast.type === 'danger' ? 'rgba(220,38,38,0.4)' : 'var(--border-default)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
