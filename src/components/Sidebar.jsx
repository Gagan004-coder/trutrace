const navItems = [
  { id: 'dashboard',    icon: '📊', label: 'Dashboard',           section: 'main' },
  { id: 'applications', icon: '📁', label: 'Applications',        section: 'main', badge: 3 },
  { id: 'analyze',      icon: '🔍', label: 'Analyze Document',    section: 'main' },
  { id: 'forensics',    icon: '🔬', label: 'Forensics Lab',       section: 'tools' },
  { id: 'behavioral',   icon: '🧠', label: 'Behavioral Intel',    section: 'tools' },
  { id: 'reports',      icon: '📈', label: 'Reports',             section: 'tools' },
];

export default function Sidebar({ activePage, onNavigate }) {
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
        <div className="nav-section-label">Main</div>
        {navItems.filter(n => n.section === 'main').map(item => (
          <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)} id={`nav-${item.id}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
        <div className="nav-section-label" style={{ marginTop: 12 }}>Intelligence Tools</div>
        {navItems.filter(n => n.section === 'tools').map(item => (
          <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)} id={`nav-${item.id}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
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
