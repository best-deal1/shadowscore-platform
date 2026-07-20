/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { ShadowScoreUser, getCurrentUser, logoutUser } from "../../lib/auth";
import { getApplicationCopy } from "../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

function formatDate(value: string | undefined, locale: string, unavailable: string) {
  if (!value) return unavailable;
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AccountPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = getApplicationCopy(locale).account;
  const [user, setUser] = useState<ShadowScoreUser | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  function signOut() {
    logoutUser();
    router.push("/login");
  }

  if (!user) {
    return (
      <ShadowScoreLayout>
        <section className="mx-auto max-w-3xl px-6 py-20 text-zinc-400">{copy.loading}</section>
      </ShadowScoreLayout>
    );
  }

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">{copy.eyebrow}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">{user.name}</h1>
          <p className="mt-3 text-zinc-400">{user.email}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/50 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">{copy.userId}</div>
              <div className="mt-2 break-all text-sm font-bold text-white">{user.id}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/50 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">{copy.created}</div>
              <div className="mt-2 text-sm font-bold text-white">{formatDate(user.createdAt, locale, copy.unavailable)}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/50 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">{copy.lastLogin}</div>
              <div className="mt-2 text-sm font-bold text-white">{formatDate(user.lastLoginAt, locale, copy.unavailable)}</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/workspace" className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500">{copy.openDashboard}</Link>
            <button onClick={signOut} className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-zinc-300 hover:border-red-400/30 hover:text-white">{copy.signOut}</button>
          </div>

          <p className="mt-8 text-xs leading-6 text-zinc-600">{copy.notice}</p>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
