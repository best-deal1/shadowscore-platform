"use client";

import { useEffect, useRef, useState } from "react";

type InvestigationAgentProps = {
  business: string;
  startedAt: string;
  ready: boolean;
  onComplete: () => void;
};

type InvestigationStage = {
  title: string;
  activity: string;
  reason: string;
  signal: string;
};

const STAGES: InvestigationStage[] = [
  {
    title: "Scope secured",
    activity: "The target, jurisdiction, and investigation boundaries are being confirmed.",
    reason: "A precise scope keeps evidence tied to the business under review.",
    signal: "Target record created",
  },
  {
    title: "Identity resolving",
    activity: "Names, addresses, domains, and available business identifiers are being compared.",
    reason: "Identity resolution separates the target from similarly named businesses.",
    signal: "Identity signals correlating",
  },
  {
    title: "Sources discovering",
    activity: "Relevant public records and first-party business sources are being located.",
    reason: "Source diversity makes material claims easier to verify independently.",
    signal: "Source map expanding",
  },
  {
    title: "Evidence cross-validating",
    activity: "Claims are being compared across independent records for agreement and conflict.",
    reason: "Contradictions can change the commercial risk interpretation.",
    signal: "Evidence graph updating",
  },
  {
    title: "Risk interpreting",
    activity: "Material findings are being weighed by relevance, recency, and evidence strength.",
    reason: "This turns isolated signals into decision context.",
    signal: "Confidence being calibrated",
  },
  {
    title: "Decision preparing",
    activity: "The conclusion, evidence trail, and recommended controls are being assembled.",
    reason: "The Executive Report prioritizes the facts needed for a business decision.",
    signal: "Executive recommendation forming",
  },
];

const STAGE_DURATION_MS = 6600;

function startedTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recorded";
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function Icon({ name }: { name: "scope" | "identity" | "sources" | "evidence" | "risk" | "decision" }) {
  const paths = {
    scope: <><circle cx="12" cy="12" r="7" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
    identity: <><circle cx="12" cy="8" r="3" /><path d="M6.5 19c.6-3.3 2.4-5 5.5-5s4.9 1.7 5.5 5" /></>,
    sources: <><circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="m8.2 8.3 2.7 7.3m5-7.3-2.8 7.3M8.5 7h7" /></>,
    evidence: <><path d="M5 4h11l3 3v13H5z" /><path d="M15 4v4h4M8 12h8m-8 4h5" /></>,
    risk: <><path d="M12 3 3.5 19h17z" /><path d="M12 9v4m0 3h.01" /></>,
    decision: <><path d="m5 12 4 4L19 6" /><path d="M19 12v7H5V5h9" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function InvestigationAgent({ business, startedAt, ready, onComplete }: InvestigationAgentProps) {
  const [elapsed, setElapsed] = useState(0);
  const completionSent = useRef(false);

  useEffect(() => {
    if (ready) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 250), 250);
    return () => window.clearInterval(timer);
  }, [ready]);

  const naturalIndex = Math.min(Math.floor(elapsed / STAGE_DURATION_MS), STAGES.length - 1);
  const activeIndex = ready ? STAGES.length : naturalIndex;
  const partialProgress = ready ? 1 : (elapsed % STAGE_DURATION_MS) / STAGE_DURATION_MS;
  const percentage = ready ? 100 : Math.min(99, Math.round(((naturalIndex + partialProgress) / STAGES.length) * 100));
  const currentStage = STAGES[Math.min(naturalIndex, STAGES.length - 1)];
  const icons = ["scope", "identity", "sources", "evidence", "risk", "decision"] as const;

  useEffect(() => {
    if (!ready || completionSent.current) return;
    completionSent.current = true;
    const timer = window.setTimeout(onComplete, 1100);
    return () => window.clearTimeout(timer);
  }, [onComplete, ready]);

  return (
    <section className="intelligence-run" aria-labelledby="agent-title" aria-busy={!ready}>
      <header className="intelligence-run-header">
        <div>
          <p className="intelligence-kicker"><span className={ready ? "is-ready" : "agent-live-dot"} aria-hidden="true" />{ready ? "Decision ready" : "Live intelligence operation"}</p>
          <h1 id="agent-title">{ready ? "Investigation complete" : <>Resolving <span>{business}</span></>}</h1>
          <p className="intelligence-intro">ShadowScore is connecting identity, source, and commercial evidence into one decision record.</p>
        </div>
        <dl className="intelligence-run-meta">
          <div><dt>Operation</dt><dd>Business investigation</dd></div>
          <div><dt>Started</dt><dd><time dateTime={startedAt}>{startedTime(startedAt)}</time></dd></div>
          <div><dt>Confidence</dt><dd>{ready ? "Established" : activeIndex > 3 ? "Calibrating" : "Building"}</dd></div>
        </dl>
      </header>

      <div className="intelligence-stage">
        <div className="intelligence-radar" aria-hidden="true">
          <span className="intelligence-radar-sweep" />
          <span className="intelligence-radar-core"><Icon name={icons[Math.min(naturalIndex, icons.length - 1)]} /></span>
          <i className="radar-signal radar-signal-a" /><i className="radar-signal radar-signal-b" /><i className="radar-signal radar-signal-c" />
        </div>
        <div className="intelligence-now" aria-live="polite">
          <p>Current operation</p>
          <h2>{ready ? "Executive decision ready" : currentStage.title}</h2>
          <p className="intelligence-activity">{ready ? "The evidence record and executive recommendation are ready for review." : currentStage.activity}</p>
          <div className="intelligence-why"><span>Why it matters</span><p>{ready ? "The conclusion remains connected to its supporting evidence." : currentStage.reason}</p></div>
          <div className="intelligence-signal"><span aria-hidden="true" />{ready ? "Report sealed" : currentStage.signal}</div>
        </div>
      </div>

      <div className="intelligence-progress-wrap">
        <div className="intelligence-progress-label"><span>{ready ? "Analysis complete" : `Stage ${activeIndex + 1} of ${STAGES.length}`}</span><strong>{percentage}%</strong></div>
        <div className="intelligence-progress" role="progressbar" aria-label="Investigation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div>
      </div>

      <ol className="intelligence-timeline" aria-label="Investigation story">
        {STAGES.map((stage, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          return <li key={stage.title} className={complete ? "is-complete" : active ? "is-active" : ""}>
            <span className="intelligence-stage-icon"><Icon name={icons[index]} /></span>
            <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{complete ? stage.signal : active ? "In progress" : "Queued"}</p></div>
          </li>;
        })}
      </ol>
      <p className="sr-only" aria-live="polite">{ready ? "Investigation complete. Opening Executive Report." : `${currentStage.title}. ${currentStage.activity}`}</p>
    </section>
  );
}
