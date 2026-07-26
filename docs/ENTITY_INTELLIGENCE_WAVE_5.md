# Wave 5: Entity Intelligence

Status: product and engineering charter  
Audience: product, platform, data, security, compliance, collector, and analyst teams  
Product horizon: ShadowScore Vision 2030

## Vision 2030: Infinity Engine

ShadowScore is an Infinite Intelligence Platform. Its purpose is to continuously transform observations into trusted knowledge.

The platform operates as a continuous intelligence loop:

```text
∞ Observe
    ↓
∞ Collect
    ↓
∞ Evidence
    ↓
∞ Knowledge
    ↓
∞ Trust
    ↓
∞ Decision
    ↓
∞ Monitor
    ↓
∞ Learn
    ↺
```

Each iteration improves the next one. Observations, decisions, and corrections remain available as versioned evidence. Derived knowledge can change without erasing its history. Every conclusion remains explainable from its inputs, policy, and method.

ShadowScore is evolving from Website Intelligence into Continuous Intelligence. Its long-term role is to provide trust infrastructure for the internet.

## Product principles

### Knowledge evolves

Knowledge is provisional and trust changes over time. A decision creates evidence that can inform later collection, resolution, monitoring, and review.

Every platform object participates in the loop:

```text
Subject
   ↓
Collector
   ↓
Evidence
   ↓
Knowledge
   ↓
Trust
   ↓
Decision
   ↓
Monitoring
   ↓
Evidence
```

A current state is a time-bound projection, not a terminal record.

### The interface represents a living system

Product surfaces should show that intelligence changes. They should make these states visible:

- live collection and monitoring status
- changes to facts and confidence
- newly discovered and disputed relationships
- the timeline of evidence, resolutions, and decisions
- the reason for each conclusion and the evidence that supports it

Reports and exports present the platform's current understanding. The product's primary operating model is the continuous intelligence loop.

### Trust answers are explainable

When a user or system asks, `Can I trust this entity?`, ShadowScore should return more than a binary result. The answer should include:

- the conclusion and its scope
- the supporting and conflicting evidence
- the confidence and its components
- what changed since the prior conclusion
- the conditions that could change the conclusion

## Infinity Engine architecture

Everything built from Wave 1 onward is part of the Infinity Engine:

```text
∞ Infinity Engine

├── Subject Engine
├── Investigation Engine
├── Collector Runtime
├── Evidence Engine
├── Knowledge Engine
├── Relationship Engine
├── Intelligence Engine
├── Trust Engine
├── Decision Engine
├── Monitoring Engine
└── AI Analyst
```

Each module must consume and produce versioned platform objects through the loop. Modules must preserve provenance, policy context, temporal meaning, and reproducibility. A module must not create a parallel path that bypasses evidence or audit history.

The Infinity Engine symbol represents continuous intelligence, trust, learning, connected entities, explainable knowledge, and ongoing improvement. Its intersection represents resolution, where evidence becomes knowledge and knowledge can support trust decisions. Flowing particles represent observations moving through the system.

## Wave 5 mission

Wave 5 establishes Entity Intelligence as the central capability of ShadowScore:

> Given fragmented evidence from multiple sources, determine whether those observations belong to the same real-world entity.

Entity resolution is the foundation for trust scores, analysis, monitoring, and future intelligence capabilities. Those layers are reliable only when the platform can connect observations consistently, explain the connection, and reproduce it later.

## Required outcome

For any proposed match, Wave 5 must produce a versioned resolution decision that answers:

1. Which observations and subjects were evaluated?
2. Which identity features supported or opposed the match?
3. Which normalization, rule, model, threshold, and policy versions were used?
4. What confidence was assigned, and how was it calculated?
5. Was the result linked, rejected, deferred, or sent for review?
6. Who or what made and reviewed the decision?
7. How can the same result be reproduced from the recorded inputs?
8. How can a later decision supersede or correct it while preserving history?

## Resolution principles

1. **Observations are immutable.** Resolution adds decisions and links. It does not rewrite source evidence.
2. **Identity confidence is distinct.** It is separate from source reliability, evidence confidence, relationship confidence, and trust.
3. **Contradictions are first-class inputs.** Conflicting verified identifiers can block a match and must remain visible.
4. **Abstention is a valid result.** Insufficient evidence produces a deferred or review result instead of a forced match.
5. **Policies are explicit.** Match rules, thresholds, auto-link permissions, review requirements, and data use controls are versioned by subject and identifier type.
6. **Decisions are reversible through history.** Corrections supersede prior decisions and preserve the original inputs and rationale.
7. **Tenant and sensitivity boundaries apply before matching.** Cross-workspace and regulated-identifier use requires an explicit policy basis.
8. **Deterministic methods lead.** Exact, policy-approved identifiers should resolve before probabilistic features. Weak signals must not silently override verified conflicts.
9. **Human review is auditable.** Review actions record the actor, reason, evidence set, and timestamp.
10. **Downstream consumers use resolved projections.** Trust, decisions, monitoring, and analysis consume a current projection while retaining access to its resolution history.

## Wave 5 scope

Wave 5 should deliver:

- a canonical resolution-decision contract and append-only persistence model
- candidate generation from policy-approved normalized identifiers and features
- deterministic and probabilistic match evaluation behind versioned strategies
- type-specific thresholds for auto-link, review, rejection, and abstention
- verified-identifier conflict detection and blocking rules
- an analyst review queue with accept, reject, defer, dispute, and correction actions
- merge and link history with a rebuildable current identity projection
- explanation output that cites the contributing observations and feature weights or rules
- replay tooling that reproduces a decision with the original evidence and versions
- evaluation datasets covering positive pairs, hard negatives, conflicts, sparse evidence, and temporal change
- monitoring events when new evidence may change an existing resolution

## Acceptance criteria

Wave 5 is complete when the platform can demonstrate that:

- the same evidence and strategy versions reproduce the same resolution decision
- every resolved identity traces to immutable observations and an explicit policy decision
- conflicting verified identifiers prevent automatic consolidation under the configured policy
- low-confidence and ambiguous cases enter review or abstain
- a reviewer can correct a resolution without deleting or mutating its history
- current identity projections can be rebuilt entirely from append-only records
- workspace, purpose, jurisdiction, and sensitivity controls apply to candidate generation and evaluation
- downstream modules receive stable subject references and resolution-change events
- benchmark results report precision, recall, false-merge rate, false-split rate, abstention rate, review rate, and calibration by subject type
- release gates prioritize false-merge risk and publish the threshold and dataset version used for evaluation

## Product success measure

The primary measure is the quality of continuously improving understanding. Report volume is a delivery metric.

Wave 5 succeeds when fragmented observations can be joined into real-world entities with consistent outcomes, visible uncertainty, complete provenance, and reproducible decisions. This capability allows every later trust answer to explain why it applies to that entity, which evidence supports it, what changed, and what could change next.
