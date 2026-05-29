import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem' }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
      </div>
    );
  }
  return null;
};

const monthlyData = [
  { month: 'Dec', apps: 4210, flagged: 318, fraud: 89, prevented: 42 },
  { month: 'Jan', apps: 4580, flagged: 352, fraud: 97, prevented: 51 },
  { month: 'Feb', apps: 3990, flagged: 291, fraud: 78, prevented: 38 },
  { month: 'Mar', apps: 5120, flagged: 421, fraud: 114, prevented: 62 },
  { month: 'Apr', apps: 4870, flagged: 389, fraud: 108, prevented: 58 },
  { month: 'May', apps: 5340, flagged: 447, fraud: 124, prevented: 71 },
];

const accuracyTrend = [
  { week: 'W1 Jan', accuracy: 94.2 },
  { week: 'W2 Jan', accuracy: 95.1 },
  { week: 'W3 Jan', accuracy: 94.8 },
  { week: 'W4 Jan', accuracy: 96.2 },
  { week: 'W1 Feb', accuracy: 96.7 },
  { week: 'W2 Feb', accuracy: 97.0 },
  { week: 'W3 Feb', accuracy: 96.9 },
  { week: 'W4 Feb', accuracy: 97.4 },
  { week: 'W1 Mar', accuracy: 97.6 },
  { week: 'W2 Mar', accuracy: 97.4 },
];

const branchData = [
  { branch: 'Mumbai Central', apps: 892, flagged: 78, risk: 8.7 },
  { branch: 'Delhi CP', apps: 734, flagged: 81, risk: 11.0 },
  { branch: 'Bengaluru', apps: 621, flagged: 44, risk: 7.1 },
  { branch: 'Pune', apps: 547, flagged: 31, risk: 5.7 },
  { branch: 'Jaipur', apps: 389, flagged: 52, risk: 13.4 },
  { branch: 'Chennai', apps: 412, flagged: 29, risk: 7.0 },
  { branch: 'Hyderabad', apps: 498, flagged: 38, risk: 7.6 },
];

export default function Reports() {
  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800 }}>📈 Analytics & Reports</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            Fraud detection performance metrics · Canara Bank · FY 2025–26
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="topbar-btn btn-ghost" id="export-pdf-btn">📥 Export PDF</button>
          <button className="topbar-btn btn-primary" id="generate-report-btn">🔄 Generate Report</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Apps Scanned (6mo)', value: '28,110', icon: '📁', color: '#3b82f6', sub: 'Across all branches' },
          { label: 'Fraud Caught', value: '611', icon: '🚨', color: '#ef4444', sub: '2.17% fraud rate' },
          { label: 'NPAs Prevented', value: '₹18.4 Cr', icon: '🛡️', color: '#10b981', sub: 'Estimated loan value' },
          { label: 'AI Accuracy (avg)', value: '96.8%', icon: '🎯', color: '#f59e0b', sub: 'Improving month-on-month' },
        ].map((k, i) => (
          <div key={i} className="stat-card" style={{ '--stat-color': k.color }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{k.icon}</div>
            <div className="stat-value" style={{ color: k.color }}>{k.value}</div>
            <div className="stat-label">{k.label}</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Monthly volume bar chart */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Monthly Application Volume</div>
              <div className="section-sub">Total · Flagged · Confirmed Fraud (Dec–May)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="apps" name="Total" fill="#3b82f680" radius={[4, 4, 0, 0]} />
              <Bar dataKey="flagged" name="Flagged" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fraud" name="Confirmed Fraud" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Accuracy trend */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Detection Accuracy Trend</div>
              <div className="section-sub">Weekly AI accuracy — continuously improving</div>
            </div>
            <span className="chip chip-emerald">+3.2% in 10 weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={accuracyTrend}>
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[93, 99]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#10b981" strokeWidth={2.5} fill="url(#accGrad)" dot={{ fill: '#10b981', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch risk table */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Branch-wise Risk Profile</div>
            <div className="section-sub">Fraud flag rates by branch — last 6 months</div>
          </div>
          <span className="chip chip-blue">RBI Compliant Audit Trail</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Applications</th>
              <th>Flagged</th>
              <th>Flag Rate</th>
              <th>Risk Level</th>
              <th>Fraud Rate Trend</th>
            </tr>
          </thead>
          <tbody>
            {branchData.map((b, i) => (
              <tr key={i}>
                <td><strong style={{ fontSize: '0.85rem' }}>{b.branch}</strong></td>
                <td>{b.apps.toLocaleString()}</td>
                <td style={{ color: '#fbbf24', fontWeight: 700 }}>{b.flagged}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar-track" style={{ width: 70, height: 5 }}>
                      <div className="progress-bar-fill" style={{
                        width: `${(b.risk / 15) * 100}%`,
                        background: b.risk > 10 ? '#ef4444' : b.risk > 8 ? '#f59e0b' : '#10b981',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{b.risk}%</span>
                  </div>
                </td>
                <td>
                  <span className={`risk-badge ${b.risk > 10 ? 'risk-high' : b.risk > 8 ? 'risk-medium' : 'risk-low'}`}>
                    {b.risk > 10 ? 'HIGH' : b.risk > 8 ? 'MEDIUM' : 'LOW'}
                  </span>
                </td>
                <td style={{ color: b.risk > 10 ? '#f87171' : '#34d399', fontSize: '0.82rem', fontWeight: 600 }}>
                  {b.risk > 10 ? '↑ Rising' : '→ Stable'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(59,130,246,0.06)', border: '1px solid var(--border-default)',
          borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-secondary)',
        }}>
          🛡️ <strong style={{ color: 'var(--text-primary)' }}>RBI Compliance:</strong> All flags are logged, scored, and explained — creating a full audit trail compliant with RBI underwriting guidelines. Every decision is traceable, timestamped, and exportable.
        </div>
      </div>
    </div>
  );
}
