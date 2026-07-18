import ShadowScoreLayout from "../../components/ShadowScoreLayout";

const verifiedEvidence = [
  {
    fact: "The storefront domain resolves, uses HTTPS, and presents a checkout path for marketplace inventory.",
    source: "Public web and certificate checks",
    assumption: "We assume the checkout path is controlled by the same operator until payment account ownership is confirmed.",
  },
  {
    fact: "The seller profile, support email, and listed business name appear consistently across the intake evidence.",
    source: "Seller-provided screenshots and public listing review",
    assumption: "We assume the screenshots are current because timestamps are visible, but platform-side account records were not available.",
  },
  {
    fact: "Recent fulfillment evidence shows delivered orders, carrier scans, and customer-service responses for the sampled period.",
    source: "Uploaded tracking exports and message history",
    assumption: "The sample is treated as representative only for the reviewed order window.",
  },
];

const contradictions = [
  {
    title: "Supplier identity does not fully match the storefront identity",
    finding: "Invoices name a supplier entity that is not disclosed on the storefront, while the storefront presents the seller as the direct merchant of record.",
    confidence: "This reduces confidence because ownership and responsibility for product provenance are not yet clear.",
  },
  {
    title: "Payment routing evidence is incomplete",
    finding: "The business name appears consistently, but the payment account owner was not evidenced in the package.",
    confidence: "This prevents a clean recommendation to proceed because funds could be routed to an unverified beneficiary.",
  },
  {
    title: "Fulfillment performance is stronger than policy documentation",
    finding: "Tracking records show orders moving, but supplier authorization and product authenticity support lag behind the operational evidence.",
    confidence: "This creates a split picture: operations look active, while compliance readiness remains below the standard needed for scale.",
  },
];

const unknowns = [
  ["Beneficial ownership", "If ownership documents match the seller and payment account, the recommendation could move from review required to proceed with verification."],
  ["Supplier authorization", "If supplier authorization is confirmed, product-provenance concern decreases; if denied, the recommendation should move to do not proceed."],
  ["Payment account holder", "If the payout beneficiary is verified, payment exposure narrows; if not, funds should remain restricted until resolved."],
];

const impact = [
  ["Payment exposure", "Approving without payout verification could create recoverability issues if disputes, reserves, or refunds arise."],
  ["Ownership uncertainty", "Decision makers cannot yet prove who controls the storefront, supplier relationship, and payment destination as one accountable business."],
  ["Supplier verification", "Inventory may be operationally real, but authorization still needs to be documented before higher-volume marketplace activity."],
  ["Operational impact", "The seller can likely continue limited operations while documentation is gathered, but scaling before verification would increase review friction."],
  ["Executive decision impact", "Leadership has enough evidence to avoid rejection, but not enough to approve expansion or unrestricted payment flow."],
];

const appendix = [
  ["Domain and HTTPS", "Observed", "Supports active-business finding"],
  ["Seller screenshots", "Reviewed", "Supports identity consistency within provided evidence"],
  ["Carrier tracking sample", "Reviewed", "Supports operational activity in sampled period"],
  ["Supplier invoices", "Reviewed", "Creates supplier-identity contradiction"],
  ["Payment account ownership", "Not provided", "Required before unrestricted approval"],
];

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-zinc-200 pt-12">
      <div className="text-xs font-bold uppercase tracking-[0.26em] text-zinc-500">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">{title}</h2>
      <div className="mt-7">{children}</div>
    </section>
  );
}

export default function ExampleReport() {
  return (
    <ShadowScoreLayout>
      <main className="bg-zinc-100 px-4 py-10 text-zinc-900 sm:px-6 lg:py-16">
        <article className="mx-auto max-w-5xl rounded-[2.5rem] border border-zinc-200 bg-[#fbfaf7] px-6 py-10 shadow-[0_30px_120px_rgba(0,0,0,0.32)] sm:px-10 lg:px-16 lg:py-16">
          <header className="grid gap-10 border-b border-zinc-200 pb-12 lg:grid-cols-[1fr_17rem]">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.32em] text-red-700">Example executive report</div>
              <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-[-0.04em] text-zinc-950 lg:text-7xl">Investigation decision memo</h1>
              <p className="mt-6 max-w-3xl text-xl leading-9 text-zinc-600">
                ShadowScore reviewed the evidence package for a marketplace seller seeking continued processing and verification clearance. This report follows the evidence from observed facts to a business recommendation.
              </p>
            </div>
            <aside className="rounded-3xl border border-zinc-200 bg-white p-6">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Report ID</div>
              <div className="mt-3 text-2xl font-black text-zinc-950">SS-2026-DEMO-001</div>
              <dl className="mt-8 space-y-5 text-sm">
                <div><dt className="text-zinc-500">Subject</dt><dd className="mt-1 font-bold text-zinc-950">Demo Marketplace Seller</dd></div>
                <div><dt className="text-zinc-500">Audience</dt><dd className="mt-1 font-bold text-zinc-950">Risk, payments, executive review</dd></div>
                <div><dt className="text-zinc-500">Status</dt><dd className="mt-1 font-bold text-red-700">Decision support only</dd></div>
              </dl>
            </aside>
          </header>

          <div className="space-y-14 pt-12">
            <Section eyebrow="01 / What is the recommendation?" title="Executive recommendation">
              <div className="rounded-[2rem] bg-zinc-950 p-8 text-white lg:p-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-[0.25em] text-red-200">Review required</div>
                    <p className="mt-5 max-w-3xl text-3xl font-black leading-tight lg:text-4xl">Do not grant unrestricted approval yet. Continue limited activity while ownership, supplier authorization, and payment beneficiary evidence are verified.</p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 p-5 text-center">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Confidence</div>
                    <div className="mt-2 text-4xl font-black">Moderate</div>
                  </div>
                </div>
                <p className="mt-7 max-w-4xl text-lg leading-8 text-zinc-300">The seller appears operational and some identity signals are consistent, but the evidence does not yet connect the storefront, supplier relationship, and payout destination into one verified operating picture.</p>
              </div>
            </Section>

            <Section eyebrow="02 / Why?" title="Investigation summary">
              <div className="grid gap-6 lg:grid-cols-3">
                {[["What was investigated?", "A seller identity package, storefront presence, order fulfillment sample, supplier documents, and payment-readiness evidence."], ["What was discovered?", "The business appears active and capable of fulfillment, but core documents conflict around supplier identity and payment ownership."], ["Why does it matter?", "Approving the seller without resolving those conflicts could leave payments, marketplace compliance, and executive accountability exposed."]].map(([q, a]) => (
                  <div key={q} className="rounded-3xl border border-zinc-200 bg-white p-6">
                    <h3 className="text-lg font-black text-zinc-950">{q}</h3>
                    <p className="mt-4 leading-7 text-zinc-600">{a}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="03 / Which evidence is verified?" title="Verified evidence">
              <div className="space-y-4">
                {verifiedEvidence.map((item) => (
                  <div key={item.fact} className="rounded-3xl border border-zinc-200 bg-white p-6">
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Verified fact</div>
                    <p className="mt-3 text-xl font-bold leading-8 text-zinc-950">{item.fact}</p>
                    <div className="mt-5 grid gap-4 text-sm leading-6 md:grid-cols-2">
                      <p><span className="font-bold text-zinc-950">Evidence source: </span><span className="text-zinc-600">{item.source}</span></p>
                      <p><span className="font-bold text-zinc-950">Assumption kept separate: </span><span className="text-zinc-600">{item.assumption}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="04 / Which evidence conflicts?" title="Contradictions reducing confidence">
              <div className="space-y-5">
                {contradictions.map((item, index) => (
                  <div key={item.title} className="grid gap-5 rounded-3xl border border-red-200 bg-red-50/70 p-6 lg:grid-cols-[4rem_1fr]">
                    <div className="text-4xl font-black text-red-700">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <h3 className="text-2xl font-black text-zinc-950">{item.title}</h3>
                      <p className="mt-3 leading-7 text-zinc-700">{item.finding}</p>
                      <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-zinc-800">Why confidence changed: {item.confidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="05 / What remains unknown?" title="Remaining unknowns">
              <div className="divide-y divide-zinc-200 rounded-3xl border border-zinc-200 bg-white">
                {unknowns.map(([question, effect]) => (
                  <div key={question} className="p-6">
                    <h3 className="text-xl font-black text-zinc-950">{question}</h3>
                    <p className="mt-3 leading-7 text-zinc-600">{effect}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="06 / What business risk exists if ignored?" title="Business impact">
              <div className="grid gap-4 md:grid-cols-2">
                {impact.map(([label, detail]) => (
                  <div key={label} className="rounded-3xl border border-zinc-200 bg-white p-6">
                    <h3 className="text-xl font-black text-zinc-950">{label}</h3>
                    <p className="mt-3 leading-7 text-zinc-600">{detail}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="07 / What should happen next?" title="Recommendation and next steps">
              <div className="rounded-[2rem] border border-zinc-950 bg-white p-8">
                <div className="grid gap-4 md:grid-cols-4">
                  {["Proceed", "Proceed with verification", "Review required", "Do not proceed"].map((option) => (
                    <div key={option} className={`rounded-2xl border p-4 text-center text-sm font-black ${option === "Review required" ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 text-zinc-400"}`}>{option}</div>
                  ))}
                </div>
                <p className="mt-7 text-xl font-bold leading-8 text-zinc-950">Selected outcome: Review required. The investigation supports continued limited engagement, but not unrestricted approval.</p>
                <ol className="mt-5 list-decimal space-y-3 pl-5 leading-7 text-zinc-600">
                  <li>Request beneficial ownership documents that match the storefront and legal business profile.</li>
                  <li>Confirm the payment account holder before releasing higher payment limits or reserves.</li>
                  <li>Obtain supplier authorization or brand-provenance documents for the inventory category.</li>
                  <li>Reassess the recommendation after those documents are verified against the existing evidence package.</li>
                </ol>
              </div>
            </Section>

            <Section eyebrow="08 / Technical support" title="Evidence appendix">
              <p className="mb-5 max-w-3xl leading-7 text-zinc-600">The appendix preserves technical observations separately from the executive reasoning above. It supports the decision but is not required to understand it.</p>
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">
                {appendix.map(([item, status, relevance]) => (
                  <div key={item} className="grid gap-3 border-b border-zinc-200 p-5 last:border-b-0 md:grid-cols-[1.4fr_0.8fr_2fr]">
                    <div className="font-bold text-zinc-950">{item}</div>
                    <div className="text-zinc-600">{status}</div>
                    <div className="text-zinc-600">{relevance}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </article>
      </main>
    </ShadowScoreLayout>
  );
}
