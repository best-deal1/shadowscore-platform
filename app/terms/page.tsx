import ShadowScoreLayout from "../../components/ShadowScoreLayout";

export default function TermsPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">Terms of Service</div>
        <h1 className="mt-4 text-5xl font-black">Independent Assessment Only</h1>
        <p className="mt-6 leading-8 text-zinc-400">ShadowScore provides independent marketplace risk assessments and does not guarantee account reinstatement, payment release or marketplace approval.</p>
        <p className="mt-6 leading-8 text-zinc-400">All recommendations are informational and based on evidence supplied by the seller, public marketplace rules and observable operational indicators.</p>
      </section>
    </ShadowScoreLayout>
  );
}
