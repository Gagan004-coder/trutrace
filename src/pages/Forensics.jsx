export default function Forensics() {
  const elaRegions = [
    { x: '12%', y: '52%', w: '45%', h: '7%', color: '#dc2626', label: 'HIGH ELA — Net Income Field Edited', confidence: 96 },
    { x: '60%', y: '34%', w: '28%', h: '5%', color: '#f59e0b', label: 'MEDIUM ELA — Date Region', confidence: 71 },
    { x: '5%', y: '78%', w: '20%', h: '4%', color: '#f59e0b', label: 'MEDIUM ELA — Signature Block', confidence: 64 },
  ];

  const metaFields = [
    { field: 'Document Creator', docA: 'Microsoft Word 2021', docB: 'Adobe Acrobat DC', flag: false },
    { field: 'Creation Date', docA: '2026-05-26 09:06:12', docB: '2026-05-25 14:22:00', flag: false },
    { field: 'Last Modified', docA: '2026-05-26 09:06:49', docB: '2026-05-25 14:22:00', flag: false },
    { field: 'Device / Author', docA: 'WIN-DESKTOP-7G2K', docB: 'iPhone-A3F2 (Registered)', flag: true },
    { field: 'Modification Count', docA: '7 modifications', docB: '1 (original)', flag: true },
    { field: 'PDF Version', docA: '1.4 (older format)', docB: '1.7', flag: false },
    { field: 'Embedded Fonts', docA: 'Arial, Calibri, Times (3 families)', docB: 'Noto Sans (1 family)', flag: true },
  ];

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800 }}>🔬 Forensics Lab</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
          Layer 1 — Error Level Analysis, Metadata Forensics, Font & Layout Inspection
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* ELA Heatmap */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Error Level Analysis (ELA)</div>
              <div className="section-sub">ITR 2023 — Page 3 · Pixel-level tampering heatmap</div>
            </div>
            <span className="chip chip-blue">OpenCV</span>
          </div>

          {/* Simulated document with ELA overlays */}
          <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.03)' }}>
            {/* Scan line animation */}
            <div className="scan-overlay" />

            {/* Fake document lines */}
            <div style={{ padding: '20px', minHeight: 280 }}>
              {[...Array(14)].map((_, i) => (
                <div key={i} style={{
                  height: i === 13 ? 16 : 10, borderRadius: 3, marginBottom: 8,
                  background: i === 13
                    ? 'rgba(220,38,38,0.3)'
                    : `rgba(255,255,255,${0.04 + (i % 3) * 0.01})`,
                  width: i % 4 === 0 ? '60%' : i % 3 === 0 ? '85%' : '100%',
                }} />
              ))}
            </div>

            {/* ELA Regions */}
            {elaRegions.map((r, i) => (
              <div key={i} style={{
                position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h,
                border: `2px solid ${r.color}`,
                background: `${r.color}22`,
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                title={`${r.label} (${r.confidence}%)`}
              >
                <div style={{
                  position: 'absolute', top: -24, left: 0,
                  background: r.color, color: 'white',
                  fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
                  fontWeight: 700,
                }}>
                  {r.confidence}% — {r.label.split('—')[0].trim()}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 16, fontSize: '0.78rem' }}>
            <span><span style={{ color: '#dc2626', fontWeight: 700 }}>●</span> Critical Tampering</span>
            <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>●</span> Suspected Edit</span>
            <span><span style={{ color: '#10b981', fontWeight: 700 }}>●</span> Clean Region</span>
          </div>
        </div>

        {/* Metadata Forensics */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Metadata Forensics</div>
              <div className="section-sub">Land Record vs KYC — device & author comparison</div>
            </div>
            <span className="chip chip-purple">PyMuPDF</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Land Record (Suspicious)</th>
                <th>KYC (Trusted)</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              {metaFields.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.78rem', fontWeight: 600 }}>{m.field}</td>
                  <td style={{ fontSize: '0.78rem', color: m.flag ? '#f87171' : 'var(--text-secondary)' }}>{m.docA}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>{m.docB}</td>
                  <td>{m.flag ? '🚩' : '✅'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Font & Layout Analysis */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Font & Layout Consistency Analysis</div>
            <div className="section-sub">Detecting copy-paste manipulation via font family & spacing irregularities</div>
          </div>
          <span className="chip chip-cyan">Layer 1</span>
        </div>
        <div className="grid-3">
          {[
            { region: 'Header Section (Page 1)', fonts: ['Noto Sans 11pt'], spacing: 'Consistent', status: 'clean', note: 'Original template font' },
            { region: 'Body Text (Pages 1–2)', fonts: ['Noto Sans 11pt'], spacing: 'Consistent', status: 'clean', note: 'Matches header' },
            { region: 'Net Income Row (Page 3)', fonts: ['Arial 11pt', 'Calibri 10.5pt'], spacing: '⚠ 0.3px irregular', status: 'flagged', note: 'Two fonts detected — copy-paste overlay' },
          ].map((f, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 12,
              background: f.status === 'flagged' ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.06)',
              border: `1px solid ${f.status === 'flagged' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span>{f.status === 'flagged' ? '🚩' : '✅'}</span>
                <strong style={{ fontSize: '0.82rem' }}>{f.region}</strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div><strong>Fonts:</strong> {f.fonts.join(', ')}</div>
                <div><strong>Spacing:</strong> {f.spacing}</div>
                <div style={{ marginTop: 6, color: f.status === 'flagged' ? '#f87171' : 'var(--accent-emerald)' }}>{f.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
