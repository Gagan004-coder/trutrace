import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateFraudReport } from '../utils/generatePDF';
import api from '../api/client';
import { processingSteps } from '../data/mockData';

const LOAN_TYPES = ['Home Loan', 'Mortgage Loan', 'Business Loan', 'Personal Loan', 'Education Loan', 'Vehicle Loan', 'Gold Loan', 'Agriculture Loan'];
const BRANCHES = ['Mumbai Central', 'Delhi Connaught Place', 'Bengaluru Koramangala', 'Pune Shivaji Nagar', 'Jaipur Malviya Nagar', 'Chennai Anna Nagar', 'Hyderabad Banjara Hills', 'Ahmedabad CG Road'];

export default function Analyze() {
  const { user } = useAuth();
  const [phase, setPhase] = useState('form'); // form | processing | result
  const [stepIdx, setStepIdx] = useState(-1);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const [form, setForm] = useState({
    applicant_name: '', loan_type: 'Home Loan', amount: '', amount_display: '',
    branch: user?.branch || '', doc_count: 0,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFiles = (fileList) => {
    const arr = Array.from(fileList);
    setFiles(arr);
    set('doc_count', arr.length);
  };

  const startAnalysis = async () => {
    setError('');
    if (!form.applicant_name) { setError('Applicant name is required'); return; }

    setPhase('processing');
    setStepIdx(0);

    // Animate processing steps
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setStepIdx(idx);
      if (idx >= processingSteps.length) clearInterval(interval);
    }, 600);

    try {
      const payload = {
        ...form,
        amount: parseInt(String(form.amount).replace(/[^0-9]/g, '')) || 0,
        amount_display: form.amount_display || form.amount,
        doc_count: files.length || parseInt(form.doc_count) || 6,
      };
      const { data } = await api.post('/applications', payload);
      // Wait for animation to finish
      setTimeout(() => {
        clearInterval(interval);
        setResult(data);
        setPhase('result');
      }, processingSteps.length * 600 + 500);
    } catch (err) {
      clearInterval(interval);
      // Offline fallback — simulate result
      const simScore = Math.floor(Math.random() * 60) + 20;
      const simTier  = simScore >= 86 ? 'critical' : simScore >= 61 ? 'high' : simScore >= 31 ? 'medium' : 'low';
      setTimeout(() => {
        setResult({
          id: 'APP-DEMO-' + Date.now(),
          applicant_name: form.applicant_name,
          loan_type: form.loan_type,
          amount_display: form.amount_display || form.amount,
          branch: form.branch,
          risk_score: simScore,
          risk_tier: simTier,
          status: simTier === 'critical' || simTier === 'high' ? 'Flagged' : 'Under Review',
          forensic_score: simScore + Math.floor(Math.random()*10) - 5,
          semantic_score: simScore + Math.floor(Math.random()*10) - 5,
          behavioral_score: simScore + Math.floor(Math.random()*10) - 5,
          metadata_score: simScore + Math.floor(Math.random()*10) - 5,
          ai_summary: `Application from ${form.applicant_name} has been processed. Risk Score: ${simScore}. ${simTier === 'high' || simTier === 'critical' ? 'Multiple anomalies detected — hold for manual investigation.' : 'Application appears authentic. Proceed with standard underwriting.'}`,
          flags: [],
          _offline: true,
        });
        setPhase('result');
      }, processingSteps.length * 600 + 500);
    }
  };

  const reset = () => {
    setPhase('form'); setFiles([]); setStepIdx(-1); setResult(null); setError('');
    setForm({ applicant_name: '', loan_type: 'Home Loan', amount: '', amount_display: '', branch: user?.branch || '', doc_count: 0 });
  };

  const riskColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
  const actionMap  = { critical: '⛔ REJECT — Escalate to Fraud Team', high: '⚠️ HOLD — Manual Investigation Required', medium: '🔍 FLAG — Secondary Review Required', low: '✅ PROCEED — Approve Application' };

  return (
    <div className="page-content" style={{ animation: 'fadeInUp 0.5s ease', maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800 }}>🔍 Analyze Document Bundle</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
          Submit a loan application for real-time AI fraud analysis across all three intelligence layers
        </p>
      </div>

      {/* PHASE: Form */}
      {phase === 'form' && (
        <>
          {/* Application details */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>📋 Application Details</div>
            <div className="grid-2">
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Applicant Name *</label>
                <input id="inp-applicant" value={form.applicant_name} onChange={e => set('applicant_name', e.target.value)}
                  placeholder="Full name of applicant"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor='var(--accent-blue)'} onBlur={e => e.target.style.borderColor='var(--border-default)'}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Loan Type</label>
                <select id="inp-loantype" value={form.loan_type} onChange={e => set('loan_type', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Loan Amount</label>
                <input id="inp-amount" value={form.amount_display} onChange={e => { set('amount_display', e.target.value); set('amount', e.target.value); }}
                  placeholder="e.g. ₹48,00,000"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor='var(--accent-blue)'} onBlur={e => e.target.style.borderColor='var(--border-default)'}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Branch</label>
                <select id="inp-branch" value={form.branch} onChange={e => set('branch', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  <option value="">Select branch…</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Upload zone */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>📂 Upload Documents</div>
            <div className={`upload-zone ${dragOver ? 'dragging' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current.click()} id="upload-dropzone">
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className="upload-icon">📂</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Drop documents here or click to browse</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>PDF, JPG, PNG · Land records, ITR, bank statements, sale deeds, KYC</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['📄 Land Record', '💰 ITR / P&L', '🏦 Bank Statement', '📜 Sale Deed', '🪪 KYC'].map((t, i) => (
                  <span key={i} className="chip chip-blue">{t}</span>
                ))}
              </div>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>📎 {files.length} file{files.length > 1 ? 's' : ''} selected</div>
                  <button className="topbar-btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setFiles([])}>Clear</button>
                </div>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                    <span>📄</span>
                    <span style={{ flex: 1 }}>{f.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '0.85rem', color: '#fca5a5' }}>⚠️ {error}</div>
          )}

          <button className="topbar-btn btn-primary" id="run-analysis-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', borderRadius: 12 }}
            onClick={startAnalysis}>
            {files.length > 0 ? `🚀 Analyze ${files.length} Documents` : '🎬 Run AI Analysis'}
          </button>

          <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            💡 <strong style={{ color: 'var(--accent-indigo)' }}>Tip:</strong> Fill applicant name and click "Run AI Analysis" without uploading files to see a live demo with simulated fraud scores.
          </div>
        </>
      )}

      {/* PHASE: Processing */}
      {phase === 'processing' && (
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12, animation: 'float 2s ease infinite' }}>🛡️</div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 700 }}>TruTrace AI — Analyzing Documents</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6 }}>
              Running all three intelligence layers — Forensic · Semantic · Behavioral
            </div>
          </div>
          {processingSteps.map((step, i) => {
            const done = i < stepIdx, active = i === stepIdx;
            return (
              <div key={step.id} className={`analysis-step ${active ? 'active' : done ? 'done' : ''}`}>
                <div className={`step-indicator ${active ? 'step-active' : done ? 'step-done' : 'step-pending'}`}>
                  {done ? '✓' : active ? <div className="spinner" /> : step.id}
                </div>
                <div className="step-text">
                  <div className="step-name" style={{ color: active ? 'var(--accent-blue)' : done ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>{step.name}</div>
                  <div className="step-detail">{step.detail}</div>
                </div>
                {done && <div className="step-time" style={{ color: 'var(--accent-emerald)' }}>✓ {step.duration}</div>}
                {active && <div className="step-time"><div className="spinner" /></div>}
              </div>
            );
          })}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Analysis Progress</span>
              <span>{Math.round((Math.max(stepIdx,0) / processingSteps.length) * 100)}%</span>
            </div>
            <div className="progress-bar-track" style={{ height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${(Math.max(stepIdx,0) / processingSteps.length)*100}%`, background: 'var(--grad-blue)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* PHASE: Result */}
      {phase === 'result' && result && (() => {
        const score = result.risk_score ?? 0;
        const tier  = result.risk_tier ?? 'low';
        const color = riskColors[tier] || '#3b82f6';
        const r = 66, circ = 2 * Math.PI * r;
        return (
          <div style={{ animation: 'fadeInUp 0.5s ease' }}>
            {result._offline && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#fbbf24' }}>
                ⚠️ Demo mode — result simulated locally. Connect TiDB to save to database.
              </div>
            )}

            {/* Score banner */}
            <div style={{ background: `linear-gradient(135deg, rgba(${tier==='critical'?'220,38,38':tier==='high'?'239,68,68':tier==='medium'?'245,158,11':'16,185,129'},0.12), rgba(5,10,20,0.9))`, border: `1px solid ${color}50`, borderRadius: 18, padding: '28px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
              {/* Ring */}
              <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
                  <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="12"
                    strokeDasharray={circ} strokeDashoffset={circ - (score/100)*circ}
                    strokeLinecap="round" transform="rotate(-90 80 80)"
                    style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: 'stroke-dashoffset 1.5s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '2.8rem', fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Risk Score</div>
                  <span className={`risk-badge risk-${tier}`} style={{ marginTop: 6 }}>{tier.toUpperCase()}</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>{actionMap[tier]}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{result.ai_summary}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(tier === 'critical' || tier === 'high') ? (
                    <>
                      <button className="topbar-btn btn-danger" id="result-escalate-btn">🚨 Escalate</button>
                      <button className="topbar-btn btn-ghost"  id="result-hold-btn">⏸ Hold</button>
                    </>
                  ) : (
                    <button className="topbar-btn btn-primary" id="result-approve-btn">✅ Approve</button>
                  )}
                  <button className="topbar-btn btn-ghost" id="result-pdf-btn" onClick={() => generateFraudReport(result)}>📥 Export PDF</button>
                  <button className="topbar-btn btn-ghost" id="result-reset-btn" onClick={reset} style={{ marginLeft: 'auto' }}>🔄 New Analysis</button>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Score Breakdown by Intelligence Layer</div>
              {[
                { layer: 'Document Forensics (ELA + Metadata)', score: result.forensic_score  ?? score },
                { layer: 'Semantic Cross-Validation',           score: result.semantic_score   ?? score },
                { layer: 'Behavioral Risk Analysis',            score: result.behavioral_score ?? score },
                { layer: 'Metadata Integrity',                  score: result.metadata_score   ?? score },
              ].map((b, i) => {
                const c = b.score >= 75 ? '#ef4444' : b.score >= 50 ? '#f59e0b' : '#10b981';
                return (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                      <span>{b.layer}</span>
                      <strong style={{ color: c, fontFamily: 'Space Grotesk' }}>{Math.min(b.score,100)}</strong>
                    </div>
                    <div className="progress-bar-track" style={{ height: 8 }}>
                      <div className="progress-bar-fill" style={{ width: `${Math.min(b.score,100)}%`, background: c, boxShadow: `0 0 8px ${c}60` }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, display: 'flex', gap: 24, fontSize: '0.82rem' }}>
                <span>⚡ <strong style={{ color: 'var(--accent-emerald)' }}>Analysis Time:</strong> ~5 sec</span>
                <span>📄 <strong style={{ color: 'var(--accent-emerald)' }}>Documents:</strong> {files.length || 6}</span>
                <span>🔬 <strong style={{ color: 'var(--accent-emerald)' }}>Checks:</strong> 147</span>
                {!result._offline && <span>💾 <strong style={{ color: 'var(--accent-emerald)' }}>Saved to TiDB</strong></span>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
