import ShadowScoreLayout from "../../components/ShadowScoreLayout";

export default function SecurityPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">Security & Data Handling</div>
        <h1 className="mt-4 text-5xl font-black">No Marketplace Password Required</h1>
        <p className="mt-6 leading-8 text-zinc-400">
          ShadowScore is designed around evidence uploads, visible operational signals and seller-supplied context. It does not require direct marketplace credentials for the initial scan.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            "No marketplace credentials required",
            "Do not upload card numbers or passwords",
            "Evidence-based document review",
            "Private assessment workflow",
            "PayPal, Payoneer, card and bank transfer support",
            "Enterprise readiness and domain reputation roadmap",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-300">{item}</div>
          ))}
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
