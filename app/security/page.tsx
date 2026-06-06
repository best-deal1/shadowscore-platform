import ShadowScoreLayout from "../../components/ShadowScoreLayout";

export default function SecurityPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">Security & Data Handling</div>
        <h1 className="mt-4 text-5xl font-black">No Marketplace Password Required</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {["No marketplace credentials required", "Evidence-based document review", "Private assessment workflow", "PayPal, Payoneer, card and bank transfer support", "Independent platform", "Enterprise readiness roadmap"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-300">{item}</div>
          ))}
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
