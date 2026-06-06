import ShadowScoreLayout from "../../components/ShadowScoreLayout";

export default function PrivacyPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">Privacy Policy</div>
        <h1 className="mt-4 text-5xl font-black">Privacy First Assessment</h1>
        <p className="mt-6 leading-8 text-zinc-400">ShadowScore uses uploaded evidence only for risk assessment and report preparation. We do not sell customer documents or marketplace data.</p>
        <p className="mt-6 leading-8 text-zinc-400">Initial assessments do not require marketplace passwords. Users should avoid uploading passwords, card numbers or unnecessary personal information.</p>
      </section>
    </ShadowScoreLayout>
  );
}
