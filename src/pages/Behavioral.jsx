export default function Behavioral() {
  const signals = [
    { time: '09:06:12', event: 'PDF created on WIN-DESKTOP-7G2K', type: 'critical', device: 'WIN-DESKTOP-7G2K', doc: 'Land Record' },
    { time: '09:06:49', event: 'PDF created on WIN-DESKTOP-7G2K', type: 'critical', device: 'WIN-DESKTOP-7G2K', doc: 'Valuation Report' },
    { time: '09:08:03', event: 'KYC uploaded', type: 'ok', device: 'iPhone-A3F2', doc: 'KYC' },
    { time: '09:09:17', event: 'Land Record uploaded', type: 'alert', device: 'WIN-DESKTOP-7G2K', doc: 'Land Record' },
    { time: '09:11:44', event: 'ITR uploaded — ELA anomaly', type: 'critical', device: 'WIN-DESKTOP-7G2K', doc: 'ITR 2023' },
    { time: '09:12:58', event: 'Sale Deed uploaded', type: 'ok', device: 'iPhone-A3F2', doc: 'Sale Deed' },
    { time: '09:13:29', event: 'Valuation Report uploaded', type: 'alert', device: 'WIN-DESKTOP-7G2K', doc: 'Valuation Report' },
    { time: '09:14:01', event: 'Bank Statement uploaded', type: 'ok', device: 'iPhone-A3F2', doc: 'Bank Statement' },
    { time: '09:14:08', event: 'Application submitted', type: 'ok', device: 'iPhone-A3F2', doc: '—' },
  ];

  const patterns = [
    {
      title: 'Batch Fabrication Pattern', severity: 'critical', icon: '⏱️',
      description: 'All 6 documents uploaded in a 6-minute window (09:08–09:14 AM). Two PDFs created just 2 minutes before upload. Statistically, authentic document bundles take 3–48 hours to compile.',
      score: 94,
    },
    {
      title: 'Device Fingerprint Mismatch', severity: 'high', icon: '📱',
      description: 'Application registered from iPhone-A3F2 (applicant\'s known device). 3 of 6 documents were uploaded from WIN-DESKTOP-7G2K — an unregistered device with no prior association to this applicant.',
      score: 91,
    },
    {
      title: 'Pre-Upload Modification Burst', severity: 'high', icon: '✏️',
      description: 'ITR 2023 PDF was modified 7 times in the hour before submission. Normal ITR documents are created once and downloaded from the income tax portal — they should show zero modifications.',
      score: 88,
    },
    {
      title: 'Submission Timing Anomaly', severity: 'medium', icon: '🌙',
      description: 'Application submitted at 09:14 AM — within normal hours. However, document creation timestamps at 09:06 AM conflict with the applicant\'s stated 3-day document preparation timeline.',
      score: 67,
    },
  ];

  const sevColor = s => s === 'critical' ? '#dc2626' : s === 'high' ? '#ef4444' : s === 'medium' ? '#f59e0b' : '#10b981';

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800 }}>🧠 Behavioral Intelligence</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
          Layer 3 — Submission timing, device fingerprinting, and process anomaly detection
        </p>
      </div>

      {/* Unique Capability Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
        border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16,
        padding: '18px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: '2rem' }}>🧠</span>
        <div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, marginBottom: 4 }}>TruTrace's Most Unique Capability</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Most fraud detection tools ask <em>"Is this document real?"</em> — TruTrace also asks{' '}
            <strong style={{ color: 'var(--accent-indigo)' }}>"Does the behavior around this document look trustworthy?"</strong>
          </div>
        </div>
      </div>

      {/* Behavior Patterns */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-title">Detected Behavioral Anomalies</div>
        </div>
        <div className="grid-2">
          {patterns.map((p, i) => (
            <div key={i} style={{
              background: `${sevColor(p.severity)}0d`,
              border: `1px solid ${sevColor(p.severity)}40`,
              borderRadius: 14, padding: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: '1.5rem' }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.title}</div>
                  <span className={`risk-badge risk-${p.severity}`} style={{ marginTop: 4 }}>{p.severity.toUpperCase()}</span>
                </div>
                <div style={{
                  fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.4rem',
                  color: sevColor(p.severity),
                }}>{p.score}</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.description}</p>
              <div style={{ marginTop: 10 }}>
                <div className="progress-bar-track" style={{ height: 5 }}>
                  <div className="progress-bar-fill" style={{ width: `${p.score}%`, background: sevColor(p.severity) }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Risk contribution: {p.score}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device Map Timeline */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">📍 Document Submission Timeline by Device</div>
            <div className="section-sub">Each event plotted by time and originating device</div>
          </div>
        </div>

        {/* Device legend */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: '0.8rem' }}>
          <span><span style={{ color: '#dc2626', fontWeight: 700 }}>● WIN-DESKTOP-7G2K</span> — Unregistered device</span>
          <span><span style={{ color: '#10b981', fontWeight: 700 }}>● iPhone-A3F2</span> — Applicant's registered device</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {signals.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 14px', borderRadius: 9,
              background: s.type === 'critical' ? 'rgba(220,38,38,0.07)' :
                s.type === 'alert' ? 'rgba(245,158,11,0.07)' : 'rgba(16,185,129,0.05)',
              border: `1px solid ${s.type === 'critical' ? 'rgba(220,38,38,0.2)' :
                s.type === 'alert' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)'}`,
            }}>
              <div style={{ width: 70, fontFamily: 'Space Grotesk', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {s.time}
              </div>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: s.device === 'WIN-DESKTOP-7G2K' ? '#dc2626' : '#10b981',
                boxShadow: `0 0 6px ${s.device === 'WIN-DESKTOP-7G2K' ? '#dc2626' : '#10b981'}`,
              }} />
              <div style={{ flex: 1, fontSize: '0.82rem' }}>
                <strong style={{ color: s.type === 'critical' ? '#fca5a5' : s.type === 'alert' ? '#fbbf24' : 'var(--text-primary)' }}>
                  {s.type === 'critical' ? '🔴 ' : s.type === 'alert' ? '🟡 ' : '🟢 '}
                  {s.doc}
                </strong>
                {' — '}{s.event}
              </div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 600,
                color: s.device === 'WIN-DESKTOP-7G2K' ? '#f87171' : '#34d399',
                flexShrink: 0,
              }}>
                {s.device}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
