"use client";

import Image from "next/image";
import type { ShadowScoreReport } from "../../lib/workspace";
import { executiveRecommendation, groupExecutiveEvidence, recommendedActions, reportFindings } from "../../lib/executiveReport";

function dateTime(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
}

function statusLabel(value?: string) {
  return value ? value.replaceAll("_", " ") : "Complete";
}

export default function ExecutiveIntelligenceReport({ report }: { report: ShadowScoreReport }) {
  const recommendation = executiveRecommendation(report);
  const findings = reportFindings(report);
  const evidenceGroups = groupExecutiveEvidence(report);
  const allFindings = [...findings.negative, ...findings.warnings, ...findings.positive];
  const scorecard = report.reportSummary?.scorecard?.scores || [];
  const sources = report.reportSummary?.sourceProvenance || [];
  const timeline = report.reportSummary?.investigationTimeline || [];
  const actions = recommendedActions(report);
  const target = report.reportSummary?.businessNarrative?.businessName || report.target || report.entity;
  const trustScore = report.riskScore === undefined ? "N/A" : `${Math.max(0, 100 - report.riskScore)}`;
  const confidence = report.confidenceScore === undefined ? "N/A" : `${report.confidenceScore}%`;
  const verdictTone = /do not|stop|high risk/i.test(recommendation.label) ? "report-red" : /verify|review|caution/i.test(recommendation.label) ? "report-amber" : "report-green";

  const printReport = () => window.print();

  return <article className="executive-report mt-8 text-slate-800">
    <div className="report-toolbar mb-4 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-white">
      <div><p className="text-sm font-bold">Executive PDF Report</p><p className="text-xs text-slate-400">Print or save a complete, shareable copy.</p></div>
      <button type="button" onClick={printReport} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300">Download PDF</button>
    </div>

    <section className="report-page report-cover">
      <div className="report-brand"><Image src="/brand/shadowscore-infinity-mono.svg" alt="" width={54} height={54} priority /><span>SHADOWSCORE</span></div>
      <div className="report-cover-title"><p>Trust Intelligence</p><h1>Executive<br />Investigation Report</h1><div className="report-rule" /><h2>{target}</h2></div>
      <dl className="report-cover-meta">
        <div><dt>Investigation date</dt><dd>{dateTime(report.readyAt || report.createdAt)}</dd></div>
        <div><dt>Report ID</dt><dd>{report.reportId}</dd></div>
        <div><dt>Report type</dt><dd>{report.scanMode ? `${report.scanMode} due diligence` : "Trust intelligence"}</dd></div>
        <div><dt>Classification</dt><dd>Customer confidential</dd></div>
      </dl>
      <p className="report-cover-footer">Independent evidence summary prepared by ShadowScore</p>
    </section>

    <section className="report-page">
      <header className="report-section-header"><span>01</span><div><p>Decision brief</p><h2>Executive Summary</h2></div></header>
      <div className={`report-verdict ${verdictTone}`}>
        <div><p>Trust Verdict</p><strong>{recommendation.label}</strong></div>
        <div><p>Confidence Score</p><strong>{confidence}</strong></div>
        <div><p>Trust Score</p><strong>{trustScore}<small>/100</small></strong></div>
      </div>
      <div className="report-summary-copy"><h3>Executive Recommendation</h3><p>{recommendation.explanation}</p><p>The assessment is based on {sources.length || "the available"} evidence sources and {allFindings.length || "the recorded"} material findings. Review the actions below before making a final business or compliance decision.</p></div>
      <div className="report-callout"><span>Recommended action</span><strong>{actions[0] || recommendation.label}</strong></div>
      <h3 className="report-subhead">Key Findings</h3>
      <ul className="report-findings">{allFindings.slice(0, 6).map((item) => <li key={item.id}><span className={findings.positive.includes(item) ? "positive" : "attention"}>{findings.positive.includes(item) ? "✓" : "!"}</span><div><strong>{item.title}</strong><p>{item.statement}</p></div></li>)}</ul>
      {!allFindings.length && <p className="report-empty">No material findings were recorded.</p>}
      <footer className="report-footer"><span>ShadowScore Executive Report</span><span>{report.reportId}</span></footer>
    </section>

    <section className="report-page">
      <header className="report-section-header"><span>02</span><div><p>Decision factors</p><h2>Risk Assessment</h2></div></header>
      <h3 className="report-subhead">Risk Score Card</h3>
      <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Category</th><th>Status</th><th>Confidence</th><th>Business impact</th></tr></thead><tbody>{scorecard.map((item) => <tr key={item.dimension}><td><strong>{item.dimension}</strong></td><td>{statusLabel(item.level)}</td><td>{item.confidence}</td><td>{item.recommendedImprovements[0] || item.evidenceGaps[0] || item.supportingEvidence[0] || "No material impact recorded."}</td></tr>)}</tbody></table></div>
      {!scorecard.length && <p className="report-empty">No category scorecard was recorded for this investigation.</p>}
      <h3 className="report-subhead">Recommended Actions</h3>
      <ol className="report-actions">{actions.map((action, index) => <li key={action}><span>{String(index + 1).padStart(2, "0")}</span><p>{action}</p></li>)}</ol>
      <footer className="report-footer"><span>ShadowScore Executive Report</span><span>{report.reportId}</span></footer>
    </section>

    <section className="report-page">
      <header className="report-section-header"><span>03</span><div><p>Provider-level review</p><h2>Evidence Summary</h2></div></header>
      <div className="report-table-wrap"><table className="report-table report-evidence-table"><thead><tr><th>Provider</th><th>Status</th><th>Evidence Quality</th><th>Confidence</th><th>Business Meaning</th></tr></thead><tbody>{sources.map((source) => { const items = evidenceGroups.flatMap((group) => group.items).filter((item) => item.source === source.label); return <tr key={`${source.label}-${source.completedAt}`}><td><strong>{source.label}</strong></td><td>Complete</td><td>{items.length > 1 ? "Corroborating" : items.length ? "Direct" : "Contextual"}</td><td>{confidence}</td><td>{items.slice(0, 2).map((item) => item.label).join(", ") || "Contributed to the investigation assessment."}</td></tr>; })}</tbody></table></div>
      {!sources.length && <p className="report-empty">No external provider sources were recorded.</p>}
      <h3 className="report-subhead">Investigation Timeline</h3>
      <ol className="report-timeline">{timeline.map((item, index) => <li key={item.id}><span>{index + 1}</span><div><strong>{item.label}</strong><p>{statusLabel(item.status)} · {dateTime(item.observedAt)}</p></div></li>)}</ol>
      {!timeline.length && <p className="report-empty">The investigation was completed on {dateTime(report.readyAt || report.createdAt)}.</p>}
      <footer className="report-footer"><span>ShadowScore Executive Report</span><span>{report.reportId}</span></footer>
    </section>

    <section className="report-page">
      <header className="report-section-header"><span>04</span><div><p>Evidence provenance</p><h2>Sources</h2></div></header>
      <div className="report-source-list">{sources.map((source) => { const items = evidenceGroups.flatMap((group) => group.items).filter((item) => item.source === source.label); return <article key={`${source.label}-${source.completedAt}`}><div><h3>{source.label}</h3><span>Complete</span></div><p>{items.map((item) => item.label).join(", ") || "Evidence contributed to the overall assessment."}</p><small>Collected {dateTime(source.completedAt)}</small></article>; })}</div>
      {!sources.length && <p className="report-empty">No external provider sources were recorded.</p>}
      <footer className="report-footer"><span>ShadowScore Executive Report</span><span>{report.reportId}</span></footer>
    </section>

    <section className="report-page report-appendix">
      <header className="report-section-header"><span>A</span><div><p>Technical reviewer material</p><h2>Source Appendix</h2></div></header>
      <p className="report-intro">Detailed evidence is grouped by technical domain. Values reflect the evidence retained with this report.</p>
      {evidenceGroups.map((group) => <section key={group.category} className="report-evidence-group"><h3>{group.category}</h3>{group.items.map((item) => <dl key={item.id}><div><dt>Evidence</dt><dd>{item.label}</dd></div><div><dt>Observed value</dt><dd>{item.value || "Recorded"}</dd></div><div><dt>Provider</dt><dd>{item.source}</dd></div><div><dt>Observed</dt><dd>{dateTime(item.observedAt)}</dd></div></dl>)}</section>)}
      {!evidenceGroups.length && <p className="report-empty">No detailed technical evidence was retained in the customer report.</p>}
      <div className="report-document-control"><h3>Document control</h3><dl><div><dt>Report ID</dt><dd>{report.reportId}</dd></div><div><dt>Engine version</dt><dd>{report.engineVersion || "Not recorded"}</dd></div><div><dt>Generated</dt><dd>{dateTime(report.readyAt || report.createdAt)}</dd></div></dl></div>
      <footer className="report-footer"><span>ShadowScore Executive Report</span><span>{report.reportId}</span></footer>
    </section>
  </article>;
}
