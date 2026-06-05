import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
        <div className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">About ShadowScore</div>
          <h1 className="mt-4 text-4xl font-black">About ShadowScore</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-400">
            <p>ShadowScore was created to help marketplace sellers understand operational trust, evidence readiness and marketplace exposure before issues escalate into reviews, payout holds or restrictions.</p>
<p>The platform is built around independent assessment, seller-provided evidence and public marketplace policies. ShadowScore does not access internal marketplace systems and does not claim to know proprietary platform decisions.</p>
<p>Our goal is to give sellers a clearer picture of their operational risk so they can improve documentation, consistency and readiness.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
