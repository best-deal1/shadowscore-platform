import { buildVerificationDecision } from "./model";
import { loadReferenceProviderSnapshots, referenceProviderSnapshot } from "./snapshots";

export const verificationDecisionFixtures = Object.fromEntries(
  Object.entries(loadReferenceProviderSnapshots().fixtureOutputs).map(([id, fixture]) => [
    id,
    { label: fixture.label, providerResults: referenceProviderSnapshot(fixture.snapshot) },
  ]),
);

export const verificationDecisionFixtureOutputs = Object.fromEntries(
  Object.entries(loadReferenceProviderSnapshots().fixtureOutputs).map(([id, fixture]) => [
    id,
    { label: fixture.label, output: buildVerificationDecision({ providerResults: referenceProviderSnapshot(fixture.snapshot), audience: "free" }) },
  ]),
);
