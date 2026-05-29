import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { mockApplications } from '../data/mockData';
import ApplicationDetail from './ApplicationDetail';

function StatusPill({ status }) {
  const map = {
    'Under Review': { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    'Approved':     { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    'Flagged':      { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    'Rejected':     { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
    'Escalated':    { bg: 'rgba(220,38,38,0.14)',  color: '#fca5a5', border: 'rgba(220,38,38,0.35)' },
    'On Hold':      { bg: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: 'rgba(139,92,246,0.3)' },
  };
  const s = map[status] || map['Under Review'];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
      {status}
    </span>
  );
}

function ScoreCircle({ score, tier }) {
  const col = { critical: '#fca5a5', high: '#f87171', medium: '#fbbf24', low: '#34d399' }[tier] || '#60a5fa';
  const bg  = { critical: 'rgba(220,38,38,0.2)', high: 'rgba(239,68,68,0.2)', medium: 'rgba(245,158,11,0.2)', low: 'rgba(16,185,129,0.2)' }[tier] || 'rgba(59,130,246,0.2)';
  return (
    <div style={{ width: 38, height: 38, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '0.82rem', color: col }}>
      {score}
    </div>
  );
}

// Normalise API row vs mock row to a single shape
function normalise(app) {
  return {
    id: app.id,
    applicant: app.applicant_name || app.applicant || '',
    loanType: app.loan_type || app.loanType || '',
    amount: app.amount_display || app.amount || '',
    branch: app.branch || '',
    submittedAt: app.submitted_at ? new Date(app.submitted_at).toLocaleString('en-IN') : (app.submittedAt || ''),
    status: app.status || 'Under Review',
    riskScore: app.risk_score ?? app.riskScore ?? 0,
    riskTier: app.risk_tier || app.riskTier || 'low',
    flags: app.flag_count ?? app.flags ?? 0,
    analyst: app.analyst_name || app.analyst || '',
    _raw: app,
  };
}

export default function Applications({ selectedApp, onSelectApp }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [offline, setOffline] = useState(false);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.risk_tier = filter;
      if (search)           params.search = search;
      const { data } = await api.get('/applications', { params });
      setRows(data.length ? data : mockApplications);
      setOffline(data.length === 0);
    } catch {
      setRows(mockApplications);
      setOffline(true);
    } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  if (selectedApp) {
    return (
      <ApplicationDetail
        appId={selectedApp.id}
        appData={selectedApp._raw || selectedApp}
        onBack={() => { onSelectApp(null); fetchApps(); }}
      />
    );
  }

  const filtered = rows.map(normalise).filter(a => {
    const matchSearch = !search || a.applicant.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.riskTier === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800 }}>📁 Loan Applications</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            All applications under TruTrace AI monitoring
            {offline && <span style={{ color: '#fbbf24', marginLeft: 8 }}>⚠️ Showing demo data — connect TiDB to see live records</span>}
          </p>
        </div>
        <button className="topbar-btn btn-primary" onClick={fetchApps} id="refresh-apps-btn">🔄 Refresh</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            id="app-search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search applicant name or application ID…"
            style={{ width: '100%', padding: '10px 14px 10px 38px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
          />
        </div>
        <div className="tab-bar" style={{ marginBottom: 0 }}>
          {['all', 'low', 'medium', 'high', 'critical'].map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} id={`filter-${f}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 48 }}>
            <div className="spinner" />
            <span style={{ color: 'var(--text-secondary)' }}>Loading applications…</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Application ID</th>
                <th>Applicant</th>
                <th>Loan Type</th>
                <th>Amount</th>
                <th>Branch</th>
                <th>Risk Score</th>
                <th>Flags</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <tr key={app.id} style={{ animationDelay: `${i * 0.04}s` }}>
                  <td style={{ paddingLeft: 20 }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent-blue)' }}>{app.id}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{app.applicant}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{app.analyst}</div>
                  </td>
                  <td><span className="chip chip-cyan">{app.loanType}</span></td>
                  <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>{app.amount}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.branch}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ScoreCircle score={app.riskScore} tier={app.riskTier} />
                      <span className={`risk-badge risk-${app.riskTier}`}>{app.riskTier.toUpperCase()}</span>
                    </div>
                  </td>
                  <td>
                    {app.flags > 0
                      ? <span style={{ color: app.flags >= 5 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>🚩 {app.flags}</span>
                      : <span style={{ color: 'var(--accent-emerald)' }}>✅ Clean</span>
                    }
                  </td>
                  <td><StatusPill status={app.status} /></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{app.submittedAt}</td>
                  <td>
                    <button
                      className="topbar-btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '5px 12px', whiteSpace: 'nowrap' }}
                      onClick={() => onSelectApp(app)}
                      id={`view-${app.id}`}
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No applications match your search</div>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div style={{ marginTop: 16, display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text-muted)', padding: '10px 4px' }}>
        <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong></span>
        <span>High/Critical: <strong style={{ color: '#f87171' }}>{filtered.filter(a => ['high','critical'].includes(a.riskTier)).length}</strong></span>
        <span>Approved: <strong style={{ color: '#34d399' }}>{filtered.filter(a => a.status === 'Approved').length}</strong></span>
        <span>Pending Review: <strong style={{ color: '#fbbf24' }}>{filtered.filter(a => a.status === 'Under Review' || a.status === 'Flagged').length}</strong></span>
      </div>
    </div>
  );
}
