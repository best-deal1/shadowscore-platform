# Identity Evidence Architecture Sprint

## Current heuristic dependencies

| Area | Current behavior | Evidence quality |
| --- | --- | --- |
| Organization display name | Uses verified legal/business/profile names only. If no organization evidence exists, the identity label is `Unknown`; hostnames are retained only as identifiers. | Corroborated when backed by registry, profile, structured metadata, regulatory, marketplace or relationship evidence. |
| Regulated financial institution | Keyword match on verified `LICENSED_BY` relationship category or authority label (`bank`, `financial`, `finance`, `credit`). | Partly heuristic: requires a verified relationship, but classification label still depends on keywords. |
| Public company | Presence of verified `LISTED_ON` relationship. | Corroborated relationship evidence; no keyword classification. |
| Brand / alias | Explicit brand, seller, store or alias fields. | Provider assertion; stronger when multiple providers point to the same canonical organization. |
| Domain / email / phone / marketplace account | Explicit identifier relationship to canonical organization. | Attribute-level confidence, with higher confidence when multiple independent providers support the same attribute. |

## Evidence Confidence vs Identity Confidence

Identity confidence remains the resolver-level summary used by product surfaces. Evidence confidence is now emitted per attribute under `attributeConfidence`/`evidenceConfidence` so a legal name, domain, email, phone or marketplace account can be `High`, `Medium`, `Low` or `Unknown` independently of the overall identity.

## Cross-provider correlation

Attribute confidence records independent sources and `corroboratedByIndependentProviders`. A domain supported by both an official registry and a public profile is stronger than a domain observed only in website metadata, without changing PASS / REVIEW / CONFIRMED RISK thresholds.

## Future Entity Graph layer proposal

1. **Canonical Entity Node**: durable entity IDs for legal entities, organizations, brands, people/owners, domains, certificates, marketplace accounts, registries and authorities.
2. **Evidence Ingestion Layer**: normalize DNS, SSL, Business Profile, Marketplace, Registry and Relationship providers into signed evidence atoms with timestamps, source, jurisdiction and extraction method.
3. **Relationship Ledger**: store typed edges (`USES_DOMAIN`, `PRESENTS_CERTIFICATE`, `REGISTERED_WITH`, `LICENSED_BY`, `OPERATES_ACCOUNT`, `OWNED_BY`, `REPRESENTS`) with independent provenance and expiry.
4. **Correlation Engine**: promote attribute confidence when independent provider families converge, and downgrade when conflicts are unresolved.
5. **Policy Boundary**: keep trust decisions and thresholds outside the graph. The graph explains evidence quality; the decision engine consumes graph facts without changing policy.
6. **Human Review Hooks**: expose unresolved conflicts, heuristic classifications and missing corroboration for analyst review before any future policy changes.

## Truth Dataset expectation

The expected improvement is better identity understanding: fewer hostname-derived organization names, clearer unknown states and per-attribute confidence/corroboration metadata. Trust policy remains unchanged.
