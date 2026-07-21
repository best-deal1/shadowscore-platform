"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { getCurrentUser } from "@/lib/auth";
import { dashboardGreeting, dashboardText } from "../_lib/copy";
import Link from "next/link";
import ShadowScoreLayout from "../../../components/ShadowScoreLayout";
import {
  activities,
  alerts as initialAlerts,
  investigations,
  savedViews,
} from "../_lib/demo-data";
import type { Investigation, RiskLevel, SavedView } from "../_lib/types";
import {
  ActivityItem,
  Confidence,
  InvestigationCard,
  KpiCard,
  RiskBadge,
  StatusLabel,
} from "./DashboardParts";

const filters = ["All risk", "Critical", "High", "Medium", "Low"] as const;
type RiskFilter = (typeof filters)[number];

function matchesView(item: Investigation, view: SavedView["filter"]) {
  if (view === "assigned") return item.analyst === "You";
  if (view === "high-risk")
    return item.risk === "High" || item.risk === "Critical";
  if (view === "evidence") return item.status === "Collecting evidence";
  if (view === "decision") return item.status === "Ready for decision";
  if (view === "monitoring") return item.status === "Monitoring";
  return true;
}

export function AnalystDashboard() {
  const { locale } = useLocale();
  const [user] = useState(() => getCurrentUser());
  const currentUserName = user?.name || user?.email.split("@")[0] || "Analyst";
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<RiskFilter>("All risk");
  const [view, setView] = useState<SavedView["filter"]>("all");
  const [sort, setSort] = useState<"priority" | "updated" | "confidence">(
    "priority",
  );
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showEmpty, setShowEmpty] = useState(false);
  const queue = useMemo(
    () =>
      investigations
        .filter(
          (item) =>
            !showEmpty &&
            matchesView(item, view) &&
            (risk === "All risk" || item.risk === risk) &&
            `${item.subject} ${item.id}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "confidence"
            ? b.confidence - a.confidence
            : sort === "updated"
              ? a.updated.localeCompare(b.updated)
              : ["Critical", "High", "Medium", "Low"].indexOf(a.risk) -
                ["Critical", "High", "Medium", "Low"].indexOf(b.risk),
        ),
    [query, risk, view, sort, showEmpty],
  );
  const acknowledged = (id: string) =>
    setAlerts((items) =>
      items.map((item) =>
        item.id === id ? { ...item, acknowledged: true } : item,
      ),
    );
  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <section
          aria-label={dashboardText(locale, "Decision intelligence")}
          className="rounded-3xl border border-sky-400/25 bg-sky-500/[0.07] p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                {dashboardText(locale, "Decision intelligence")}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {dashboardGreeting(locale, currentUserName)}
              </h1>
            </div>
            <Link
              href="/investigations"
              className="min-h-11 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {dashboardText(locale, "Start investigation")}
            </Link>
          </div>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-zinc-300 sm:grid-cols-2">
            <div>
              <p className="font-bold text-white">
                {dashboardText(locale, "Today")}
              </p>
              <ul className="mt-2 list-disc space-y-1 ps-5">
                <li>
                  3{" "}
                  {dashboardText(
                    locale,
                    "investigations are ready for a final decision.",
                  )}
                </li>
                <li>
                  2{" "}
                  {dashboardText(
                    locale,
                    "monitoring alerts require immediate review.",
                  )}
                </li>
                <li>
                  {dashboardText(locale, "Portfolio risk increased by")} 6.4%.
                </li>
                <li>
                  {dashboardText(locale, "Estimated review time")}: 18{" "}
                  {dashboardText(locale, "minutes")}.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-bold text-white">
                {dashboardText(locale, "Recommended first action")}
              </p>
              <p className="mt-2">
                {dashboardText(
                  locale,
                  "Review INV-1042 before processing additional payments.",
                )}
              </p>
            </div>
          </div>
        </section>
        <section
          aria-label={dashboardText(locale, "Executive overview")}
          className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiCard
            label="Active investigations"
            value="24"
            detail="6 assigned to you"
            locale={locale}
          />
          <KpiCard
            label="Open alerts"
            value="7"
            detail="2 require review now"
            tone="red"
            locale={locale}
          />
          <KpiCard
            label="High-risk cases"
            value="8"
            detail="3 ready for decision"
            tone="red"
            locale={locale}
          />
          <KpiCard
            label="Entities monitored"
            value="143"
            detail="5 changed today"
            locale={locale}
          />
          <KpiCard
            label="Reports awaiting review"
            value="3"
            detail="Oldest: 4 hours"
            tone="amber"
            locale={locale}
          />
          <KpiCard
            label="Average confidence"
            value="82%"
            detail="Across active cases"
            tone="emerald"
            locale={locale}
          />
          <KpiCard
            label="New evidence, 24h"
            value="41"
            detail="Added to 12 investigations"
            tone="sky"
            locale={locale}
          />
        </section>
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  {dashboardText(locale, "Priority work")}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {dashboardText(locale, "Analyst queue")}
                </h2>
              </div>
              <button
                onClick={() => setShowEmpty((value) => !value)}
                className="min-h-11 rounded-xl border border-white/15 px-3 text-sm font-bold text-zinc-200 hover:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {showEmpty
                  ? dashboardText(locale, "Show queue")
                  : dashboardText(locale, "Preview empty state")}
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="sm:col-span-2">
                <span className="sr-only">
                  {dashboardText(locale, "Search investigations")}
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={dashboardText(locale, "Search name or ID")}
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </label>
              <select
                value={risk}
                onChange={(event) => setRisk(event.target.value as RiskFilter)}
                aria-label={dashboardText(locale, "Filter by risk")}
                className="min-h-11 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {filters.map((item) => (
                  <option key={item}>{dashboardText(locale, item)}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                aria-label={dashboardText(locale, "Sort queue")}
                className="min-h-11 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <option value="priority">
                  {dashboardText(locale, "Sort: priority")}
                </option>
                <option value="updated">
                  {dashboardText(locale, "Sort: latest update")}
                </option>
                <option value="confidence">
                  {dashboardText(locale, "Sort: confidence")}
                </option>
              </select>
            </div>
            <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/35 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="p-3">
                      {dashboardText(locale, "Investigation")}
                    </th>
                    <th className="p-3">{dashboardText(locale, "Risk")}</th>
                    <th className="p-3">
                      {dashboardText(locale, "Confidence")}
                    </th>
                    <th className="p-3">{dashboardText(locale, "Status")}</th>
                    <th className="p-3">{dashboardText(locale, "Owner")}</th>
                    <th className="p-3">{dashboardText(locale, "Evidence")}</th>
                    <th className="p-3">
                      {dashboardText(locale, "Next action")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="p-3">
                        <p className="font-bold text-white">{item.subject}</p>
                        <p className="text-xs text-zinc-500">
                          {item.id} · {item.updated}
                        </p>
                      </td>
                      <td className="p-3">
                        <RiskBadge
                          level={item.risk}
                          reasons={item.riskReasons}
                          locale={locale}
                        />
                      </td>
                      <td className="p-3">
                        <Confidence value={item.confidence} locale={locale} />
                      </td>
                      <td className="p-3">
                        <StatusLabel status={item.status} locale={locale} />
                      </td>
                      <td className="p-3 text-zinc-300">
                        {item.analyst === "You"
                          ? currentUserName
                          : item.analyst}
                      </td>
                      <td className="p-3 text-zinc-300">
                        {item.evidenceCount}
                      </td>
                      <td className="p-3 text-zinc-300">{item.nextAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 grid gap-3 md:hidden">
              {queue.map((item) => (
                <InvestigationCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  currentUserName={currentUserName}
                />
              ))}
            </div>
            {queue.length === 0 && (
              <div
                role="status"
                className="mt-5 rounded-2xl border border-dashed border-white/15 p-8 text-center"
              >
                <h3 className="font-bold text-white">
                  {dashboardText(locale, "No investigations match this view")}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {dashboardText(
                    locale,
                    "Change a filter or search term to return to active work.",
                  )}
                </p>
                <button
                  onClick={() => {
                    setQuery("");
                    setRisk("All risk");
                    setView("all");
                    setShowEmpty(false);
                  }}
                  className="mt-4 min-h-11 rounded-xl border border-sky-400/40 px-4 text-sm font-bold text-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  {dashboardText(locale, "Clear filters")}
                </button>
              </div>
            )}
          </div>
          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              {dashboardText(locale, "Recent activity")}
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {dashboardText(locale, "Intelligence feed")}
            </h2>
            <ol className="mt-6 space-y-5">
              {activities.map((item) => (
                <ActivityItem key={item.id} item={item} locale={locale} />
              ))}
            </ol>
          </aside>
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              {dashboardText(locale, "Risk overview")}
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {dashboardText(locale, "Decision context")}
            </h2>
            <div className="mt-6 space-y-4 text-sm">
              <div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">
                    {dashboardText(locale, "Risk distribution")}
                  </span>
                  <span>8 high or critical</span>
                </div>
                <div className="mt-2 flex h-3 overflow-hidden rounded-full">
                  <span className="w-[18%] bg-red-500" />
                  <span className="w-[28%] bg-orange-400" />
                  <span className="w-[32%] bg-amber-300" />
                  <span className="w-[22%] bg-emerald-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/30 p-3">
                  <p className="text-zinc-500">
                    {dashboardText(locale, "In review")}
                  </p>
                  <p className="mt-1 text-xl font-black">11</p>
                </div>
                <div className="rounded-xl bg-black/30 p-3">
                  <p className="text-zinc-500">
                    {dashboardText(locale, "Monitoring")}
                  </p>
                  <p className="mt-1 text-xl font-black">7</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-zinc-400">
                  <span>{dashboardText(locale, "Risk trend, 7 days")}</span>
                  <span className="text-red-300">+6.4%</span>
                </div>
                <svg
                  className="mt-2 h-16 w-full"
                  viewBox="0 0 240 64"
                  role="img"
                  aria-label="Risk trend increased over seven days"
                >
                  <path
                    d="M0 49 L35 42 L70 45 L105 27 L140 34 L175 17 L210 22 L240 8"
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="3"
                  />
                  <path
                    d="M0 63 L0 49 L35 42 L70 45 L105 27 L140 34 L175 17 L210 22 L240 8 L240 63Z"
                    fill="rgba(248,113,113,.12)"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  {dashboardText(locale, "Monitoring alerts")}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {dashboardText(locale, "Changes requiring attention")}
                </h2>
              </div>
              <Link
                href="/monitoring"
                className="text-sm font-bold text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {dashboardText(locale, "Open monitoring")}
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-white">{alert.entity}</p>
                      <RiskBadge
                        level={alert.severity as RiskLevel}
                        locale={locale}
                      />
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">
                      {alert.type}: {alert.change}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      <span className="font-bold">
                        {dashboardText(locale, "Business impact")}:
                      </span>{" "}
                      {dashboardText(locale, alert.businessImpact)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {alert.detectedAt} · {alert.investigationId}
                    </p>
                  </div>
                  {alert.acknowledged ? (
                    <span className="text-sm font-bold text-emerald-300">
                      {dashboardText(locale, "Acknowledged")}
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledged(alert.id)}
                      className="min-h-11 rounded-xl border border-sky-400/35 px-3 text-sm font-bold text-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      {dashboardText(locale, "Acknowledge")}
                    </button>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              {dashboardText(locale, "Saved views")}
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {dashboardText(locale, "Return to work")}
            </h2>
            <div className="mt-5 grid gap-2">
              {savedViews.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.filter)}
                  aria-pressed={view === item.filter}
                  className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-left text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-300 ${view === item.filter ? "bg-sky-500/15 text-sky-100" : "text-zinc-300 hover:bg-white/5"}`}
                >
                  <span>{item.label}</span>
                  <span className="text-zinc-500">{item.count}</span>
                </button>
              ))}
            </div>
          </aside>
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  {dashboardText(locale, "Recent investigations")}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {dashboardText(locale, "Evidence at a glance")}
                </h2>
              </div>
              <Link
                href="/investigations"
                className="text-sm font-bold text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {dashboardText(locale, "View all")}
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {investigations.slice(0, 3).map((item) => (
                <InvestigationCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  currentUserName={currentUserName}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </ShadowScoreLayout>
  );
}
