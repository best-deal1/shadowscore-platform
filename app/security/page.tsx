import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
        <div className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Security & Data Handling</div>
          <h1 className="mt-4 text-4xl font-black">Security & Data Handling</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-400">
            <p>No marketplace password is required for an initial ShadowScore review.</p>
<p>Uploaded evidence is used solely for assessment purposes and is not shared publicly.</p>
<p>ShadowScore does not access internal marketplace systems, does not expose proprietary marketplace logic and does not sell customer data.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
