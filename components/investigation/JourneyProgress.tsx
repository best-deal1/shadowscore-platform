import Link from "next/link";

const steps: ReadonlyArray<{ label: string; href?: string }> = [
  { label: "Investigation", href: "/intake" },
  { label: "Review and payment" },
  { label: "Processing" },
  { label: "Executive Report" },
];

export default function JourneyProgress({ current, compact = false }: { current: 1 | 2 | 3 | 4; compact?: boolean }) {
  return (
    <nav aria-label="Investigation progress" className={compact ? "w-full" : "relative z-10 border-b border-white/10 bg-black/70"}>
      <ol className={compact ? "grid grid-cols-4 gap-2" : "mx-auto grid max-w-7xl grid-cols-4 gap-2 px-6 py-4"}>
        {steps.map((step, index) => {
          const number = index + 1;
          const complete = number < current;
          const active = number === current;
          const content = <><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black ${complete ? "border-emerald-300 bg-emerald-300 text-black" : active ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/15 text-zinc-500"}`}>{complete ? "✓" : number}</span><span className={`hidden text-xs font-bold sm:block ${active ? "text-white" : complete ? "text-emerald-200" : "text-zinc-500"}`}>{step.label}</span></>;
          return <li key={step.label} aria-current={active ? "step" : undefined} className="min-w-0">
            {complete && step.href ? <Link href={step.href} className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">{content}</Link> : <div className="flex min-h-11 items-center gap-2">{content}</div>}
          </li>;
        })}
      </ol>
    </nav>
  );
}
