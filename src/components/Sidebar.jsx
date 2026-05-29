import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard',    icon: '📊', label: 'Dashboard',           section: 'main', roles: ['admin', 'manager', 'fraud_analyst', 'underwriter'] },
  { id: 'applications', icon: '📁', label: 'Applications',        section: 'main', badge: 3, roles: ['admin', 'manager', 'fraud_analyst', 'underwriter'] },
  { id: 'analyze',      icon: '🔍', label: 'Analyze Document',    section: 'main', roles: ['admin', 'fraud_analyst', 'underwriter'] },
  { id: 'forensics',    icon: '🔬', label: 'Forensics Lab',       section: 'tools', roles: ['admin', 'fraud_analyst'] },
  { id: 'behavioral',   icon: '🧠', label: 'Behavioral Intel',    section: 'tools', roles: ['admin', 'fraud_analyst'] },
  { id: 'reports',      icon: '📈', label: 'Reports',             section: 'tools', roles: ['admin', 'manager', 'fraud_analyst', 'underwriter'] },
  { id: 'admin_panel',  icon: '⚙️', label: 'Admin Console',       section: 'tools', roles: ['admin'] },
];

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  const { user } = useAuth();
  const userRole = user?.role || 'underwriter';

  const filteredItems = navItems.filter(item => item.roles.includes(userRole));
  const mainItems = filteredItems.filter(item => item.section === 'main');
  const toolItems = filteredItems.filter(item => item.section === 'tools');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🛡️</div>
        <div>
          <div className="logo-text">TruTrace</div>
          <div className="logo-sub">Fraud Intelligence</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {mainItems.length > 0 && (
          <>
            <div className="nav-section-label">Main</div>
            {mainItems.map(item => (
              <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)} id={`nav-${item.id}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
          </>
        )}

        {toolItems.length > 0 && (
          <>
            <div className="nav-section-label" style={{ marginTop: 12 }}>Intelligence Tools</div>
            {toolItems.map(item => (
              <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)} id={`nav-${item.id}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {/* Enhanced Sign Out Button */}
        <button 
          onClick={onLogout}
          className="topbar-btn btn-danger"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginBottom: 14,
            padding: '10px 14px',
            fontSize: '0.85rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'Space Grotesk',
            fontWeight: 600,
          }}
          onMouseEnter={e => {
            e.target.style.background = 'rgba(239, 68, 68, 0.18)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            e.target.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.25)';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'rgba(239, 68, 68, 0.08)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.25)';
            e.target.style.boxShadow = 'none';
          }}
          id="sidebar-logout-btn"
        >
          🚪 Sign Out
        </button>

        <div className="sidebar-status">
          <div className="status-dot" />
          <span>AI Engine — Online</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
          Canara Bank · TruTrace v2.4.1
        </div>
      </div>
    </aside>
  );
}
