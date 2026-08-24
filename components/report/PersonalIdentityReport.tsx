"use client";

import type { ShadowScoreReport } from "../../lib/workspace";
import type { ExternalIdentityCandidate } from "../../lib/providers/externalIdentityProvider";

function dateTime(value?: string) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "Not recorded";
}

function CandidateCard({ candidate, index }: { candidate: ExternalIdentityCandidate; index: number }) {
  const matched = candidate.resolverMatchedSignals || [];
  const conflicts = candidate.resolverConflictingSignals || [];
  const evidenceScore = matched.length ? candidate.resolutionEvidenceScore || 0 : 0;
  const verified = candidate.resolutionOutcome === "MATCH" && matched.length > 0;
  const provenance = candidate.sourceProvenance || [];
  return <article className="border border-slate-300 bg-white p-5" aria-label={`${verified ? "Verified" : "Unverified"} identity candidate ${index + 1}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wider text-cyan-800">Final ranking {candidate.resolutionRank || index + 1} · {candidate.platform}</p><h3 className="mt-1 text-xl font-semibold text-slate-950">{candidate.observedDisplayName || "Display name not observed"}</h3></div>
      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${verified ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-950"}`}>{verified ? "Verified Candidate" : "Unverified Candidate"}</span>
    </div>
    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="font-semibold text-slate-950">Platform</dt><dd className="mt-1">{candidate.platform}</dd></div>
      <div><dt className="font-semibold text-slate-950">Username or display name</dt><dd className="mt-1">{candidate.observedDisplayName || "Not returned by the source"}</dd></div>
      <div className="sm:col-span-2"><dt className="font-semibold text-slate-950">Profile URL</dt><dd className="mt-1"><a className="break-all text-cyan-800 underline underline-offset-2" href={candidate.profileUrl} rel="noreferrer" target="_blank">{candidate.profileUrl}</a></dd></div>
      <div><dt className="font-semibold text-slate-950">Discovery relevance</dt><dd className="mt-1">{candidate.candidateDiscoveryConfidence ?? 0}%</dd></div>
      <div><dt className="font-semibold text-slate-950">Resolver-backed identity evidence score</dt><dd className="mt-1">{evidenceScore.toFixed(2)}</dd></div>
      <div><dt className="font-semibold text-slate-950">Matched signals</dt><dd className="mt-1">{matched.map((item) => `${item.attribute}: ${item.observed}`).join(", ") || "No positive resolver evidence"}</dd></div>
      <div><dt className="font-semibold text-slate-950">Conflicting signals</dt><dd className="mt-1">{conflicts.map((item) => `${item.attribute}: submitted ${item.submitted}, observed ${item.observed}`).join("; ") || "No contradiction observed"}</dd></div>
      <div><dt className="font-semibold text-slate-950">Resolver outcome</dt><dd className="mt-1">{candidate.resolutionOutcome || "ABSTAIN"}</dd></div>
      <div><dt className="font-semibold text-slate-950">Verification status</dt><dd className="mt-1">{verified ? "Attribution supported" : "Attribution is not proven"}</dd></div>
      <div><dt className="font-semibold text-slate-950">Independent source count</dt><dd className="mt-1">{candidate.independentSourceFamilyCount || 0}</dd></div>
      <div><dt className="font-semibold text-slate-950">Identity confidence</dt><dd className="mt-1">{verified && candidate.identityAttributionConfidence !== null ? `${candidate.identityAttributionConfidence}%` : "Unverified"}</dd></div>
      <div className="sm:col-span-2"><dt className="font-semibold text-slate-950">Evidence sources</dt><dd className="mt-1">{provenance.length ? provenance.map((source) => <a key={`${source.url}-${source.family}`} className="mr-3 break-all text-cyan-800 underline" href={source.url} rel="noreferrer" target="_blank">{source.family}</a>) : <a className="break-all text-cyan-800 underline" href={candidate.evidenceReference} rel="noreferrer" target="_blank">{candidate.sourceProvider}</a>}</dd></div>
    </dl>
  </article>;
}

export default function PersonalIdentityReport({ report }: { report: ShadowScoreReport }) {
  const summary = report.reportSummary;
  const signals = summary?.identitySignals;
  const candidates = summary?.publicIdentityCandidates || [];
  const sources = summary?.sourceProvenance || [];
  const diagnostics = summary?.discoveryDiagnostics;
  const matches = candidates.flatMap((candidate) => candidate.resolverMatchedSignals || []);
  const conflicts = candidates.flatMap((candidate) => candidate.resolverConflictingSignals || []);
  const verifiedCount = candidates.filter((candidate) => candidate.resolutionOutcome === "MATCH" && (candidate.resolverMatchedSignals?.length || 0) > 0).length;
  const submitted: Array<[string, string]> = [
    ...(signals?.emails || []).map((value): [string, string] => ["Email", value]),
    ...(signals?.phones || []).map((value): [string, string] => ["Phone", value]),
    ...(signals?.names || []).map((value): [string, string] => ["Name", value]),
    ...(signals?.usernames || []).map((value): [string, string] => ["Username", value]),
  ];
  const actions = verifiedCount ? ["Confirm the strongest matched identifier directly with the person.", "Review each cited source before relying on the attribution.", "Resolve every contradictory identifier before making an identity decision."] : ["Ask the person to confirm a second independent identifier.", "Compare the submitted signals with a first-party profile or document.", "Treat every public profile candidate as unverified until attribution is corroborated."];
  return <article className="executive-report overflow-hidden rounded-[28px] border border-slate-300 bg-[#f4f3ef] text-slate-700 shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
    <header className="bg-[#10263d] px-6 py-9 text-white sm:px-10 lg:px-14"><p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">ShadowScore Intelligence</p><p className="mt-2 text-sm text-slate-300">Personal Identity Investigation</p><h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">{report.target || report.entity}</h1><p className="mt-4 max-w-2xl text-slate-300">Source-backed identity research prepared for review. Discovery relevance is kept separate from identity attribution.</p></header>
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <section aria-labelledby="personal-summary"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">Case record</p><h2 id="personal-summary" className="mt-3 text-3xl font-semibold text-slate-950">Person Under Review</h2><dl className="mt-6 grid border-y border-slate-300 bg-white sm:grid-cols-2 lg:grid-cols-4">{[["Investigation type", "Personal Identity Investigation"], ["Case reference", report.intakeId || report.reportId], ["Issued", dateTime(report.readyAt || report.createdAt)], ["Verification status", verifiedCount ? `${verifiedCount} supported candidate${verifiedCount === 1 ? "" : "s"}` : "Unresolved"]].map(([label, value]) => <div key={label} className="border-b border-slate-200 p-5 sm:border-r"><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-2 font-semibold text-slate-950">{value}</dd></div>)}</dl><div className="mt-6 border border-slate-300 bg-white p-5"><h3 className="font-semibold text-slate-950">Investigation objective</h3><p className="mt-2">{summary?.objective || "Determine whether public evidence can connect the submitted identity signals to the same person."}</p></div></section>
      <section className="mt-12 border-t border-slate-300 pt-10" aria-labelledby="submitted-signals"><h2 id="submitted-signals" className="text-3xl font-semibold text-slate-950">Submitted Identity Signals</h2><dl className="mt-6 grid gap-3 sm:grid-cols-2">{submitted.length ? submitted.map(([label, value]) => <div key={`${label}-${value}`} className="border border-slate-300 bg-white p-4"><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-2 break-all font-semibold text-slate-950">{value}</dd></div>) : <div className="border border-amber-300 bg-amber-50 p-4 sm:col-span-2"><dt className="font-semibold text-amber-950">Signal recovery required</dt><dd className="mt-2 text-amber-950">No submitted identity signal was available in this report record.</dd></div>}</dl></section>
      <section className="mt-12 border-t border-slate-300 pt-10" aria-labelledby="candidate-title"><h2 id="candidate-title" className="text-3xl font-semibold text-slate-950">Public Identity Candidates</h2><p className="mt-3 max-w-3xl">Every eligible discovery result is shown below. A relevant search result remains an unverified candidate unless resolver evidence supports attribution.</p><div className="mt-6 grid gap-5">{candidates.length ? candidates.map((candidate, index) => <CandidateCard key={candidate.profileUrl} candidate={candidate} index={index} />) : <p className="border border-slate-300 bg-white p-5">No eligible public identity candidate was returned.</p>}</div></section>
      <section className="mt-12 grid gap-6 border-t border-slate-300 pt-10 lg:grid-cols-2"><div className="border border-slate-300 bg-white p-5"><h2 className="text-xl font-semibold text-slate-950">Identity Matching Evidence</h2><p className="mt-3">{matches.length ? matches.map((item) => `${item.attribute}: ${item.observed}`).join(", ") : "No positive resolver evidence was recorded."}</p></div><div className="border border-slate-300 bg-white p-5"><h2 className="text-xl font-semibold text-slate-950">Contradictory Identifiers</h2><p className="mt-3">{conflicts.length ? conflicts.map((item) => `${item.attribute}: ${item.submitted} differs from ${item.observed}`).join("; ") : "No contradictory identifier was recorded."}</p></div></section>
      <section className="mt-12 border-t border-slate-300 pt-10"><h2 className="text-3xl font-semibold text-slate-950">Source Provenance</h2><dl className="mt-6 grid gap-4 sm:grid-cols-2"><div className="border border-slate-300 bg-white p-5"><dt className="font-semibold text-slate-950">Independent source count</dt><dd className="mt-2 text-2xl font-semibold">{new Set(candidates.flatMap((candidate) => candidate.sourceProvenance?.map((source) => source.family) || [])).size}</dd></div><div className="border border-slate-300 bg-white p-5"><dt className="font-semibold text-slate-950">Sources reviewed</dt><dd className="mt-2">{sources.map((source) => source.label).join(", ") || "No completed source recorded"}</dd></div></dl></section>
      <section className="mt-12 border-t border-slate-300 pt-10" aria-labelledby="discovery-execution"><h2 id="discovery-execution" className="text-3xl font-semibold text-slate-950">Discovery Execution</h2><dl className="mt-6 grid gap-4 sm:grid-cols-3"><div className="border border-slate-300 bg-white p-5"><dt className="font-semibold text-slate-950">Provider status</dt><dd className="mt-2">{diagnostics?.providerStatus || "Not recorded"}</dd></div><div className="border border-slate-300 bg-white p-5"><dt className="font-semibold text-slate-950">Searches completed</dt><dd className="mt-2 text-2xl font-semibold">{diagnostics?.searches.length || 0}</dd></div><div className="border border-slate-300 bg-white p-5"><dt className="font-semibold text-slate-950">Result reason</dt><dd className="mt-2">{diagnostics?.providerFailure || diagnostics?.budgetExhaustionReason?.replaceAll("_", " ") || "Not recorded"}</dd></div></dl></section>
      <section className="mt-12 border-t border-slate-300 pt-10"><h2 className="text-3xl font-semibold text-slate-950">Person-Specific Next Actions</h2><ol className="mt-6 divide-y divide-slate-200 border-y border-slate-300 bg-white">{actions.map((action, index) => <li key={action} className="grid grid-cols-[3rem_1fr] p-5"><span className="font-mono font-bold text-cyan-800">{String(index + 1).padStart(2, "0")}</span><span className="font-semibold text-slate-950">{action}</span></li>)}</ol></section>
    </div>
    <footer className="border-t border-slate-300 bg-white px-6 py-7 text-xs text-slate-500 sm:px-10 lg:px-14">This report reflects the public evidence available at the time of review. An unverified candidate is not an identity attribution.</footer>
  </article>;
}
