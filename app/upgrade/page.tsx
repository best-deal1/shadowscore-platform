import Link from "next/link";
import ShadowScoreLayout from "../components/ShadowScoreLayout";

const valueCards = [
  ["Verify suppliers", "Confirm business identity and review source-backed evidence before onboarding."],
  ["Reduce fraud", "Surface conflicting claims, hidden relationships, and evidence gaps earlier."],
  ["Monitor business partners", "Track material changes across the organizations you depend on."],
  ["Detect compliance issues", "Turn policy and evidence signals into a structured review queue."],
  ["Investigate organizations", "Connect entities, relationships, findings, and decisions in one case."],
  ["Continuous trust monitoring", "Keep risk assessments current as new evidence and events appear."],
];

const plans = [
  { name: "Community", price: "$49", period: "one-time", label: "Start here", description: "A focused trust review for a single organization.", features: ["Trust score and key findings", "Entity identity review", "Executive PDF snapshot", "Recommended next actions"], cta: "Start Free", href: "/intake" },
  { name: "Professional", price: "$99", period: "per review", label: "Save Time", description: "Deeper investigation for recurring business decisions.", features: ["Full evidence review", "Entity relationship analysis", "Trust timeline", "Downloadable report"], cta: "Choose Professional", href: "/intake" },
  { name: "Business", price: "$199", period: "per investigation", label: "Most Popular", value: "Best Value", description: "Investigation and monitoring for operational teams.", features: ["Continuous monitoring", "Team investigation workspace", "API and webhooks", "Priority support"], cta: "Choose Business", href: "/intake", featured: true },
  { name: "Enterprise", price: "$299", period: "per month", label: "Enterprise ready", description: "Controls and deployment support for larger programs.", features: ["SSO and audit logs", "Custom policies and collectors", "Private deployment options", "Dedicated onboarding"], cta: "Contact Sales", href: "/contact" },
];

type Availability = boolean | string;
const comparison: Array<[string, Availability, Availability, Availability, Availability]> = [
  ["Trust Intelligence", true, true, true, true], ["Entity Resolution", "Basic", true, true, true],
  ["Continuous Monitoring", false, false, true, true], ["Investigations", "1", "5", "25", "Custom"],
  ["Trust Timeline", false, true, true, true], ["Reports", "Snapshot", "Full", "Full", "Custom"],
  ["API", false, false, true, true], ["Webhooks", false, false, true, true],
  ["Team Members", "1", "1", "5", "Custom"], ["SSO", false, false, false, true],
  ["Audit Logs", false, false, true, true], ["Custom Policies", false, false, false, true],
  ["Priority Support", false, false, true, true], ["Custom Collectors", false, false, false, true],
  ["Enterprise Deployment", false, false, false, true],
];

const creditPackages = [
  ["Starter", "$50", "550 Credits", "For occasional source checks"],
  ["Team", "$150", "1,800 Credits", "For active investigation teams"],
  ["Scale", "$300", "3,900 Credits", "For monitoring and API workflows"],
  ["Enterprise", "$500", "7,000 Credits", "Best value"],
];

const faqs = [
  ["How does billing work?", "Choose a plan for included capacity. Additional usage and credit purchases are billed separately."],
  ["Can I cancel anytime?", "Yes. You can cancel a recurring subscription before its next billing date."],
  ["What happens if I exceed usage?", "Your workspace uses available credits for additional capacity. We show usage before you add more credits."],
  ["How are credits consumed?", "Credits fund additional source collection, monitoring runs, investigations, and report generation. Usage varies by workflow and source."],
  ["Do unused credits expire?", "Purchased credits remain available while your account is active."],
  ["Do you offer annual billing?", "Yes. Contact sales for annual Business and Enterprise terms."],
];

function AvailabilityValue({ value }: { value: Availability }) {
  if (typeof value === "boolean") return <span className={value ? "text-emerald-300" : "text-zinc-600"} aria-label={value ? "Included" : "Not included"}>{value ? "✓" : "−"}</span>;
  return <span>{value}</span>;
}

export default function UpgradePage() {
  return (
    <ShadowScoreLayout>
      <main className="pricing-page">
        <section className="pricing-hero px-6 pb-20 pt-20 text-center sm:pt-28">
          <div className="mx-auto max-w-5xl">
            <p className="pricing-eyebrow">Plans for every trust program</p>
            <h1 className="mt-6 text-5xl font-black tracking-[-0.045em] text-white sm:text-7xl">Trust Intelligence for Every Organization</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">Verify companies, monitor risk, investigate relationships, and make evidence-backed decisions.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-bold text-zinc-300"><span>✓ No credit card required</span><span>✓ Setup in under 2 minutes</span></div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/intake" className="pricing-primary">Start Free</Link>
              <Link href="/sample-report" className="pricing-secondary">View Demo Report</Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6"><div className="pricing-proof" aria-label="ShadowScore platform strengths"><span>✓ Explainable AI</span><span>✓ Evidence-Backed Decisions</span><span>✓ Continuous Monitoring</span><span>✓ Enterprise Ready</span></div></div>

        <section className="pricing-section" aria-labelledby="why-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Business value</p><h2 id="why-title">Why ShadowScore?</h2><p>Move from isolated checks to a consistent record of business trust.</p></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{valueCards.map(([title, description]) => <article className="pricing-value-card" key={title}><span aria-hidden="true">✓</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
        </section>

        <section className="pricing-section pt-4" aria-labelledby="plans-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Simple pricing</p><h2 id="plans-title">Choose the right level of intelligence</h2><p>Start with one decision. Add investigation depth, monitoring, and team controls as your program grows.</p></div>
          <div className="mt-14 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">{plans.map(plan => <article key={plan.name} className={`pricing-plan ${plan.featured ? "pricing-plan-featured" : ""}`}><div><div className="flex items-center justify-between gap-3"><span className="pricing-pill">{plan.label}</span>{plan.value && <span className="text-xs font-black uppercase tracking-wider text-emerald-300">{plan.value}</span>}</div><h3>{plan.name}</h3><div className="mt-5 flex items-end gap-2"><strong>{plan.price}</strong><span className="pb-1 text-sm text-zinc-500">{plan.period}</span></div><p className="mt-5 min-h-12 text-sm leading-6 text-zinc-400">{plan.description}</p><ul>{plan.features.map(feature => <li key={feature}><span>✓</span>{feature}</li>)}</ul></div><Link className={plan.featured ? "pricing-primary" : "pricing-secondary"} href={plan.href}>{plan.cta}</Link></article>)}</div>
        </section>

        <section className="pricing-section" aria-labelledby="compare-title"><div className="pricing-heading"><p className="pricing-eyebrow">Compare plans</p><h2 id="compare-title">Capabilities at a glance</h2><p>Review the access, workflow, and governance included with each plan.</p></div><div className="pricing-table-wrap"><table><caption className="sr-only">ShadowScore plan feature comparison</caption><thead><tr><th scope="col">Capability</th>{plans.map(plan => <th scope="col" key={plan.name} className={plan.featured ? "is-featured" : ""}>{plan.name}</th>)}</tr></thead><tbody>{comparison.map(([feature, ...values]) => <tr key={feature}><th scope="row">{feature}</th>{values.map((value, i) => <td key={plans[i].name} className={plans[i].featured ? "is-featured" : ""}><AvailabilityValue value={value} /></td>)}</tr>)}</tbody></table></div></section>

        <section className="pricing-section grid gap-6 lg:grid-cols-2" aria-label="Usage and credit pricing"><article className="pricing-panel"><p className="pricing-eyebrow">Usage pricing</p><h2>Expand capacity when you need it</h2><p>Additional professional reports remain <strong className="text-white">$9.90 per completed investigation</strong>. Provider and monitoring usage draws from your credit balance.</p><div className="pricing-note">Only pay for additional capacity beyond your subscription.</div></article><article className="pricing-panel"><p className="pricing-eyebrow">Credits</p><h2>Fund additional intelligence</h2><p>Credits are used for source collection, monitoring runs, additional investigations, and report generation.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{creditPackages.map(([name, price, credits, note]) => <div className={`credit-card ${name === "Enterprise" ? "is-best" : ""}`} key={name}><div className="flex justify-between gap-3"><h3>{name}</h3><strong>{price}</strong></div><p className="mt-3 text-lg font-black text-white">{credits}</p><span>{note}</span></div>)}</div></article></section>

        <section className="pricing-section" aria-labelledby="trust-title"><div className="pricing-heading"><p className="pricing-eyebrow">Built for accountable decisions</p><h2 id="trust-title">Why customers trust ShadowScore</h2><p>Every assessment preserves the evidence, logic, and history behind the decision.</p></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Evidence-backed", "Findings link to the records and signals that support them."],["Deterministic", "Defined rules produce consistent results from the same evidence."],["Versioned", "Changes to evidence, policies, and decisions remain traceable."],["Explainable", "Teams can review how each finding and recommendation was formed."],["Continuous Monitoring", "New events can trigger review as business conditions change."],["Append-only audit trail", "The decision history preserves prior events and recorded actions."]].map(([title, body], index) => <article className="trust-card" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

        <section className="pricing-section" aria-labelledby="faq-title"><div className="pricing-heading"><p className="pricing-eyebrow">FAQ</p><h2 id="faq-title">Billing and usage questions</h2></div><div className="mx-auto mt-12 max-w-4xl space-y-3">{faqs.map(([question, answer]) => <details className="pricing-faq" key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className="pricing-section pb-28"><div className="enterprise-cta"><div><p className="pricing-eyebrow">Enterprise</p><h2>Need Enterprise Risk Intelligence?</h2><p>Build a trust intelligence program around your policies, infrastructure, and review process.</p></div><ul><li>✓ Private deployment</li><li>✓ Custom integrations</li><li>✓ Dedicated onboarding</li><li>✓ SLA</li></ul><Link href="/contact" className="pricing-primary">Contact Sales</Link></div></section>
      </main>
    </ShadowScoreLayout>
  );
}
