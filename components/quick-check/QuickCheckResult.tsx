import type { QuickCheckReport } from "../../lib/quickCheck/report";

type QuickCheckResultProps = {
  target: string;
  report?: QuickCheckReport;
};

const categoryPriority = [
  "legal_identity",
  "threat_reputation",
  "domain_registration",
  "website_security",
  "contact_consistency",
];

export default function QuickCheckResult({
  target,
  report,
}: QuickCheckResultProps) {
  const identity = report?.categories.find(
    (category) => category.id === "legal_identity",
  );
  const identityStatus =
    identity?.status === "Verified"
      ? "Identity verified"
      : identity?.status === "Partially verified"
        ? "Identity observed but not independently verified"
        : "Business identity not resolved";
  const categories =
    report?.categories
      .filter(
        (category) =>
          category.evidence.length > 0 ||
          categoryPriority.includes(category.id),
      )
      .sort((a, b) => {
        const evidenceOrder =
          Number(b.evidence.length > 0) - Number(a.evidence.length > 0);
        return (
          evidenceOrder ||
          categoryPriority.indexOf(a.id) - categoryPriority.indexOf(b.id)
        );
      })
      .slice(0, 5) ?? [];

  return (
    <>
      <section
        className="overflow-hidden rounded-[32px] border border-emerald-400/25 bg-emerald-500/[0.07]"
        aria-labelledby="quick-check-result-title"
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                Target checked
              </p>
              <h2
                id="quick-check-result-title"
                className="mt-3 break-words text-2xl font-black text-white sm:text-4xl"
              >
                {target}
              </h2>
              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-100">
                <span aria-hidden="true">✓</span> Free Quick Check completed
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                Business identity status
              </p>
              <p className="mt-2 max-w-xs font-black text-white">
                {identityStatus}
              </p>
            </div>
          </div>
          {report ? (
            <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                Preliminary assessment
              </p>
              <dl className="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-zinc-400">Decision</dt>
                  <dd className="mt-1 font-black text-white">
                    {report.decision}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">Confidence</dt>
                  <dd className="mt-1 font-black text-white">
                    {report.confidence}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">Evidence coverage</dt>
                  <dd className="mt-1 font-black text-white">
                    {report.evidenceCoverage}%
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-amber-100/80">
                This is a preliminary Quick Check, not the Full Investigation
                conclusion.
              </p>
            </div>
          ) : (
            <p className="mt-7 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-5 text-sm text-yellow-100">
              No live evidence report was returned for this target.
            </p>
          )}
        </div>
      </section>

      {report && (
        <>
          <section
            className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8"
            aria-labelledby="evidence-checked-title"
          >
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Evidence checked
            </p>
            <h3
              id="evidence-checked-title"
              className="mt-3 text-2xl font-black text-white"
            >
              What the live checks returned
            </h3>
            <div className="mt-6 grid gap-3">
              {categories.map((category) => {
                const evidence = category.evidence[0];
                return (
                  <article
                    key={category.id}
                    className="rounded-2xl border border-white/10 bg-black/35 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h4 className="font-black text-white">
                        {category.label}
                      </h4>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${category.status === "Verified" ? "bg-emerald-500/15 text-emerald-200" : category.status === "Partially verified" ? "bg-amber-500/15 text-amber-200" : "bg-zinc-700/70 text-zinc-300"}`}
                      >
                        {category.status}
                      </span>
                    </div>
                    {evidence && (
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-zinc-500">
                            Representative evidence
                          </dt>
                          <dd className="mt-1 break-words text-zinc-100">
                            {evidence.label}: {evidence.value}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-500">Source</dt>
                          <dd className="mt-1 break-words text-zinc-100">
                            {evidence.source}
                          </dd>
                        </div>
                      </dl>
                    )}
                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                      {category.summary}
                    </p>
                  </article>
                );
              })}
            </div>
            {report.sourcesSuccessfullyQueried.length > 0 && (
              <p className="mt-5 text-xs leading-5 text-zinc-500">
                Successfully queried sources:{" "}
                {report.sourcesSuccessfullyQueried.join(", ")}.
              </p>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
                Preliminary signals
              </p>
              {report.materialFindings.length ? (
                <ul className="mt-4 space-y-3">
                  {report.materialFindings.map((finding) => (
                    <li
                      key={finding.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-white">{finding.title}</p>
                        <span className="text-xs font-black uppercase text-red-200">
                          {finding.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {finding.description}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-6 text-zinc-300">
                  No high or critical material findings were returned by this
                  Quick Check.
                </p>
              )}
            </div>
            <div className="rounded-[28px] border border-amber-400/20 bg-amber-500/[0.06] p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                Evidence gaps
              </p>
              {report.evidenceGaps.length ? (
                <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                  {report.evidenceGaps.map((gap) => (
                    <li key={gap}>• {gap}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-zinc-300">
                  No unresolved category gaps were returned.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      <section
        className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8"
        aria-labelledby="full-investigation-adds"
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
          Free compared with full
        </p>
        <h3
          id="full-investigation-adds"
          className="mt-3 text-2xl font-black text-white"
        >
          What the Full Investigation adds
        </h3>
        <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <h4 className="font-black text-white">Free Quick Check</h4>
            <ul className="mt-3 space-y-2 text-zinc-400">
              <li>• Preliminary live checks</li>
              <li>• Representative evidence</li>
              <li>• Initial signals</li>
              <li>• Visible evidence gaps</li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-white">
              Full Investigation + Executive Report
            </h4>
            <ul className="mt-3 space-y-2 text-zinc-400">
              <li>• Broader evidence collection and correlation</li>
              <li>• Deeper identity and risk analysis</li>
              <li>• Material findings with business impact</li>
              <li>• Confidence, unresolved gaps, and recommended actions</li>
              <li>• Complete source trail</li>
              <li>• Retained Executive Report in your private workspace</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
