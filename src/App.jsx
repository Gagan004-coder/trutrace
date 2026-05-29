import { useState } from 'react';
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

const PAGE_META = {
  dashboard:    { title: 'Command Center',          subtitle: 'Real-time fraud intelligence overview · Canara Bank' },
  applications: { title: 'Applications',            subtitle: 'All loan applications under AI monitoring' },
  analyze:      { title: 'Analyze Document Bundle', subtitle: 'Upload documents and run AI fraud detection in real-time' },
  forensics:    { title: 'Forensics Lab',           subtitle: 'Layer 1 — ELA, metadata & font analysis' },
  behavioral:   { title: 'Behavioral Intelligence', subtitle: 'Layer 3 — Submission patterns & device analysis' },
  reports:      { title: 'Reports & Analytics',     subtitle: 'Performance metrics & RBI-compliant audit trail' },
};

function AppInner() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState(null);

  if (!user) return <AuthPage />;

  const navigate = (p) => { setPage(p); if (p !== 'applications') setSelectedApp(null); };
  const selectApp = (app) => { setSelectedApp(app); setPage('applications'); };
  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const meta = PAGE_META[page] || PAGE_META.dashboard;
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="app-container">
      <Sidebar activePage={page} onNavigate={navigate} />

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
        </main>
      </div>

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}

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
