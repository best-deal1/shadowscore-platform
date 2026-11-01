"use client";

import type { ShadowScoreReport } from "../../lib/workspace";
import type { ExternalIdentityCandidate } from "../../lib/providers/externalIdentityProvider";
import type { InvestigationCompletionStatus } from "../../lib/reportCoverage";
import { isCorroboratedIdentityCandidate, requestedIdentityResults, summarizeIdentityDiscovery, type IdentityDiscoveryExecution } from "../../lib/personalIdentity";
import { requestedAttributeLabel } from "../../lib/identityRequest";
import { summarizeSourceReportedFacts } from "../../lib/identityPublicFacts";

const COMPLETION_PRESENTATION: Record<InvestigationCompletionStatus, { label: string; detail: string; tone: string }> = {
  COMPLETED_WITH_EVIDENCE: { label: "Completed with evidence", detail: "The investigation returned substantive identity evidence for review.", tone: "border-emerald-300 bg-emerald-50 text-emerald-950" },
  COMPLETED_WITH_UNRESOLVED_EVIDENCE: { label: "Unresolved, no match", detail: "The investigation completed, but the available evidence did not support an identity match.", tone: "border-amber-300 bg-amber-50 text-amber-950" },
  PROVIDER_UNAVAILABLE: { label: "Provider unavailable", detail: "A required identity source was unavailable. Coverage is incomplete.", tone: "border-rose-300 bg-rose-50 text-rose-950" },
  COVERAGE_GAP: { label: "Coverage gap", detail: "The available sources do not cover all checks required for this investigation.", tone: "border-amber-300 bg-amber-50 text-amber-950" },
  UNSUPPORTED_JURISDICTION: { label: "Unsupported coverage", detail: "The required source does not support this investigation's jurisdiction.", tone: "border-amber-300 bg-amber-50 text-amber-950" },
  NO_EVIDENCE_ABSTAIN: { label: "No evidence, result withheld", detail: "No substantive identity evidence was returned, so ShadowScore does not make an identity finding.", tone: "border-slate-300 bg-slate-50 text-slate-950" },
};

export function personalCompletionPresentation(status?: InvestigationCompletionStatus, hasCandidates = false) {
  if (status === "NO_EVIDENCE_ABSTAIN" && hasCandidates) return {
    label: "Public candidates returned",
    detail: "Public source observations are available for review. Each candidate shows its attribution status and supporting sources.",
    tone: "border-amber-300 bg-amber-50 text-amber-950",
  };
  return status ? COMPLETION_PRESENTATION[status] : { label: "Status not recorded", detail: "This legacy report does not include a canonical completion status.", tone: "border-slate-300 bg-slate-50 text-slate-950" };
}

const DISCOVERY_REASONS: Record<IdentityDiscoveryExecution["stopReason"], string> = {
  closure_reached: "Available search paths completed",
  max_searches: "Search limit reached",
  max_identifiers: "Identifier limit reached",
  no_admissible_leads: "Results did not contain an eligible identity lead",
  no_eligible_candidates: "No eligible public identity candidate",
  no_search_executed: "No public search completed",
  timeout: "Search time limit reached. Coverage is incomplete",
  rate_limited: "The search provider limited further requests. Coverage is incomplete",
  provider_error: "Further public searches failed. Coverage is incomplete",
  provider_unavailable: "Public identity search was unavailable",
};

function dateTime(value?: string) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "Not recorded";
}

function SourceReportedProfile({ candidate }: { candidate: ExternalIdentityCandidate }) {
  const facts = summarizeSourceReportedFacts(candidate.sourceReportedFacts || [])
    .filter((fact) => !candidate.sourceNameDisagreement || fact.attribute === "name");
  if (!facts.length && !candidate.sourceSubjectAmbiguous) return null;
  return <div className="mt-5 min-w-0 border border-slate-300 bg-white p-4 sm:p-5">
    <h3 className="text-lg font-semibold text-slate-950">Source-reported profile</h3>
    {candidate.sourceNameDisagreement || candidate.sourceSubjectAmbiguous
      ? <p className="mt-2 font-semibold text-amber-900">{candidate.sourceNameDisagreement ? "Sources report different names. The observations remain separate for review." : "The source includes multiple people. Profile details could not be attributed."}</p>
      : <p className="mt-2 text-sm text-slate-600">Details reported in public search excerpts. Sources may describe a past role or organization.</p>}
    <dl className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">{facts.map((fact) => <div key={`${fact.attribute}-${fact.value}`} className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Reported {fact.attribute}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-950" dir="auto">{fact.value}</dd>
      <dd className="mt-1 text-xs text-slate-600">{fact.sourceFamilyCount} source {fact.sourceFamilyCount === 1 ? "family" : "families"}</dd>
      <dd className="mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-2 text-sm">{fact.sources.map((source) => <a key={source.url} href={source.url} rel="noreferrer" target="_blank" className="break-all text-cyan-800 underline underline-offset-2" aria-label={`${source.family} source for ${fact.value}`}>{source.family}</a>)}</dd>
    </div>)}</dl>
  </div>;
}

function CandidateCard({ candidate, index }: { candidate: ExternalIdentityCandidate; index: number }) {
  const matched = candidate.resolverMatchedSignals || [];
  const conflicts = candidate.resolverConflictingSignals || [];
  const evidenceScore = matched.length ? candidate.resolutionEvidenceScore || 0 : 0;
  const verified = isCorroboratedIdentityCandidate(candidate);
  const provenance = candidate.sourceProvenance || [];
  const observations = [...new Map((candidate.supportingEvidence?.length ? candidate.supportingEvidence : [{
    snippet: candidate.evidenceSnippet, sourceUrl: candidate.evidenceReference, url: candidate.evidenceReference,
  }]).filter((entry) => entry.snippet).map((entry) => [`${entry.sourceUrl || entry.url}|${entry.snippet}`, entry])).values()];
  return <article className="min-w-0 break-words border border-slate-300 bg-white p-4 sm:p-5" aria-label={`${verified ? "Corroborated" : "Unverified"} identity candidate ${index + 1}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wider text-cyan-800">Final ranking {candidate.resolutionRank || index + 1} · {candidate.platform}</p><h3 className="mt-1 text-xl font-semibold text-slate-950">{candidate.observedDisplayName || "Display name not observed"}</h3></div>
      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${verified ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-950"}`}>{verified ? "Corroborated Candidate" : "Unverified Candidate"}</span>
    </div>
    <p className="mt-4 text-sm leading-6 text-slate-700">{candidate.matchBasis}</p>
    {candidate.emailMatchMethod === "explicit_at_dot" && <p className="mt-2 text-sm text-slate-600">The source writes the email with an explicit (at) or [at] marker. ShadowScore normalized that notation for matching.</p>}
    <dl className="mt-5 grid min-w-0 grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
      {(candidate.observedPhoneNumbers?.length || 0) > 0 && <div><dt className="font-semibold text-slate-950">Observed phone numbers</dt><dd className="mt-1">{candidate.observedPhoneNumbers?.join(", ")}</dd></div>}
      {(candidate.observedEmails?.length || 0) > 0 && <div><dt className="font-semibold text-slate-950">Observed email addresses</dt><dd className="mt-1 break-all">{candidate.observedEmails?.join(", ")}</dd></div>}
      {(candidate.observedOrganizations?.length || 0) > 0 && <div><dt className="font-semibold text-slate-950">Matched organization context</dt><dd className="mt-1">{candidate.observedOrganizations?.join(", ")}</dd></div>}
      {(candidate.observedRoles?.length || 0) > 0 && <div><dt className="font-semibold text-slate-950">Matched role context</dt><dd className="mt-1">{candidate.observedRoles?.join(", ")}</dd></div>}
      <div className="sm:col-span-2"><dt className="font-semibold text-slate-950">Evidence sources</dt><dd className="mt-1">{provenance.length ? provenance.map((source) => <a key={`${source.url}-${source.family}`} className="mr-3 break-all text-cyan-800 underline" href={source.url} rel="noreferrer" target="_blank">{source.family}</a>) : <a className="break-all text-cyan-800 underline" href={candidate.evidenceReference} rel="noreferrer" target="_blank">{candidate.sourceProvider}</a>}</dd></div>
    </dl>
    {observations.length > 0 && <div className="mt-6 border-t border-slate-200 pt-4">
      <h4 className="py-2 font-semibold text-slate-950">Source observations ({observations.length})</h4>
      <p className="mt-2 text-sm text-slate-600">Search excerpts show the public result text. Review the linked page for current context.</p>
      <ul className="mt-4 grid gap-4">{observations.map((entry, observationIndex) => <li key={`${entry.sourceUrl || entry.url}-${observationIndex}`} className="min-w-0 border-l-2 border-cyan-700 pl-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Search excerpt</p>
        <blockquote className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-950" dir="auto">{entry.snippet}</blockquote>
        <a className="mt-2 inline-block break-all text-sm font-semibold text-cyan-800 underline underline-offset-2" href={entry.sourceUrl || entry.url} rel="noreferrer" target="_blank">{entry.sourceUrl || entry.url}</a>
      </li>)}</ul>
    </div>}
    <div className="mt-4 border-t border-slate-200 pt-4">
      <h4 className="py-2 font-semibold text-slate-950">Discovery path</h4>
      <ol className="mt-3 grid gap-2 text-sm">{(candidate.discoveryPath || []).map((step, stepIndex) => <li key={`${stepIndex}-${step}`} className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-2"><span className="font-semibold text-cyan-800">{stepIndex + 1}.</span><span className="break-all" dir="auto">{step}</span></li>)}</ol>
    </div>
  </article>;
}

function DiagnosticValue({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return <div className={className}><dt className="text-xs font-bold uppercase tracking-wide text-violet-700">{label}</dt><dd className="mt-1 break-words text-slate-950">{value}</dd></div>;
}

function DiscoveryDiagnostics({ diagnostics }: { diagnostics: NonNullable<NonNullable<ShadowScoreReport["reportSummary"]>["discoveryDiagnostics"]> }) {
  return <section className="mt-12 border border-violet-300 bg-violet-50 p-5 sm:p-7" aria-labelledby="personal-discovery-diagnostics">
    <h2 id="personal-discovery-diagnostics" className="text-3xl font-semibold text-violet-950">Discovery Diagnostics</h2>
    <p className="mt-3 max-w-3xl text-violet-900">Internal discovery trace for administrator review. Budget outcome: {diagnostics.budgetExhaustionReason.replaceAll("_", " ")}.</p>
    <div className="mt-6 grid gap-4">
      {diagnostics.searches.length ? diagnostics.searches.map((search, searchIndex) => <article key={`${search.query}-${searchIndex}`} className="border border-violet-200 bg-white p-4 sm:p-5" aria-labelledby={`identity-search-${searchIndex}`}>
        <h3 id={`identity-search-${searchIndex}`} className="text-lg font-semibold text-violet-950">Search {searchIndex + 1}</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DiagnosticValue label="Query" value={<code className="text-xs">{search.query}</code>} />
          <DiagnosticValue label="Pivot" value={search.pivot} />
          <DiagnosticValue label="Hop" value={search.hop} />
          <DiagnosticValue label="Scheduling generation" value={search.schedulingGeneration} />
          <DiagnosticValue label="Query pass" value={search.queryPass} />
          <DiagnosticValue label="Result count" value={search.resultCount} />
          <DiagnosticValue label="Remaining budget" value={search.remainingBudget} />
        </dl>
        <div className="mt-5 grid gap-3">
          {search.results.length ? search.results.map((result, resultIndex) => <details key={`${result.url}-${resultIndex}`} className="border border-slate-300 bg-slate-50 p-4">
            <summary className="cursor-pointer font-semibold text-slate-950">Result {resultIndex + 1}: {result.title || "Untitled result"}</summary>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DiagnosticValue label="Raw result URL" value={<a className="break-all text-cyan-800 underline underline-offset-2" href={result.url} rel="noreferrer" target="_blank">{result.url}</a>} />
              <DiagnosticValue label="Title" value={result.title || "Not recorded"} />
              <DiagnosticValue className="sm:col-span-2" label="Description" value={result.description || "Not recorded"} />
              <DiagnosticValue label="Admission decision" value={result.admissionDecision} />
              <DiagnosticValue label="Admission score" value={result.admissionScore} />
              <DiagnosticValue className="sm:col-span-2" label="Admission reason" value={result.admissionReason} />
              <DiagnosticValue label="Discovery admission" value={`${result.discoveryAdmissionDecision} (${result.discoveryAdmissionScore})`} />
              <DiagnosticValue label="Evidence admission" value={`${result.evidenceAdmissionDecision} (${result.evidenceAdmissionScore})`} />
              <DiagnosticValue className="sm:col-span-2" label="Discovery admission reason" value={result.discoveryAdmissionReason} />
              <DiagnosticValue className="sm:col-span-2" label="Evidence admission reason" value={result.evidenceAdmissionReason} />
            </dl>
            <h4 className="mt-5 font-semibold text-slate-950">Identifier evaluations</h4>
            {result.identifierEvaluations.length ? <ul className="mt-2 grid gap-2">{result.identifierEvaluations.map((evaluation, evaluationIndex) => <li key={`${evaluation.identifier}-${evaluationIndex}`} className="border border-slate-200 bg-white p-3 text-sm"><strong className="break-all text-slate-950">{evaluation.identifier}</strong><span className="ml-2">{evaluation.type}, {evaluation.derivation}, {evaluation.decision}</span><p className="mt-1"><span className="font-semibold">Exact reason:</span> {evaluation.reason}</p></li>)}</ul> : <p className="mt-2 text-sm">No identifier evaluation was recorded.</p>}
          </details>) : <p className="border border-slate-300 bg-slate-50 p-4">This search returned no raw results.</p>}
        </div>
      </article>) : <p className="border border-violet-200 bg-white p-4">No identity search was recorded.</p>}
    </div>
    <div className="mt-6 border border-violet-200 bg-white p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-violet-950">Pivot Scheduling Decisions</h3>
      {diagnostics.scheduling.length ? <ol className="mt-4 grid gap-3">{diagnostics.scheduling.map((entry, index) => <li key={`${entry.pivot}-${index}`} className="border border-slate-200 bg-slate-50 p-4"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><DiagnosticValue label="Pivot" value={entry.pivot} /><DiagnosticValue label="Decision" value={entry.decision} /><DiagnosticValue label="Reason" value={entry.reason} /><DiagnosticValue label="Hop" value={entry.hop} /><DiagnosticValue label="Generation" value={entry.schedulingGeneration ?? "Not recorded"} /><DiagnosticValue label="Pass" value={entry.queryPass ?? "Not recorded"} /><DiagnosticValue label="Remaining search budget" value={entry.remainingSearchBudget} /></dl></li>)}</ol> : <p className="mt-3">No pivot scheduling decision was recorded.</p>}
    </div>
  </section>;
}

export default function PersonalIdentityReport({ report }: { report: ShadowScoreReport }) {
  const summary = report.reportSummary;
  const signals = summary?.identitySignals;
  const candidates = summary?.publicIdentityCandidates || [];
  const requestedResults = requestedIdentityResults(signals, candidates);
  const sources = summary?.sourceProvenance || [];
  const sourceLinks = [...new Map(candidates.flatMap((candidate) => candidate.sourceProvenance || []).map((source) => [source.url, source])).values()];
  const diagnostics = summary?.discoveryDiagnostics;
  const execution = summary?.discoveryExecution || summarizeIdentityDiscovery(diagnostics);
  const completion = personalCompletionPresentation(summary?.completionStatus, candidates.length > 0);
  const matches = candidates.flatMap((candidate) => candidate.resolverMatchedSignals || []);
  const conflicts = candidates.flatMap((candidate) => candidate.resolverConflictingSignals || []);
  const verifiedCount = candidates.filter(isCorroboratedIdentityCandidate).length;
  const leadingCandidate = candidates.find(isCorroboratedIdentityCandidate)
    || candidates.find((candidate) => candidate.resolverMatchedSignals?.length && !candidate.resolverConflictingSignals?.length && !candidate.sourceNameDisagreement && !candidate.sourceSubjectAmbiguous)
    || candidates[0];
  const submitted: Array<[string, string]> = [
    ...(signals?.emails || []).map((value): [string, string] => ["Email", value]),
    ...(signals?.phones || []).map((value): [string, string] => ["Phone", value]),
    ...(signals?.names || []).map((value): [string, string] => ["Name", value]),
    ...(signals?.usernames || []).map((value): [string, string] => ["Username", value]),
    ...(signals?.organizations || []).map((value): [string, string] => ["Organization", value]),
    ...(signals?.roles || []).map((value): [string, string] => ["Role", value]),
  ];
  const actions = verifiedCount ? ["Confirm the strongest matched identifier directly with the person.", "Review each cited source before relying on the attribution.", "Resolve every contradictory identifier before making an identity decision."] : ["Ask the person to confirm a second independent identifier.", "Compare the submitted signals with a first-party profile or document.", "Treat every public profile candidate as unverified until attribution is corroborated."];
  return <article className="executive-report personal-identity-report overflow-hidden rounded-[28px] border border-slate-300 bg-[#f4f3ef] text-slate-700 shadow-[0_28px_90px_rgba(0,0,0,0.32)] [overflow-wrap:anywhere]">
    <header className="bg-[#10263d] px-4 py-9 text-white sm:px-10 lg:px-14"><p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">ShadowScore Intelligence</p><p className="mt-2 text-sm text-slate-300">Personal Identity Investigation</p><h1 className="mt-8 break-all text-3xl font-semibold tracking-tight sm:text-5xl">{report.target || report.entity}</h1><p className="mt-4 max-w-2xl text-slate-300">Source-backed identity research prepared for review. Discovery relevance is kept separate from identity attribution.</p></header>
    <div className="min-w-0 px-4 py-8 sm:px-10 lg:px-14 lg:py-12">
      <section aria-labelledby="identity-finding" className="min-w-0 border-b border-slate-300 pb-8">
        <h2 id="identity-finding" className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">Identity finding</h2>
        {leadingCandidate ? <>
          <p className="mt-3 break-words text-3xl font-semibold text-slate-950" dir="auto">{leadingCandidate.observedDisplayName || "Public profile to review"}</p>
          <p className="mt-3 font-semibold text-slate-950">{isCorroboratedIdentityCandidate(leadingCandidate) ? "Corroborated public lead" : "Unverified public lead"}</p>
          <p className="mt-2 max-w-3xl leading-7">{leadingCandidate.matchBasis}</p>
          <p className="mt-3 text-sm">{candidates.length} candidate{candidates.length === 1 ? "" : "s"} to review. {verifiedCount} corroborated by independent source families.</p>
          <SourceReportedProfile candidate={leadingCandidate} />
          <a href="#candidate-title" className="mt-4 inline-block py-2 font-semibold text-cyan-800 underline underline-offset-2">Review identity evidence and sources</a>
        </> : <>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{execution?.providerStatus === "unavailable" || execution?.providerStatus === "not_scheduled" ? "Public identity search unavailable" : "Identity remains unresolved"}</p>
          <p className="mt-3 max-w-3xl">{execution?.providerStatus === "completed" ? "Completed public searches returned no eligible identity candidate. A submitted identifier alone does not establish who the person is." : "There is insufficient collected evidence to identify a person. Review search coverage below before drawing a conclusion."}</p>
        </>}
      </section>
      <section className="mt-8" aria-labelledby="personal-summary"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">Case record</p><h2 id="personal-summary" className="mt-3 text-3xl font-semibold text-slate-950">Person Under Review</h2><div className={`mt-6 border p-5 ${completion.tone}`} role="status" aria-label="Investigation completion status"><p className="text-xs font-bold uppercase tracking-wider">Investigation outcome</p><p className="mt-2 text-xl font-semibold">{completion.label}</p><p className="mt-2 max-w-3xl">{completion.detail}</p></div><dl className="mt-6 grid border-y border-slate-300 bg-white sm:grid-cols-2 lg:grid-cols-4">{[["Investigation type", "Personal Identity Investigation"], ["Case reference", report.intakeId || report.reportId], ["Issued", dateTime(report.readyAt || report.createdAt)], ["Verification status", verifiedCount ? `${verifiedCount} supported candidate${verifiedCount === 1 ? "" : "s"}` : "Unresolved"]].map(([label, value]) => <div key={label} className="border-b border-slate-200 p-5 sm:border-r"><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-2 font-semibold text-slate-950">{value}</dd></div>)}</dl><div className="mt-6 border border-slate-300 bg-white p-5"><h3 className="font-semibold text-slate-950">Investigation objective</h3><p className="mt-2">{summary?.objective || "Determine whether public evidence can connect the submitted identity signals to the same person."}</p></div></section>
      <section className="mt-12 border-t border-slate-300 pt-10" aria-labelledby="submitted-signals"><h2 id="submitted-signals" className="text-3xl font-semibold text-slate-950">Submitted Identity Signals</h2><dl className="mt-6 grid gap-3 sm:grid-cols-2">{submitted.length ? submitted.map(([label, value]) => <div key={`${label}-${value}`} className="border border-slate-300 bg-white p-4"><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-2 break-all font-semibold text-slate-950">{value}</dd></div>) : <div className="border border-amber-300 bg-amber-50 p-4 sm:col-span-2"><dt className="font-semibold text-amber-950">Submitted signals unavailable</dt><dd className="mt-2 text-amber-950">This legacy report does not contain a recoverable submitted identity signal.</dd></div>}</dl></section>
      {(signals?.requestedAttributes?.length || signals?.requestText) && <section className="mt-12 border-t border-slate-300 pt-10" aria-labelledby="requested-results"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">Requested output</p><h2 id="requested-results" className="mt-3 text-3xl font-semibold text-slate-950">Requested Results</h2>{signals?.requestText && <div className="mt-5 border border-slate-300 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Original request</p><p className="mt-2 font-semibold text-slate-950">{signals.requestText}</p></div>}<p className="mt-5 text-sm">Requested: {(signals?.requestedAttributes || ["identity_match"]).map(requestedAttributeLabel).join(", ")}.</p>{requestedResults.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{requestedResults.map((result) => <article key={`${result.type}-${result.value}-${result.sourceUrl}`} className={`border p-5 ${result.corroborated ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}><p className={`text-xs font-bold uppercase tracking-wider ${result.corroborated ? "text-emerald-800" : "text-amber-900"}`}>{result.type}</p><p className="mt-2 break-all text-xl font-semibold text-slate-950">{result.value}</p><p className="mt-2 text-sm text-slate-700">{result.association}</p><a className="mt-3 inline-block break-all text-sm font-semibold text-cyan-800 underline underline-offset-2" href={result.sourceUrl} rel="noreferrer" target="_blank">View source</a></article>)}</div> : <div className="mt-5 border border-amber-300 bg-amber-50 p-5 text-amber-950"><p className="font-semibold">No source-backed requested result was found.</p><p className="mt-2 text-sm">ShadowScore leaves the result unresolved instead of inventing missing contact data.</p></div>}</section>}
      <section className="mt-12 border-t border-slate-300 pt-10" aria-labelledby="candidate-title"><h2 id="candidate-title" className="text-3xl font-semibold text-slate-950">Public Identity Candidates</h2><p className="mt-3 max-w-3xl">Every eligible discovery result is shown below. A relevant search result remains an unverified candidate unless resolver evidence supports attribution.</p><div className="mt-6 grid gap-5">{candidates.length ? candidates.map((candidate, index) => <CandidateCard key={candidate.profileUrl} candidate={candidate} index={index} />) : <p className="border border-slate-300 bg-white p-5">No eligible public identity candidate was returned.</p>}</div></section>
      <section className="mt-12 grid gap-6 border-t border-slate-300 pt-10 lg:grid-cols-2"><div className="border border-slate-300 bg-white p-5"><h2 className="text-xl font-semibold text-slate-950">Identity Matching Evidence</h2><p className="mt-3">{matches.length ? matches.map((item) => `${item.attribute}: ${item.observed}`).join(", ") : "No positive resolver evidence was recorded."}</p></div><div className="border border-slate-300 bg-white p-5"><h2 className="text-xl font-semibold text-slate-950">Contradictory Identifiers</h2><p className="mt-3">{conflicts.length ? conflicts.map((item) => `${item.attribute}: ${item.submitted} differs from ${item.observed}`).join("; ") : "No contradictory identifier was recorded."}</p></div></section>
      <section className="mt-12 border-t border-slate-300 pt-10" aria-labelledby="identity-sources"><h2 id="identity-sources" className="text-3xl font-semibold text-slate-950">Source Provenance</h2>
        <p className="mt-4 text-sm">Independent source count: <strong>{new Set(sourceLinks.map((source) => source.family)).size}</strong>. Different pages on the same source family count once.</p>
        {sourceLinks.length ? <ul className="mt-5 grid gap-3">{sourceLinks.map((source) => <li key={source.url} className="min-w-0 border-b border-slate-200 pb-3"><p className="font-semibold text-slate-950">{source.family}</p><a href={source.url} className="mt-1 inline-block break-all text-sm text-cyan-800 underline underline-offset-2" rel="noreferrer" target="_blank">{source.url}</a></li>)}</ul> : <p className="mt-5">No candidate source was recorded.</p>}
      </section>
      <section className="mt-12 border-t border-slate-300 pt-10" aria-labelledby="discovery-execution"><h2 id="discovery-execution" className="text-3xl font-semibold text-slate-950">Discovery Execution</h2>
        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="min-w-0 border border-slate-300 bg-white p-4"><dt className="font-semibold text-slate-950">Provider status</dt><dd className="mt-2">{execution ? { completed: "Completed", partial: "Partial coverage", unavailable: "Unavailable", not_scheduled: "Not scheduled" }[execution.providerStatus] : "Not recorded"}</dd></div>
          <div className="min-w-0 border border-slate-300 bg-white p-4"><dt className="font-semibold text-slate-950">Searches completed</dt><dd className="mt-2 text-2xl font-semibold">{execution?.searchesCompleted ?? "Not recorded"}</dd>{execution && execution.searchesAttempted > execution.searchesCompleted && <dd className="mt-1 text-sm">{execution.searchesAttempted} attempted. Further requests did not complete.</dd>}</div>
          <div className="min-w-0 border border-slate-300 bg-white p-4"><dt className="font-semibold text-slate-950">Result reason</dt><dd className="mt-2">{execution ? DISCOVERY_REASONS[execution.stopReason] : "Execution details were not recorded for this report"}</dd></div>
        </dl>
        {sources.length > 0 && <p className="mt-4 text-sm">Collection providers: {sources.map((source) => source.label).join(", ")}.</p>}
      </section>
      {report.accessType === "administrator" && diagnostics ? <DiscoveryDiagnostics diagnostics={diagnostics} /> : null}
      <section className="mt-12 border-t border-slate-300 pt-10"><h2 className="text-3xl font-semibold text-slate-950">Person-Specific Next Actions</h2><ol className="mt-6 divide-y divide-slate-200 border-y border-slate-300 bg-white">{actions.map((action, index) => <li key={action} className="grid grid-cols-[3rem_1fr] p-5"><span className="font-mono font-bold text-cyan-800">{String(index + 1).padStart(2, "0")}</span><span className="font-semibold text-slate-950">{action}</span></li>)}</ol></section>
    </div>
    <footer className="border-t border-slate-300 bg-white px-6 py-7 text-xs text-slate-500 sm:px-10 lg:px-14">This report reflects the public evidence available at the time of review. An unverified candidate is not an identity attribution.</footer>
  </article>;
}
