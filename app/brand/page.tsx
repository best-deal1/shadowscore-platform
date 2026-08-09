import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./brand.module.css";

export const metadata: Metadata = { title: "Brand system | ShadowScore", description: "The ShadowScore continuous intelligence visual system." };

const stages = [
  ["01", "Collect", "Signals enter from monitored sources."],
  ["02", "Evidence", "Observations retain source and time."],
  ["03", "Knowledge", "Resolution connects facts to entities."],
  ["04", "Trust", "Confidence changes with each connection."],
  ["05", "Monitor", "The loop stays active."],
];
const timeline = [
  ["Evidence", "Registry record observed", "17 sec ago", "blue"],
  ["Assertion", "Trading address matched", "14 sec ago", "purple"],
  ["Knowledge", "Domain ownership resolved", "9 sec ago", "purple"],
  ["Relationship", "Director linked to Northstar Labs", "6 sec ago", "green"],
  ["Trust", "Confidence recalculated to 86%", "now", "green"],
];
const colors = [
  ["Knowledge", "#38BDF8"], ["Intelligence", "#8B5CF6"], ["Trusted", "#34D399"],
  ["Review", "#FBBF24"], ["Conflict", "#FB7185"], ["Historical", "#71717A"],
];
function Mark({ mono = false }: { mono?: boolean }) { return <Image src={mono ? "/brand/shadowscore-logo-mono.svg" : "/brand/shadowscore-logo.svg"} alt="" width={160} height={80} className={styles.mark} />; }
function Pulse() { return <span className={styles.pulse}><span /></span>; }
export default function BrandPage() {
  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Brand page navigation"><Link href="/" className={styles.wordmark}><Mark /><span>ShadowScore</span></Link><div><a href="#system">System</a><a href="#product">Product UI</a><a href="#spec">Specification</a></div><Link className={styles.open} href="/dashboard">Open platform <span>↗</span></Link></nav>

    <section className={styles.hero}>
      <div className={styles.eyebrow}><Pulse /> Brand identity, version 1.0</div>
      <div className={styles.heroGrid}><div><h1>Intelligence has<br/><em>no final state.</em></h1><p className={styles.lede}>ShadowScore turns observed evidence into connected knowledge and continuously recalculated trust.</p><div className={styles.actions}><a href="#product">Explore the system</a><a href="/brand/shadowscore-logo.svg" download>Download SVG ↓</a></div></div><div className={styles.heroMark}><div className={styles.orbit}/><Mark/><span className={styles.resolution}>RESOLUTION</span></div></div>
      <div className={styles.loop}>{stages.map(([number,title,detail],i)=><article key={title}><span>{number}</span><div><strong>{title}</strong><small>{detail}</small></div>{i < stages.length-1 && <b>→</b>}</article>)}</div>
    </section>

    <section id="system" className={styles.section}><header className={styles.sectionHead}><span>01 / Foundation</span><h2>One system. Every intelligence surface.</h2><p>Color, type, iconography, and motion share a single purpose: show how information becomes trusted knowledge.</p></header>
      <div className={styles.systemGrid}><article className={styles.logoCard}><div className={styles.cardLabel}>Primary mark</div><Mark/><h3>ShadowScore</h3><p>Evidence. Knowledge. Trust.</p><div className={styles.logoModes}><span><Mark mono/>Dark</span><span className={styles.lightMode}><Mark mono/>Light</span></div></article>
      <article className={styles.typeCard}><div className={styles.cardLabel}>Typography</div><p className={styles.displaySample}>Resolution<br/>changes trust.</p><div><span>Interface / Inter</span><b>Aa 01</b></div><div><span>Evidence / IBM Plex Mono</span><code>EV-2048</code></div></article>
      <article className={styles.colorCard}><div className={styles.cardLabel}>Semantic color</div>{colors.map(([name,color])=><div key={name}><i style={{background: color}}/><span>{name}</span><code>{color}</code></div>)}</article></div>
      <div className={styles.principles}><article><span>◌</span><h3>Observe</h3><p>Open forms indicate collection and emerging evidence.</p></article><article><span>⌁</span><h3>Connect</h3><p>Lines always describe a known relationship.</p></article><article><span>✦</span><h3>Resolve</h3><p>A solid core marks the point where identity becomes knowledge.</p></article><article><span>↻</span><h3>Continue</h3><p>Directional motion shows the next intelligence state.</p></article></div>
    </section>

    <section id="product" className={styles.product}><header className={styles.sectionHead}><span>02 / Product architecture</span><h2>A workspace that keeps thinking.</h2><p>The shell prioritizes changes, relationships, and confidence. Every state shows what changed and what happens next.</p></header>
      <div className={styles.appFrame}><aside><Mark/><div className={styles.sideDot}/><div className={styles.sideDot}/><div className={styles.sideDot}/><div className={styles.sideDot}/></aside><div className={styles.workspace}><header><div><span>INTELLIGENCE OVERVIEW</span><h3>Good morning, Maya.</h3><p><Pulse/> Knowledge updated 17 seconds ago</p></div><Link href="/intake">Start investigation +</Link></header><div className={styles.stats}><article><span>ACTIVE ENTITIES</span><b>143</b><small>+5 changed today</small></article><article><span>NEW EVIDENCE</span><b>41</b><small>across 12 subjects</small></article><article><span>TRUST SHIFTS</span><b>07</b><small>2 need review</small></article><article><span>AVG. CONFIDENCE</span><b>86%</b><small>+2.4 this week</small></article></div><div className={styles.workGrid}><Network/><article className={styles.feed}><div className={styles.panelTitle}><span>LIVE INTELLIGENCE</span><Pulse/></div>{timeline.slice(0,4).map(([type,text,time,color])=><div className={styles.feedItem} key={text}><i className={styles[color]}/><p><span>{type}</span>{text}<small>{time}</small></p></div>)}</article></div></div></div>

      <div className={styles.detailGrid}><article className={styles.subject}><div className={styles.panelTitle}><span>SUBJECT / NORTHSTAR LABS</span><b>Monitoring continuously</b></div><div className={styles.subjectTop}><div className={styles.entityIcon}>NL</div><div><h3>Northstar Labs Ltd.</h3><p>Company · United Kingdom · Active</p></div><div className={styles.score}><strong>86</strong><span>TRUST</span></div></div><Network compact/><div className={styles.legend}><span>● Company</span><span>● Brand</span><span>● Domain</span><span>● Person</span></div></article>
      <article className={styles.timeline}><div className={styles.panelTitle}><span>INTELLIGENCE TIMELINE</span><b>Live</b></div>{timeline.map(([type,text,time,color])=><div className={styles.timelineItem} key={text}><i className={styles[color]}/><p><span>{type}</span><strong>{text}</strong><small>{time}</small></p></div>)}</article></div>
    </section>

    <section id="spec" className={styles.spec}><header className={styles.sectionHead}><span>03 / Figma-ready specification</span><h2>Built from reusable decisions.</h2></header><div className={styles.specGrid}><article><span>SPACING</span><b>4 · 8 · 12 · 16 · 24 · 32 · 48 · 64</b><p>Base unit: 4px</p></article><article><span>RADIUS</span><b>8 · 12 · 16 · 24 · Full</b><p>Panels use 16px. Controls use 10px.</p></article><article><span>GRID</span><b>12 columns · 24px gutter</b><p>Desktop 1440. Tablet 768. Mobile 390.</p></article><article><span>MOTION</span><b>160 · 240 · 600ms</b><p>Enter, resolve, recalculate. Reduced motion is supported.</p></article></div><div className={styles.mobile}><div><span>MOBILE ADAPTATION</span><h3>Intelligence stays legible at every scale.</h3><p>Navigation condenses. Networks become focused views. Timelines retain sequence and source context.</p></div><div className={styles.phone}><div className={styles.phoneBar}><Mark/><i/></div><span>LIVE SUBJECT</span><h4>Northstar Labs</h4><p><Pulse/> Updated 17 sec ago</p><div className={styles.mobileScore}><strong>86</strong><span>Trust confidence<br/><b>+3.2 today</b></span></div>{timeline.slice(0,3).map(([type,text,,color])=><div className={styles.mobileEvent} key={text}><i className={styles[color]}/><p><span>{type}</span>{text}</p></div>)}</div></div>
    </section>
    <footer className={styles.footer}><div className={styles.wordmark}><Mark/><span>ShadowScore</span></div><p>Evidence. Knowledge. Trust.</p><span>Brand system 1.0 · July 2026</span></footer>
  </main>;
}
function Network({ compact=false }: { compact?: boolean }) { return <article className={`${styles.network} ${compact ? styles.compact : ""}`}><div className={styles.panelTitle}><span>LIVING RELATIONSHIP GRAPH</span><b><Pulse/> 12 sources active</b></div><svg viewBox="0 0 620 260" aria-label="Relationships between Northstar Labs and connected entities"><g className={styles.edges}><path d="M308 130L125 62M308 130L496 55M308 130L510 198M308 130L124 207"/><path className={styles.activeEdge} d="M308 130L496 55"/></g><g className={styles.nodes}><circle cx="125" cy="62" r="24"/><circle cx="496" cy="55" r="20"/><circle cx="510" cy="198" r="18"/><circle cx="124" cy="207" r="18"/><circle className={styles.coreNode} cx="308" cy="130" r="38"/></g><g className={styles.nodeText}><text x="308" y="127">NORTHSTAR</text><text x="308" y="143">86% TRUST</text><text x="125" y="99">Director</text><text x="496" y="91">northstar.io</text><text x="510" y="230">Brand</text><text x="124" y="239">Address</text></g></svg></article> }
