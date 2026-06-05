import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
        <div className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Privacy Policy</div>
          <h1 className="mt-4 text-4xl font-black">Privacy Policy</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-400">
            <p>ShadowScore uses submitted information only for assessment and communication related to the requested service.</p>
<p>We do not sell customer data. We do not require marketplace login credentials for an initial review.</p>
<p>Uploaded evidence may include screenshots, exports, notices, tracking documents and operational context. Files are handled for assessment purposes and may be deleted according to our data retention practices.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
