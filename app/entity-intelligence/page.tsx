import type { Metadata } from "next";
import { demoDecisions, demoEntities, demoMetrics, demoObservations } from "@/lib/entityIntelligence";
import styles from "./entity-intelligence.module.css";

export const metadata:Metadata={title:"Entity Intelligence | ShadowScore",description:"Review entity resolution decisions, evidence, relationships, and resolver performance."};
const percent=(value:number)=>`${Math.round(value*100)}%`;
const primary=demoDecisions[0], left=demoEntities.find(entity=>entity.entityId===primary.leftEntityId)!, right=demoEntities.find(entity=>entity.entityId===primary.rightEntityId)!;

export default function EntityIntelligencePage(){return <main className={styles.shell}>
  <header className={styles.header}><div><p className={styles.eyebrow}>ENTITY INTELLIGENCE / RESOLVER 1.0</p><h1>Identity resolution workspace</h1><p>Compare candidate entities, inspect source evidence, and record reversible decisions.</p></div><div className={styles.live}><span/>Resolver online</div></header>
  <section className={styles.metrics} aria-label="Resolver performance">
    {[['Precision',demoMetrics.precision],['Recall',demoMetrics.recall],['F1',demoMetrics.f1],['False merges',demoMetrics.falseMergeRate],['Abstention',demoMetrics.abstentionRate],['Review rate',demoMetrics.reviewRate]].map(([label,value])=><article key={String(label)}><span>{label}</span><strong>{percent(Number(value))}</strong></article>)}
  </section>
  <div className={styles.toolbar}><label><span>Entity search</span><input placeholder="Name, domain, registration ID" defaultValue="Atlas" /></label><button type="button">Search entities</button><span>{demoEntities.length} entities indexed</span></div>
  <div className={styles.grid}>
    <aside className={styles.queue}><div className={styles.sectionTitle}><div><span>REVIEW QUEUE</span><h2>Candidate matches</h2></div><b>2</b></div>{demoDecisions.map((decision,index)=><article className={index===0?styles.selected:""} key={decision.decisionId}><div><span className={styles.outcome}>{decision.outcome.replace('_',' ')}</span><time>{decision.decidedAt.slice(11,16)}</time></div><h3>{demoEntities.find(e=>e.entityId===decision.leftEntityId)?.canonicalName}</h3><p>vs. {demoEntities.find(e=>e.entityId===decision.rightEntityId)?.canonicalName}</p><footer><span>{percent(decision.confidence)} confidence</span><span>{decision.matchedAttributes.length} matches</span></footer></article>)}</aside>
    <section className={styles.workspace}>
      <div className={styles.decisionHeader}><div><span>RESOLUTION DECISION</span><h2>{primary.outcome}</h2></div><div className={styles.confidence}><strong>{percent(primary.confidence)}</strong><span>confidence</span></div></div>
      <div className={styles.compare}>{[left,right].map((entity,index)=><article key={entity.entityId}><span className={styles.side}>{index===0?'CANONICAL ENTITY':'CANDIDATE'}</span><h3>{entity.canonicalName}</h3><p>{entity.aliases.join(' · ')}</p><dl><div><dt>Registration</dt><dd>{entity.registrationIdentifiers[0]}</dd></div><div><dt>Domain</dt><dd>{entity.domains[0]}</dd></div><div><dt>Address</dt><dd>{entity.addresses[0]}</dd></div><div><dt>Director</dt><dd>{entity.peopleAndDirectors[0]}</dd></div></dl></article>)}</div>
      <div className={styles.reason}><span>DECISION REASON</span><p>{primary.reason}</p><small>{primary.method.replaceAll('_',' ')} · {primary.policyVersion}</small></div>
      <div className={styles.featureTable}><div className={styles.sectionTitle}><div><span>EXPLAINABILITY</span><h2>Feature comparison</h2></div></div>{primary.matchedAttributes.map(feature=><div className={styles.feature} key={feature.attribute}><span className={styles.check}>✓</span><div><strong>{feature.attribute.replace('_',' ')}</strong><small>{feature.left} = {feature.right}</small></div><b>{percent(feature.similarity)}</b></div>)}</div>
      <div className={styles.actions}><button>Approve merge</button><button>Reject merge</button><button>Split entity</button><button>Override with reason</button></div>
    </section>
    <aside className={styles.context}>
      <section><div className={styles.sectionTitle}><div><span>IDENTITY GRAPH</span><h2>Relationships</h2></div></div><div className={styles.graph}><div className={styles.nodeMain}>Atlas<br/><small>Commerce</small></div><div className={`${styles.node} ${styles.nodeA}`}>Marketplace</div><div className={`${styles.node} ${styles.nodeB}`}>atlas.co.il</div><div className={`${styles.node} ${styles.nodeC}`}>Noa Levi</div><i className={styles.lineA}/><i className={styles.lineB}/><i className={styles.lineC}/></div></section>
      <section><div className={styles.sectionTitle}><div><span>PROVENANCE</span><h2>Evidence timeline</h2></div></div><ol className={styles.timeline}>{demoObservations.slice(0,4).map(observation=><li key={observation.observationId}><i/><div><strong>{observation.source}</strong><p>{observation.observedValue}</p><small>{percent(observation.reliability)} source reliability</small></div></li>)}</ol></section>
      <section className={styles.audit}><span>AUDIT STATUS</span><strong>Append-only history active</strong><p>Every decision can be superseded. Source observations remain unchanged.</p></section>
    </aside>
  </div>
</main>}
