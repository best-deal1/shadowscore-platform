import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { dashboardText } from "../_lib/copy";
import type {
  Activity,
  Investigation,
  InvestigationStatus,
  RiskLevel,
} from "../_lib/types";

const riskStyles: Record<RiskLevel, string> = {
  Critical: "border-red-400/40 bg-red-500/15 text-red-100",
  High: "border-orange-400/40 bg-orange-500/15 text-orange-100",
  Medium: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  Low: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
};
export function RiskBadge({
  level,
  reasons = [],
  locale,
}: {
  level: RiskLevel;
  reasons?: string[];
  locale: Locale;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${riskStyles[level]}`}
      >
        {dashboardText(locale, level)}
      </span>
      {reasons.length > 0 && (
        <span className="text-xs text-zinc-400">
          <span className="font-bold text-zinc-300">
            {dashboardText(locale, "Reason")}:
          </span>{" "}
          {reasons.map((reason) => dashboardText(locale, reason)).join(", ")}
        </span>
      )}
    </span>
  );
}
export function Confidence({
  value,
  locale,
}: {
  value: number;
  locale: Locale;
}) {
  const explanation = dashboardText(
    locale,
    "Confidence reflects evidence quality, provider agreement and source reliability.",
  );
  return (
    <span
      title={explanation}
      aria-label={`${dashboardText(locale, "Confidence")}: ${value}%. ${explanation}`}
      className="inline-flex cursor-help items-center gap-2 text-sm font-bold text-zinc-200"
    >
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-sky-400"
          style={{ width: `${value}%` }}
        />
      </span>
      {value}%
    </span>
  );
}
export function KpiCard({
  label,
  value,
  detail,
  tone = "sky",
  locale,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "sky" | "red" | "amber" | "emerald";
  locale: Locale;
}) {
  const tones = {
    sky: "border-sky-400/25",
    red: "border-red-400/25",
    amber: "border-amber-400/25",
    emerald: "border-emerald-400/25",
  };
  return (
    <article
      className={`min-w-0 rounded-2xl border bg-white/[0.035] p-4 ${tones[tone]}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
        {dashboardText(locale, label)}
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-400">
        {dashboardText(locale, detail)}
      </p>
    </article>
  );
}
export function InvestigationCard({
  item,
  locale,
  currentUserName,
}: {
  item: Investigation;
  locale: Locale;
  currentUserName: string;
}) {
  const owner = item.analyst === "You" ? currentUserName : item.analyst;
  return (
    <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-zinc-500">{item.id}</p>
          <h3 className="mt-1 font-bold text-white">{item.subject}</h3>
        </div>
        <RiskBadge
          level={item.risk}
          reasons={item.riskReasons}
          locale={locale}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-zinc-500">
            {dashboardText(locale, "Confidence")}
          </p>
          <Confidence value={item.confidence} locale={locale} />
        </div>
        <div>
          <p className="text-xs text-zinc-500">
            {dashboardText(locale, "Evidence")}
          </p>
          <p className="font-bold text-white">
            {item.evidenceCount} {dashboardText(locale, "items")}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-400">{item.evidenceSummary}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-zinc-500">
          {owner} · {item.updated}
        </span>
        <Link
          href={`/investigations/${item.id}`}
          className="font-bold text-sky-300 hover:text-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          {dashboardText(locale, "Open case")}
        </Link>
      </div>
    </article>
  );
}
export function ActivityItem({
  item,
  locale,
}: {
  item: Activity;
  locale: Locale;
}) {
  const dots = {
    sky: "bg-sky-400",
    red: "bg-red-400",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
  };
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dots[item.tone]}`}
      />
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">
          {dashboardText(locale, item.title)}
        </p>
        <p className="mt-1 text-sm leading-5 text-zinc-400">
          {dashboardText(locale, item.detail)}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          {dashboardText(locale, item.type)} ·{" "}
          {dashboardText(locale, item.time)}
        </p>
      </div>
    </li>
  );
}
export function StatusLabel({
  status,
  locale,
}: {
  status: InvestigationStatus;
  locale: Locale;
}) {
  return (
    <span className="text-xs font-medium text-zinc-300">
      {dashboardText(locale, status)}
    </span>
  );
}
