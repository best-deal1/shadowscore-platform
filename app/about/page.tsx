import ShadowScoreLayout from "../../components/ShadowScoreLayout";

export default function AboutPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">About ShadowScore</div>
        <h1 className="mt-4 text-5xl font-black">Marketplace Trust Intelligence For Digital Sellers</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-400">ShadowScore helps sellers understand operational trust, policy exposure, supplier risk, payment risk and marketplace readiness across major digital commerce platforms.</p>
        <p className="mt-6 leading-8 text-zinc-400">We are independent and do not claim access to internal marketplace systems. The platform is built around seller-supplied evidence, public policies, visible operational signals and structured marketplace risk analysis.</p>
      </section>
    </ShadowScoreLayout>
  );
}
