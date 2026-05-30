import Link from "next/link";

export default function ShadowScoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 font-black text-red-400">S</div>
            <div>
              <div className="text-xl font-black tracking-tight">Shadow<span className="text-red-500">Score</span></div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">Risk Intelligence</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <Link href="/intake" className="hover:text-white">Intake</Link>
            <Link href="/analysis" className="hover:text-white">Risk OS</Link>
            <Link href="/report" className="hover:text-white">Report</Link>
            <Link href="/radar" className="hover:text-white">Pain Radar</Link>
            <a href="/#pricing" className="hover:text-white">Pricing</a>
          </nav>
          <Link href="/intake" className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-red-950/40 hover:bg-red-500">Start Audit</Link>
        </div>
      </header>
      {children}
    </main>
  );
}
