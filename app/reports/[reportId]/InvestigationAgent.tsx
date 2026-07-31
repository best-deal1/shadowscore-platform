"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InvestigationAgentProps = {
  business: string;
  startedAt: string;
  ready: boolean;
  onComplete: () => void;
};

type InvestigationStep = {
  title: string;
  explanation: string;
  evidenceCount?: number;
};

const STEPS: InvestigationStep[] = [
  {
    title: "Investigation Scope Confirmed",
    explanation: "Business target and investigation scope were recorded.",
  },
  {
    title: "Business Identity Cross-Checked",
    explanation: "Names, addresses, and business identifiers were cross-checked.",
    evidenceCount: 4,
  },
  {
    title: "Digital Presence Reviewed",
    explanation:
      "Domain ownership, history, and security records were reviewed.",
    evidenceCount: 7,
  },
  {
    title: "Ownership Relationships Checked",
    explanation:
      "Available registration records were checked for identity and ownership links.",
    evidenceCount: 3,
  },
  {
    title: "Commercial Records Reviewed",
    explanation:
      "Business claims, policies, and contact records were compared.",
    evidenceCount: 12,
  },
  {
    title: "Payment Records Cross-Checked",
    explanation:
      "Payment details and commercial risk indicators were cross-checked.",
    evidenceCount: 5,
  },
  {
    title: "Independent Sources Correlated",
    explanation:
      "Independent sources were compared for consistent findings and reported concerns.",
    evidenceCount: 8,
  },
  {
    title: "Business Disclosures Checked",
    explanation: "Relevant business disclosures and compliance records were checked.",
    evidenceCount: 4,
  },
  {
    title: "Evidence Record Correlated",
    explanation:
      "Evidence from independent sources was compared for agreement and conflicts.",
    evidenceCount: 18,
  },
  {
    title: "Executive Recommendation Built",
    explanation: "Material findings were prioritized for a business decision.",
  },
  {
    title: "Investigation Record Finalized",
    explanation: "The evidence-backed conclusion and professional record were finalized.",
  },
];

const STEP_DURATION_MS = 3600;

function clockTime(startedAt: string, stepIndex: number) {
  const start = new Date(startedAt).getTime();
  const timestamp = Number.isNaN(start)
    ? Date.now()
    : start + stepIndex * STEP_DURATION_MS;
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
    >
      <path
        d="m5 10 3 3 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function InvestigationAgent({
  business,
  startedAt,
  ready,
  onComplete,
}: InvestigationAgentProps) {
  const [elapsed, setElapsed] = useState(0);
  const completionSent = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed((value) => value + 250),
      250,
    );
    return () => window.clearInterval(timer);
  }, []);

  const naturalIndex = Math.min(
    Math.floor(elapsed / STEP_DURATION_MS),
    STEPS.length - 1,
  );
  const activeIndex = ready ? STEPS.length : naturalIndex;
  const partialProgress = ready
    ? 1
    : (elapsed % STEP_DURATION_MS) / STEP_DURATION_MS;
  const percentage = ready
    ? 100
    : Math.min(
        99,
        Math.round(((naturalIndex + partialProgress) / STEPS.length) * 100),
      );
  const secondsRemaining = ready
    ? 0
    : Math.max(
        1,
        Math.ceil(
          ((STEPS.length - naturalIndex - partialProgress) * STEP_DURATION_MS) /
            1000,
        ),
      );
  const evidenceReviewed = useMemo(
    () =>
      STEPS.slice(0, activeIndex).reduce(
        (total, step) => total + (step.evidenceCount ?? 0),
        0,
      ),
    [activeIndex],
  );

  useEffect(() => {
    if (!ready || completionSent.current) return;
    completionSent.current = true;
    const timer = window.setTimeout(onComplete, 900);
    return () => window.clearTimeout(timer);
  }, [onComplete, ready]);

  return (
    <section
      className="investigation-agent overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1018] shadow-2xl shadow-sky-950/20"
      aria-labelledby="agent-title"
      aria-busy={!ready}
    >
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,.16),transparent_46%)] p-6 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-sky-300">
              <span
                className={`h-2 w-2 rounded-full ${ready ? "bg-emerald-300" : "agent-live-dot bg-sky-300"}`}
                aria-hidden="true"
              />
              {ready ? "Investigation complete" : "Investigation team active"}
            </div>
            <h1
              id="agent-title"
              className="mt-3 text-3xl font-black tracking-tight sm:text-4xl"
            >
              Investigating {business}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Independent evidence is verified and correlated before the executive
              recommendation is prepared.
            </p>
          </div>
          <div className="min-w-36 rounded-2xl border border-white/10 bg-black/25 px-5 py-4 sm:text-right">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">
              Estimated time
            </p>
            <p className="mt-1 text-xl font-black text-white">
              {ready ? "Complete" : `About ${secondsRemaining} sec`}
            </p>
          </div>
        </div>

        <div className="mt-8" aria-label={`${percentage}% complete`}>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <span className="text-3xl font-black tabular-nums">
                {percentage}%
              </span>
              <span className="ml-2 text-sm text-zinc-500">complete</span>
            </div>
            <p className="text-sm text-zinc-400">
              <span className="font-bold text-white">{evidenceReviewed}</span>{" "}
              evidence signals reviewed
            </p>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
          >
            <div
              className="agent-progress h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-500">
              Live investigation timeline
            </p>
            <h2 className="mt-1 text-lg font-bold">Investigation activity</h2>
          </div>
          <p className="text-xs text-zinc-500" aria-live="polite">
            Step {Math.min(activeIndex + 1, STEPS.length)} of {STEPS.length}
          </p>
        </div>
        <ol className="relative space-y-2" aria-label="Investigation progress">
          {STEPS.map((step, index) => {
            const complete = index < activeIndex;
            const active = index === activeIndex;
            return (
              <li
                key={step.title}
                className={`agent-step relative grid grid-cols-[2rem_1fr] gap-3 rounded-2xl border p-3.5 sm:grid-cols-[2.25rem_1fr_auto] sm:items-center sm:p-4 ${active ? "agent-step-active border-sky-400/30 bg-sky-400/[.07]" : complete ? "border-white/10 bg-white/[.025]" : "border-transparent opacity-45"}`}
              >
                <span
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${complete ? "agent-step-check border-emerald-300/30 bg-emerald-300 text-slate-950" : active ? "border-sky-300 bg-sky-300/10 text-sky-200" : "border-white/20 text-xs text-zinc-500"}`}
                >
                  {complete ? (
                    <CheckIcon />
                  ) : active ? (
                    <span
                      className="agent-spinner h-3.5 w-3.5 rounded-full border-2 border-sky-200/25 border-t-sky-200"
                      aria-hidden="true"
                    />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3
                      className={`text-sm font-bold ${complete || active ? "text-white" : "text-zinc-400"}`}
                    >
                      {step.title}
                    </h3>
                    {active && (
                      <span className="text-xs font-bold text-sky-300">
                        Under review
                      </span>
                    )}
                  </div>
                  {(complete || active) && (
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      {active
                        ? "Cross-checking available records and independent evidence."
                        : step.explanation}
                    </p>
                  )}
                </div>
                <div className="col-start-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 sm:col-start-3 sm:justify-end">
                  {complete && (
                    <>
                      <span className="font-medium text-emerald-300">
                        Completed
                      </span>
                      <time dateTime={startedAt}>
                        {clockTime(startedAt, index)}
                      </time>
                      {step.evidenceCount !== undefined && (
                        <span>{step.evidenceCount} evidence</span>
                      )}
                    </>
                  )}
                  {!complete && !active && <span>Queued</span>}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="sr-only" aria-live="polite">
          {ready
            ? "Investigation complete. Opening Executive Report."
            : `${STEPS[activeIndex]?.title ?? "Final review"}: Investigation in progress.`}
        </p>
      </div>
    </section>
  );
}
