import { jsPDF } from 'jspdf';

export function generateFraudReport(app) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 18;
  let y = 0;

  const color = {
    critical: [220, 38, 38], high: [239, 68, 68],
    medium: [245, 158, 11], low: [16, 185, 129],
  };
  const riskColor = color[app.risk_tier || app.riskTier] || [59, 130, 246];

  // ── Header bar ─────────────────────────────────────────────────────────────
  doc.setFillColor(5, 10, 20);
  doc.rect(0, 0, W, 42, 'F');
  doc.setFillColor(...riskColor);
  doc.rect(0, 0, 5, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('TruTrace', margin, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Real-Time Document Fraud Intelligence · Canara Bank', margin, 23);

  // Risk score badge
  doc.setFillColor(...riskColor);
  doc.roundedRect(W - 60, 10, 44, 22, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(String(app.risk_score || app.riskScore || 0), W - 46, 24);
  doc.setFontSize(8);
  doc.text('RISK SCORE', W - 58, 29);

  y = 54;

  // ── Application Info ────────────────────────────────────────────────────────
  doc.setFillColor(15, 31, 61);
  doc.roundedRect(margin, y, W - margin * 2, 36, 4, 4, 'F');

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('APPLICATION ID', margin + 8, y + 9);
  doc.text('APPLICANT', margin + 60, y + 9);
  doc.text('LOAN TYPE', margin + 120, y + 9);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(app.id || 'N/A', margin + 8, y + 18);
  doc.text(app.applicant_name || app.applicant || 'N/A', margin + 60, y + 18);
  doc.text(app.loan_type || app.loanType || 'N/A', margin + 120, y + 18);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text('AMOUNT', margin + 8, y + 27);
  doc.text('BRANCH', margin + 60, y + 27);
  doc.text('STATUS', margin + 120, y + 27);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(app.amount_display || app.amount || 'N/A', margin + 8, y + 36);
  doc.text(app.branch || 'N/A', margin + 60, y + 36);
  doc.text(app.status || 'Under Review', margin + 120, y + 36);

  y += 48;

  // ── Risk Tier Banner ────────────────────────────────────────────────────────
  doc.setFillColor(...riskColor, 0.15);
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const tierLabel = (app.risk_tier || app.riskTier || 'low').toUpperCase();
  const actionMap = {
    CRITICAL: 'REJECT — Escalate to Fraud Team Immediately',
    HIGH: 'HOLD — Manual Investigation Required',
    MEDIUM: 'FLAG — Secondary Review Required',
    LOW: 'PROCEED — Low Risk Application',
  };
  doc.roundedRect(margin, y, W - margin * 2, 10, 2, 2, 'F');
  doc.text(`${tierLabel} RISK  ·  ${actionMap[tierLabel] || ''}`, margin + 4, y + 7);
  y += 18;

  // ── Score Breakdown ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 60, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('Score Breakdown', margin, y);
  y += 7;

  const layers = [
    { name: 'Document Forensics (ELA + Metadata)', score: app.forensic_score || app.forensicScore || 0 },
    { name: 'Semantic Cross-Validation', score: app.semantic_score || app.semanticScore || 0 },
    { name: 'Behavioral Risk Analysis', score: app.behavioral_score || app.behavioralScore || 0 },
    { name: 'Metadata Integrity', score: app.metadata_score || app.metadataScore || 0 },
  ];
  layers.forEach(l => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(l.name, margin, y + 5);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(String(l.score) + '/100', W - margin - 18, y + 5);

    // Bar
    doc.setFillColor(255, 255, 255, 0.05);
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y + 7, W - margin * 2 - 24, 4, 1, 1, 'F');
    const pct = Math.min(l.score / 100, 1);
    const bColor = l.score >= 75 ? [239, 68, 68] : l.score >= 50 ? [245, 158, 11] : [16, 185, 129];
    doc.setFillColor(...bColor);
    doc.roundedRect(margin, y + 7, (W - margin * 2 - 24) * pct, 4, 1, 1, 'F');
    y += 15;
  });

  y += 6;

  // ── AI Summary ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('AI Fraud Intelligence Summary', margin, y);
  y += 7;

  doc.setFillColor(15, 31, 61);
  const summary = app.ai_summary || app.aiSummary || 'No summary available.';
  const lines = doc.splitTextToSize(summary, W - margin * 2 - 12);
  doc.roundedRect(margin, y, W - margin * 2, lines.length * 5 + 10, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  lines.forEach((line, i) => {
    doc.text(line, margin + 6, y + 8 + i * 5);
  });
  y += lines.length * 5 + 18;

  // ── Flags ───────────────────────────────────────────────────────────────────
  const flags = app.flags || app.forensicFlags || [];
  if (flags.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`Detected Flags (${flags.length})`, margin, y);
    y += 7;

    flags.slice(0, 6).forEach((flag, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      const fc = color[flag.severity] || [59, 130, 246];
      doc.setFillColor(...fc);
      doc.roundedRect(margin, y, 4, 18, 1, 1, 'F');
      doc.setFillColor(15, 31, 61);
      doc.roundedRect(margin + 6, y, W - margin * 2 - 6, 18, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(flag.title || flag.title, margin + 10, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      const desc = doc.splitTextToSize(flag.description || flag.desc || '', W - margin * 2 - 20);
      doc.text(desc[0] || '', margin + 10, y + 13);
      doc.text(`Confidence: ${flag.confidence}% · Layer: ${flag.layer}`, W - margin - 50, y + 7);
      y += 22;
    });
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(5, 10, 20);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`TruTrace Fraud Intelligence Report · Generated ${new Date().toLocaleString('en-IN')} · RBI Compliant Audit Trail`, margin, 294);
    doc.text(`Page ${p} of ${pageCount}`, W - 30, 294);
  }

  doc.save(`TruTrace_Report_${app.id || 'APP'}_${Date.now()}.pdf`);
}
