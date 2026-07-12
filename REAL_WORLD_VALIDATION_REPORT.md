# Real-World Validation Sprint Report

Date: 2026-07-12

## Root causes

1. **Business profile contradictions were over-broad.** Missing ownership, consumer email usage, and active-domain-without-business-identity were being stored as contradiction signals even though they are verification limitations, not factual conflicts.
2. **Verification gaps were generic.** Business name, country, registry, domain ownership, public profile, and email authentication gaps were emitted without checking whether they were material for the inferred entity class.
3. **Identity completeness ignored evidence payloads.** Public business profile evidence with labels such as `Business name`, `Business profile title`, seller, or store evidence did not always populate the canonical business name unless metadata also contained the name.
4. **Correlation relationships were too generic.** Business-registry and phone-to-business missing relationships were emitted for ordinary website investigations even when no registry or phone relationship was material.
5. **Narrative contradiction wording depended on blocking issues.** A REVIEW/FAIL blocking issue could cause the narrative to say `Inconsistent information was found` even when no Correlation Engine or Identity Resolution contradiction existed.

## Validation before

| Target | Before decision | Before issue |
| --- | --- | --- |
| Microsoft | PASS | Generic identity/profile gaps could still appear from fixture evidence without a public profile provider. |
| Stripe | PASS | Correctly reached PASS. |
| Leumi | REVIEW | REVIEW is acceptable while authoritative institutional evidence is unavailable. |
| Bank Hapoalim | REVIEW in real-world run | REVIEW is acceptable while authoritative institutional evidence is unavailable. The local fixture has stronger profile evidence and may reach PASS. |
| GadgetDeals | REVIEW | Incorrect contradiction wording appeared even though no contradiction existed. |
| Barina | REVIEW | Generic missing business identity gaps appeared even when only web infrastructure was evidenced. |
| AllInCell | REVIEW | Generic missing business identity gaps appeared even when only web infrastructure was evidenced. |

## Validation after

| Target | Entity class | Verified identity | Verification gaps | Contradictions | Decision | Reasoning summary |
| --- | --- | --- | --- | --- | --- | --- |
| Microsoft | Online business | Insufficient Public Evidence in the reference fixture | Business name evidence is missing; Public business profile evidence is missing | None | PASS | Strong DNS, mail, TXT, WHOIS/reputation fixture coverage still satisfies the existing PASS policy; limitations remain documented because the fixture lacks a business-profile provider. |
| Stripe | Small business | Stripe | None | None | PASS | Public profile evidence identifies the organization and DNS/WHOIS/email signals support the existing PASS threshold. |
| Leumi | Regulated bank | Insufficient Public Evidence in the reference fixture | Business name, country, public profile, email authentication, and authoritative registry/regulator evidence are missing | None | REVIEW | Regulated-bank classification makes institutional evidence material; missing authoritative evidence remains a review limitation, not a confirmed risk. |
| Bank Hapoalim | Regulated bank | Bank Hapoalim | Business country evidence is missing | None | PASS in local fixture; REVIEW remains acceptable in real-world run without institutional evidence | Local fixture includes public profile and WHOIS/DNS evidence, so it can pass under unchanged policy; real-world absence of authoritative regulator evidence is documented as an intentional limitation. |
| GadgetDeals | Small business | Gadget Deals | None in the enriched local fixture | None | PASS in enriched fixture; REVIEW remains acceptable for partial real-world evidence | Public business profile evidence now completes the business name; the narrative uses neutral wording because no contradiction exists. |
| Barina | Online business | Insufficient Public Evidence | Business name, domain registration/ownership, public business profile, and email authentication evidence are missing | None | REVIEW | Only infrastructure-level evidence is available; missing evidence stays REVIEW and no contradiction wording is emitted. |
| AllInCell | Online business | Insufficient Public Evidence | Business name, domain registration/ownership, public business profile, and email authentication evidence are missing | None | REVIEW | Partial infrastructure evidence is not enough for PASS; missing evidence remains neutral and non-risk. |

## Intentional limitations

- This sprint does **not** add providers or new intelligence engines, so regulated-bank authority checks remain limited to evidence already collected.
- The PASS / REVIEW / CONFIRMED RISK policy is unchanged. Entity-aware gaps affect which limitations are shown; they do not create enterprise allowlists or hardcoded company exceptions.
- Some local reference fixtures are stronger than the real-world run because they contain captured public profile evidence. Where real-world authoritative institutional evidence is absent, REVIEW remains acceptable.
