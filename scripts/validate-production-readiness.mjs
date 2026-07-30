import assert from "node:assert/strict";
import { assertProductionConfiguration, productionConfigurationIssues, productionRequirements } from "../lib/productionReadiness.ts";

assert.equal(productionRequirements.length, 6);
assert.deepEqual(productionRequirements.map(({ key }) => key), [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "INVESTIGATION_WORKER_SECRET",
  "PAYPAL_PDT_IDENTITY_TOKEN",
  "PAYMENT_CALLBACK_SECRET",
]);

const fixture = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(32),
  SUPABASE_SERVICE_ROLE_KEY: "s".repeat(32),
  INVESTIGATION_WORKER_SECRET: "w".repeat(32),
  PAYPAL_PDT_IDENTITY_TOKEN: "p".repeat(16),
  PAYMENT_CALLBACK_SECRET: "c".repeat(32),
};

assert.deepEqual(productionConfigurationIssues(fixture), []);
assert.throws(() => assertProductionConfiguration({ ...fixture, PAYMENT_CALLBACK_SECRET: "short" }), /PAYMENT_CALLBACK_SECRET/);

if (process.argv.includes("--environment")) assertProductionConfiguration(process.env);
console.log(process.argv.includes("--environment") ? "Production environment validated." : "Production readiness contract validated.");
