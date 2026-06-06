import Link from "next/link";

export default function ShadowScoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <img src="/shadowscore-shield-v8.png" alt="ShadowScore" className="h-9 w-9 rounded-xl object-contain bg-black p-1" />
            <div>
              <div className="text-xl font-black tracking-tight">Shadow<span className="text-red-500">Score</span></div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">Trust Intelligence</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <Link href="/#risk-categories" className="hover:text-white">Risk Categories</Link>
            <Link href="/#pricing" className="hover:text-white">Pricing</Link>
            <Link href="/intake" className="hover:text-white">Free Scan</Link>
            <Link href="/security" className="hover:text-white">Security</Link>
            <a href="https://www.tiktok.com/@shadowscore8" target="_blank" rel="noreferrer" className="hover:text-white">TikTok</a>
          </nav>
          <Link href="/intake" className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-red-950/40 hover:bg-red-500">Free Risk Scan</Link>
        </div>
      </header>
      {children}
    </main>
  );
}
