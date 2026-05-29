import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { generateFraudReport } from '../utils/generatePDF';
import { mockApplications } from '../data/mockData';

function SeverityIcon({ s }) {
  return s === 'critical' ? '🔴' : s === 'high' ? '🟠' : s === 'medium' ? '🟡' : '🟢';
}
function LayerChip({ layer }) {
  const map = { forensic: 'chip-blue', semantic: 'chip-purple', behavioral: 'chip-cyan', metadata: 'chip-emerald' };
  const label = { forensic: '🔬 Forensic', semantic: '⚠️ Semantic', behavioral: '🧠 Behavioral', metadata: '🗂️ Metadata' };
  return <span className={`chip ${map[layer] || 'chip-blue'}`}>{label[layer] || layer}</span>;
}
function ScoreRing({ score, tier }) {
  const colors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
  const color = colors[tier] || '#3b82f6';
  const r = 70; const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 170, height: 170 }}>
      <svg width="170" height="170" viewBox="0 0 170 170">
        <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
        <circle cx="85" cy="85" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 85 85)"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dashoffset 1.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: '2.6rem', fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Fraud Risk</div>
        <span className={`risk-badge risk-${tier}`} style={{ marginTop: 6 }}>{tier?.toUpperCase()}</span>
      </div>
    </div>
  );
}

export default function ApplicationDetail({ appId, appData, onBack }) {
  const [app, setApp] = useState(appData || null);
  const [loading, setLoading] = useState(!appData);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState(null);
  const [showActionModal, setShowActionModal] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchApp = useCallback(async () => {
    const id = appId || appData?.id;
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/applications/${id}`);
      setApp(data);
    } catch {
      // Fallback to mock data
      const mock = mockApplications.find(a => a.id === id);
      if (mock) setApp(mock);
    } finally { setLoading(false); }
  }, [appId, appData?.id]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  const handleAction = async (action) => {
    if (!app) return;
    setActionLoading(action);
    try {
      const { data } = await api.patch(`/applications/${app.id}/action`, { action, notes: actionNotes });
      setApp(prev => ({ ...prev, status: data.application.status }));
      setShowActionModal(null);
      setActionNotes('');
      showToast(`✅ Application ${action}d successfully`);
      fetchApp(); // refresh timeline
    } catch (err) {
      showToast(`❌ ${err.response?.data?.error || 'Action failed'}`, 'error');
    } finally { setActionLoading(''); }
  };

  const handleExportPDF = () => {
    if (!app) return;
    try {
      generateFraudReport(app);
      showToast('📥 PDF report downloaded successfully');
    } catch (e) {
      showToast('❌ Failed to generate PDF', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-secondary)' }}>Loading application data…</div>
        </div>
      </div>
    );
  }
  if (!app) return (
    <div className="page-content">
      <button onClick={onBack} className="topbar-btn btn-ghost" style={{ marginBottom: 16 }}>← Back</button>
      <div className="empty-state"><div className="empty-icon">❌</div><div>Application not found</div></div>
    </div>
  );

  const riskScore = app.risk_score ?? app.riskScore ?? 0;
  const riskTier = app.risk_tier ?? app.riskTier ?? 'low';
  const flags = app.flags || app.forensicFlags || [];
  const docs = app.documents || [];
  const signals = app.behavioralSignals || [];
  const timeline = app.timeline || [];
  const status = app.status || 'Under Review';

  const tabs = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'flags', label: `🚩 Flags (${flags.length})` },
    { id: 'semantic', label: '⚠️ Semantic' },
    { id: 'behavioral', label: '🧠 Behavioral' },
    { id: 'timeline', label: '🕐 Timeline' },
    { id: 'actions', label: '📝 Actions' },
  ];

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Back */}
      <button onClick={onBack} className="topbar-btn btn-ghost" style={{ marginBottom: 16 }} id="back-btn">
        ← Back to Applications
      </button>

      {/* Header card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(15,31,61,0.9), rgba(10,22,40,0.95))', border: '1px solid var(--border-default)', borderRadius: 18, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Space Grotesk', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.9rem' }}>{app.id}</span>
              <span className="chip chip-cyan">{app.loan_type || app.loanType}</span>
              <span className={`risk-badge risk-${riskTier}`}>{riskTier.toUpperCase()} RISK</span>
              <span style={{
                fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                background: status === 'Approved' ? 'rgba(16,185,129,0.15)' : status === 'Rejected' || status === 'Escalated' ? 'rgba(220,38,38,0.15)' : 'rgba(59,130,246,0.15)',
                color: status === 'Approved' ? '#34d399' : status === 'Rejected' || status === 'Escalated' ? '#fca5a5' : '#60a5fa',
                border: `1px solid ${status === 'Approved' ? 'rgba(16,185,129,0.3)' : status === 'Rejected' ? 'rgba(220,38,38,0.3)' : 'rgba(59,130,246,0.3)'}`,
              }}>{status}</span>
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>
              {app.applicant_name || app.applicant}
            </h2>
            <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <span>💰 {app.amount_display || app.amount}</span>
              <span>🏦 {app.branch}</span>
              <span>📅 {app.submitted_at ? new Date(app.submitted_at).toLocaleString('en-IN') : app.submittedAt}</span>
              <span>👤 {app.analyst_name || app.analyst}</span>
              <span>🚩 {flags.length} flags</span>
            </div>

            {/* Document chips */}
            {docs.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {docs.map((doc, i) => (
                  <div key={i} style={{
                    background: doc.status === 'flagged' ? 'rgba(239,68,68,0.08)' : doc.status === 'suspicious' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                    border: `1px solid ${doc.status === 'flagged' ? 'rgba(239,68,68,0.25)' : doc.status === 'suspicious' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                    borderRadius: 8, padding: '5px 10px', fontSize: '0.75rem',
                  }}>
                    {doc.status === 'flagged' ? '🚩' : doc.status === 'suspicious' ? '⚠️' : '✅'} {doc.name}
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{doc.confidence}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <ScoreRing score={riskScore} tier={riskTier} />
          </div>
        </div>

        {/* Action buttons — wired to real API */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          {(riskTier === 'critical' || riskTier === 'high') ? (
            <>
              <button className="topbar-btn btn-danger" id="btn-escalate"
                disabled={!!actionLoading || ['Escalated','Rejected'].includes(status)}
                onClick={() => setShowActionModal('Escalate')}>
                {actionLoading === 'Escalate' ? '⏳' : '🚨'} Escalate to Fraud Team
              </button>
              <button className="topbar-btn btn-ghost" id="btn-hold"
                disabled={!!actionLoading || status === 'On Hold'}
                onClick={() => setShowActionModal('Hold')}>
                {actionLoading === 'Hold' ? '⏳' : '⏸'} Hold Application
              </button>
              <button className="topbar-btn btn-ghost" id="btn-reject"
                disabled={!!actionLoading || status === 'Rejected'}
                onClick={() => setShowActionModal('Reject')}>
                {actionLoading === 'Reject' ? '⏳' : '❌'} Reject
              </button>
            </>
          ) : (
            <>
              <button className="topbar-btn btn-primary" id="btn-approve"
                disabled={!!actionLoading || status === 'Approved'}
                onClick={() => setShowActionModal('Approve')}>
                {actionLoading === 'Approve' ? '⏳' : '✅'} Approve Application
              </button>
              <button className="topbar-btn btn-ghost" id="btn-flag"
                disabled={!!actionLoading || status === 'Flagged'}
                onClick={() => setShowActionModal('Flag for Review')}>
                {actionLoading === 'Flag for Review' ? '⏳' : '🚩'} Flag for Review
              </button>
            </>
          )}
          <button className="topbar-btn btn-ghost" id="btn-export-pdf" style={{ marginLeft: 'auto' }} onClick={handleExportPDF}>
            📥 Export PDF Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)} id={`tab-${t.id}`}>{t.label}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <div className="section-header"><div className="section-title">Risk Score Breakdown</div></div>
            {[
              { layer: 'Document Forensics', score: app.forensic_score ?? app.forensicScore ?? 0, color: '#f43f5e' },
              { layer: 'Semantic Consistency', score: app.semantic_score ?? app.semanticScore ?? 0, color: '#ef4444' },
              { layer: 'Behavioral Signals', score: app.behavioral_score ?? app.behavioralScore ?? 0, color: '#f59e0b' },
              { layer: 'Metadata Integrity', score: app.metadata_score ?? app.metadataScore ?? 0, color: '#f43f5e' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                  <span>{item.layer}</span>
                  <strong style={{ color: item.color, fontFamily: 'Space Grotesk' }}>{item.score}</strong>
                </div>
                <div className="progress-bar-track" style={{ height: 8 }}>
                  <div className="progress-bar-fill" style={{ width: `${item.score}%`, background: item.color, boxShadow: `0 0 8px ${item.color}60` }} />
                </div>
              </div>
            ))}
            {app.ai_summary || app.aiSummary ? (
              <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#fca5a5' }}>🤖 AI Summary: </strong>
                {app.ai_summary || app.aiSummary}
              </div>
            ) : null}
          </div>
          <div className="card">
            <div className="section-header"><div className="section-title">Document Authenticity Scores</div></div>
            {docs.length > 0 ? docs.map((doc, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                    {doc.status === 'flagged' ? '🚩' : doc.status === 'suspicious' ? '⚠️' : '✅'} {doc.name}
                  </span>
                  <span style={{ fontWeight: 800, fontFamily: 'Space Grotesk', color: doc.confidence < 50 ? '#f87171' : doc.confidence < 75 ? '#fbbf24' : '#34d399' }}>{doc.confidence}%</span>
                </div>
                <div className="progress-bar-track" style={{ height: 6 }}>
                  <div className="progress-bar-fill" style={{ width: `${doc.confidence}%`, background: doc.confidence < 50 ? 'var(--grad-danger)' : doc.confidence < 75 ? 'var(--grad-warning)' : 'var(--grad-success)' }} />
                </div>
              </div>
            )) : <div className="empty-state" style={{ padding: 24 }}><div className="empty-icon">📄</div><div className="empty-text">No document detail available</div></div>}
          </div>
        </div>
      )}

      {/* Flags */}
      {activeTab === 'flags' && (
        <div>
          {flags.length > 0 ? flags.map((flag, i) => (
            <div key={i} className={`flag-item flag-${flag.severity}`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flag-icon"><SeverityIcon s={flag.severity} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <div className="flag-title">{flag.title}</div>
                  <LayerChip layer={flag.layer} />
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Confidence: <strong style={{ color: 'var(--text-primary)' }}>{flag.confidence}%</strong></span>
                </div>
                <div className="flag-desc">{flag.description}</div>
                <div className="flag-meta">
                  <span>📄 {flag.document_name || flag.doc}</span>
                  {(flag.page_num || flag.page) && <span>Page {flag.page_num || flag.page}</span>}
                </div>
              </div>
            </div>
          )) : <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-text">No flags detected for this application</div></div>}
        </div>
      )}

      {/* Semantic */}
      {activeTab === 'semantic' && (
        <div className="card">
          <div className="section-header"><div><div className="section-title">Cross-Document Entity Comparison</div><div className="section-sub">Values extracted via NLP and compared across all submitted documents</div></div></div>
          {app.semanticComparison?.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Field</th><th>Document A</th><th>Document B</th><th>Sources</th><th>Match</th></tr></thead>
              <tbody>
                {app.semanticComparison.map((row, i) => (
                  <tr key={i}>
                    <td><strong style={{ fontSize: '0.85rem' }}>{row.field}</strong></td>
                    <td style={{ color: row.match ? 'var(--accent-emerald)' : 'var(--accent-blue)', fontWeight: 600 }}>{row.docA}</td>
                    <td style={{ color: row.match ? 'var(--accent-emerald)' : '#f87171', fontWeight: 600 }}>{row.docB}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.source?.join(', ')}</td>
                    <td>{row.match ? <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>✅ Match</span> : <span style={{ color: '#f87171', fontWeight: 700 }}>❌ MISMATCH</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state"><div className="empty-icon">⚠️</div><div className="empty-text">No semantic comparison data available</div></div>}
        </div>
      )}

      {/* Behavioral */}
      {activeTab === 'behavioral' && (
        <div className="card">
          <div className="section-header"><div><div className="section-title">🧠 Behavioral Risk Signals</div></div></div>
          {signals.length > 0 ? signals.map((sig, i) => {
            const risk = sig.risk || sig.riskLevel || 'low';
            const rColor = { critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[risk] || '#3b82f6';
            return (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px', borderRadius: 10, marginBottom: 8, background: `${rColor}0d`, border: `1px solid ${rColor}35` }}>
                <div style={{ fontSize: '1.3rem' }}>{risk === 'critical' ? '🔴' : risk === 'high' ? '🟠' : risk === 'low' ? '🟢' : '🟡'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>{sig.signal}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem', marginBottom: 2 }}>{sig.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sig.detail}</div>
                </div>
              </div>
            );
          }) : <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-text">No behavioral anomalies detected</div></div>}
        </div>
      )}

      {/* Timeline */}
      {activeTab === 'timeline' && (
        <div className="card">
          <div className="section-header"><div><div className="section-title">🕐 Event Timeline</div></div></div>
          {timeline.length > 0 ? (
            <div className="timeline">
              {timeline.map((event, i) => {
                const type = event.event_type || event.type || 'info';
                return (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot" style={{ borderColor: type === 'critical' ? '#dc2626' : type === 'alert' ? '#f59e0b' : '#3b82f6', background: type === 'critical' ? 'rgba(220,38,38,0.3)' : type === 'alert' ? 'rgba(245,158,11,0.3)' : 'var(--bg-base)' }} />
                    <div className="timeline-content">
                      <div style={{ fontSize: '0.85rem', color: type === 'critical' ? '#fca5a5' : type === 'alert' ? '#fbbf24' : 'var(--text-primary)' }}>
                        {type === 'critical' ? '🚨 ' : type === 'alert' ? '⚠️ ' : ''}{event.event_text || event.event}
                      </div>
                      <div className="timeline-time">{event.event_time ? new Date(event.event_time).toLocaleString('en-IN') : event.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="empty-state"><div className="empty-icon">🕐</div><div className="empty-text">No timeline events yet</div></div>}
        </div>
      )}

      {/* Actions log */}
      {activeTab === 'actions' && (
        <div className="card">
          <div className="section-header"><div><div className="section-title">📝 Action History</div><div className="section-sub">All underwriter decisions on this application</div></div></div>
          {(app.actions || []).length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Action</th><th>By</th><th>Notes</th><th>Timestamp</th></tr></thead>
              <tbody>
                {app.actions.map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.action}</strong></td>
                    <td>{a.user_name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{a.notes || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(a.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state"><div className="empty-icon">📝</div><div className="empty-text">No actions taken yet</div></div>}
        </div>
      )}

      {/* Action confirmation modal */}
      {showActionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>
              {showActionModal === 'Escalate' ? '🚨' : showActionModal === 'Approve' ? '✅' : showActionModal === 'Reject' ? '❌' : '⏸'} Confirm: {showActionModal}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              This action will be logged in the audit trail with your credentials.
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
              <textarea value={actionNotes} onChange={e => setActionNotes(e.target.value)} rows={3} placeholder="Add notes for this action…"
                style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="topbar-btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!!actionLoading}
                onClick={() => handleAction(showActionModal)} id="confirm-action-btn">
                {actionLoading ? '⏳ Processing…' : `Confirm ${showActionModal}`}
              </button>
              <button className="topbar-btn btn-ghost" onClick={() => { setShowActionModal(null); setActionNotes(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)', background: toast.type === 'error' ? 'rgba(10,5,5,0.97)' : 'var(--bg-card)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
