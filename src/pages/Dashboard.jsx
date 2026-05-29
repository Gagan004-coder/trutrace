import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/client';
import { dashboardStats, riskDistribution, weeklyVolume, fraudTypes, recentActivity, mockApplications } from '../data/mockData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

export default function Dashboard({ onNavigate, onSelectApp }) {
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api.get('/applications/stats/dashboard')
      .then(({ data }) => {
        setStats(data);
        setRecentApps(data.recent || []);
      })
      .catch(() => {
        setOffline(true);
        setRecentApps(mockApplications.filter(a => ['critical','high'].includes(a.riskTier)));
      });
  }, []);

  const total    = stats?.total    ?? dashboardStats.totalApplications;
  const flagged  = stats?.flagged  ?? dashboardStats.flaggedToday;
  const approved = stats?.approved ?? dashboardStats.approvedToday;
  const critical = stats?.critical ?? dashboardStats.criticalAlerts;

  const riskDist = stats?.riskDist?.length
    ? stats.riskDist.map(r => ({
        name: r.risk_tier.charAt(0).toUpperCase() + r.risk_tier.slice(1),
        value: Number(r.count),
        color: { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' }[r.risk_tier] || '#3b82f6',
      }))
    : riskDistribution;

  const topRiskApps = recentApps
    .map(a => ({
      id: a.id,
      applicant: a.applicant_name || a.applicant,
      loanType: a.loan_type || a.loanType,
      amount: a.amount_display || a.amount,
      branch: a.branch,
      riskScore: a.risk_score ?? a.riskScore ?? 0,
      riskTier: a.risk_tier || a.riskTier || 'low',
      flags: a.flag_count ?? a.flags ?? 0,
      status: a.status,
      _raw: a,
    }))
    .filter(a => ['critical', 'high'].includes(a.riskTier))
    .slice(0, 3);

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 50%, rgba(6,182,212,0.08) 100%)',
        border: '1px solid var(--border-default)', borderRadius: 20,
        padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="live-dot" />
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Live — Monitoring Active
              </span>
              {offline && <span style={{ fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '2px 8px' }}>⚠️ Demo Mode</span>}
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.1 }}>
              Underwriting Intelligence<br /><span className="gradient-text">Command Center</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
              Real-time AI fraud detection across all active loan applications · Canara Bank
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="topbar-btn btn-primary" onClick={() => onNavigate('analyze')} id="hero-analyze-btn">🔍 Analyze New Application</button>
            <button className="topbar-btn btn-ghost" onClick={() => onNavigate('reports')} id="hero-reports-btn">📈 View Reports</button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Applications Today',  value: total,    icon: '📁', grad: 'var(--grad-blue)',    sub: 'Scanned by AI' },
          { label: 'Flagged for Review',  value: flagged,  icon: '🚩', grad: 'var(--grad-warning)', sub: `${total ? Math.round((flagged/total)*100) : 0}% flag rate` },
          { label: 'Approved Today',      value: approved, icon: '✅', grad: 'var(--grad-success)',  sub: 'Cleared by TruTrace' },
          { label: 'Critical Alerts',     value: critical, icon: '🚨', grad: 'var(--grad-danger)',   sub: 'Needs immediate action' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--stat-color': s.grad, animationDelay: `${i*0.08}s` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ background: s.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Weekly Application Volume</div>
              <div className="section-sub">Approved vs Flagged — Last 7 days</div>
            </div>
            <span className="chip chip-blue">7-Day</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyVolume} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="approved" name="Approved" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="flagged"  name="Flagged"  fill="#f43f5e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Risk Score Distribution</div>
              <div className="section-sub">Applications by risk tier</div>
            </div>
            <span className="chip chip-purple">Live</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={riskDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {riskDist.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 20 }}>

        {/* Fraud types */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div><div className="section-title">Fraud Breakdown</div><div className="section-sub">By detection layer</div></div>
          </div>
          {fraudTypes.map((ft, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span>{ft.icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, flex: 1 }}>{ft.type}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{ft.count}</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${ft.pct}%`, background: 'var(--grad-blue)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Critical Alerts */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div><div className="section-title">🚨 Critical Alerts</div><div className="section-sub">Requires immediate action</div></div>
            <button className="topbar-btn btn-ghost" onClick={() => onNavigate('applications')} style={{ fontSize: '0.75rem', padding: '5px 12px' }} id="view-all-btn">
              View All
            </button>
          </div>
          {(topRiskApps.length ? topRiskApps : mockApplications.filter(a => ['critical','high'].includes(a.riskTier))).map((app, i) => {
            const tier = app.riskTier || app.risk_tier || 'high';
            const score = app.riskScore ?? app.risk_score ?? 0;
            return (
              <div key={i}
                onClick={() => { onSelectApp(app); onNavigate('applications'); }}
                style={{ background: tier === 'critical' ? 'rgba(220,38,38,0.07)' : 'rgba(239,68,68,0.05)', border: `1px solid ${tier === 'critical' ? 'rgba(220,38,38,0.3)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 12, padding: '14px', marginBottom: 10, cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                id={`critical-${app.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{app.applicant || app.applicant_name}</div>
                  <span className={`risk-badge risk-${tier}`}>Score: {score}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {app.id} · {app.loanType || app.loan_type} · {app.amount || app.amount_display}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {(app.flags ?? app.flag_count ?? 0)} flags · {app.branch}
                </div>
              </div>
            );
          })}
          {topRiskApps.length === 0 && !offline && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
              ✅ No critical alerts today
            </div>
          )}
        </div>

        {/* Live Activity */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div><div className="section-title">Live Activity</div><div className="section-sub">Real-time events</div></div>
            <span className="live-dot" />
          </div>
          {recentActivity.map((item, i) => (
            <div key={i} className="activity-item" style={{ animationDelay: `${i*0.06}s` }}>
              <div className="activity-avatar" style={{ background: `${item.color}15` }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>{item.text}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics strip */}
      <div style={{ marginTop: 20, background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Detection Accuracy', value: '97.4%', icon: '🎯' },
          { label: 'False Positive Rate', value: '2.1%',  icon: '✅' },
          { label: 'Avg Confidence',     value: '91.3',   icon: '📊' },
          { label: 'Docs Scanned Today', value: total * 6, icon: '📄' },
          { label: 'NPA Risk Prevented', value: '₹3.2 Cr', icon: '🛡️' },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>{m.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
