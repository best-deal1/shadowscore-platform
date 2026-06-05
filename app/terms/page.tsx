import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
        <div className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Terms of Service</div>
          <h1 className="mt-4 text-4xl font-black">Terms of Service</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-400">
            <p>ShadowScore provides independent assessments, reports and recommendations. It does not represent, influence or control any marketplace.</p>
<p>No marketplace outcome is guaranteed. Final decisions always remain with the relevant marketplace.</p>
<p>Marketplace names are used for coverage reference only. ShadowScore is not affiliated with eBay, Amazon, Walmart, Etsy, SHEIN or TikTok Shop.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
