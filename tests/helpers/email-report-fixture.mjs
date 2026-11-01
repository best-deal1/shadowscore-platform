import { buildReadyReport } from "../../lib/reportPipeline.ts";
import { normalizeIdentitySignals } from "../../lib/personalIdentity.ts";
import { presentReportForEndUser } from "../../lib/workspace.ts";

export const fixtureEmail = "dana.example421@gmail.com";
export const fixtureSource = "https://linkedin.com/in/dana-example";
export const fixtureSnippet = `Dana Example. Product manager at Example Labs. Contact ${fixtureEmail}. Public professional profile.`;

// Real provider, resolver, pipeline, and customer presentation with an isolated
// search transport. No real person's data, credentials, payment, or network.
export async function emailReportFixture({ scenario = "found" } = {}) {
  const environment = {
    BRAVE_SEARCH_API_KEY: scenario === "unavailable" ? undefined : "fixture-key",
    NEXT_PUBLIC_PERSONAL_IDENTITY_ENABLED: "true",
    PERSONAL_IDENTITY_ENABLED: "true",
    IDENTITY_MIGRATION_APPLIED: "true",
    IDENTITY_EVIDENCE_BUCKET_READY: "true",
    IDENTITY_STORAGE_POLICIES_VERIFIED: "true",
  };
  const previous = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const queries = [];
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.origin !== "https://api.search.brave.com") throw new Error(`Unexpected fixture request: ${url.origin}`);
    const query = url.searchParams.get("q") || "";
    queries.push(query);
    if (scenario === "partial" && queries.length > 1) return new Response("", { status: 429 });
    if (scenario === "timeout" && queries.length > 1) throw new DOMException("Fixture request timed out", "AbortError");
    if (scenario === "first_failure") return new Response("", { status: 503 });
    if (scenario === "multi_hop") return Response.json({ web: { results: query === `"${fixtureEmail}"` ? [{
      title: "Dana Example | Professional directory", url: "https://directory.example/people/dana-example",
      description: `${fixtureEmail}. Known as Dana River. Instagram: @dana.river.`,
    }] : query.includes('"dana.river"') ? [{
      title: "Dana River (@dana.river) | Instagram", url: "https://instagram.com/dana.river",
      description: "Dana River, public creative profile.",
    }] : [] } });
    return Response.json({ web: { results: scenario !== "empty" && query === `"${fixtureEmail}"` ? [{
      title: "Dana Example | LinkedIn", url: fixtureSource, description: fixtureSnippet,
    }] : [] } });
  };
  try {
    const intake = {
      intakeId: `fixture-identity-${scenario}`, userId: "fixture-report-user", scanMode: "personal",
      target: fixtureEmail, platform: "Personal Identity", email: "buyer@example.invalid",
      identitySignals: normalizeIdentitySignals({ emails: [fixtureEmail] }),
      fileNames: [], visibleSignalCategories: [], paymentStatus: "paid", reportStatus: "generating",
      createdAt: "2026-11-01T00:00:00.000Z",
    };
    const paymentIntent = {
      id: `fixture-payment-${scenario}`, userId: intake.userId, intakeId: intake.intakeId,
      planId: "fixture", planName: "Personal Identity Investigation", price: "$9.90", currency: "USD",
      status: "paid", paymentStatus: "paid", acceptanceId: "fixture-acceptance", createdAt: intake.createdAt,
    };
    const stored = await buildReadyReport({ intake, paymentIntent, reportId: `fixture-report-${scenario}`, createdAt: intake.createdAt });
    return { stored, customer: presentReportForEndUser(stored), queries };
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}
