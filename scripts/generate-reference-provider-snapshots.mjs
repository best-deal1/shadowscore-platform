import { writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");

const outDir = join(tmpdir(), "shadowscore-snapshot-generator");
execFileSync(process.execPath, [tscPath, "lib/providers/ProviderManager.ts", "lib/providers/BaseProvider.ts", "lib/providers/types.ts", "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--esModuleInterop", "--skipLibCheck", "--moduleResolution", "node", "--noEmit", "false"], { stdio: "inherit" });
const { ProviderManager } = require(join(outDir, "providers", "ProviderManager.js"));
const { BaseProvider } = require(join(outDir, "providers", "BaseProvider.js"));

const NOW = "2026-07-11T00:00:00.000Z";
class CapturedProvider extends BaseProvider {
  constructor(def) { super(); Object.assign(this, def); this.def = def; }
  async collect() { if (this.def.throwError) throw new Error(this.def.throwError); return { findings: this.def.findings || [], evidence: this.def.evidence || [], metadata: this.def.metadata || { integrationStatus: "connected", lookupPerformed: true } }; }
}
const ev = (id, type, label, value, source = "reference-capture") => ({ id, type, label, value, source });
const provider = (id, { records = {}, evidence = [], findings = [], metadata = {}, throwError } = {}) => ({ id, name: `${id} Provider`, version: "reference-snapshot-v1", category: "validation", findings, evidence: evidence.length ? evidence : Object.entries(records).map(([type, values]) => ev(`${id}-${type}`, "configuration", `${type} record`, values.join(", "))), metadata: { integrationStatus: "connected", lookupPerformed: true, records, registrationDate: id === "whois" ? "2015-01-01" : undefined, ageDays: id === "whois" ? 4200 : undefined, ...metadata }, throwError });
async function run(defs) { const manager = new ProviderManager(); defs.forEach((d) => manager.register(new CapturedProvider(d))); return sanitize(await manager.runProviders({ target: "reference.example", scanMode: "validation" })); }
function sanitize(results) { return results.map((r) => ({ ...r, startedAt: NOW, completedAt: NOW, duration: 0 })).sort((a, b) => a.providerId.localeCompare(b.providerId)); }
const dns = (domain, txt = []) => provider("dns", { records: { A: ["203.0.113.10"], NS: ["ns1.test"], MX: ["mail.test"], TXT: txt, AAAA: [], CNAME: [] }, evidence: [ev("dns-domain", "observation", "Normalized domain", domain, "node:dns"), ev("dns-a-records", "observation", "A records", "203.0.113.10", "node:dns"), ev("dns-aaaa-records", "observation", "AAAA records", "unavailable", "node:dns"), ev("dns-cname-records", "observation", "CNAME records", "unavailable", "node:dns")] });
const whois = () => provider("whois", { evidence: [ev("whois-created", "document", "WHOIS creation date", "2015-01-01", "rdap")], metadata: { registrationDate: "2015-01-01", ageDays: 4200 } });
const profile = (domain, name) => provider("business-profile", { evidence: [ev("profile-domain", "observation", "Business website domain", domain, `https://${domain}`), ev("profile-organization", "document", "Business name", name, `https://${domain}`)] });
const reputation = () => provider("reputation", { evidence: [ev("reputation-signal", "placeholder", "Reputation source not checked", "Not Checked", "local-reputation-abstraction")], metadata: { integrationStatus: "not_connected", lookupPerformed: false, abstraction: true } });
const snapshots = {
  "strong-business": await run([provider("dns", { records: { A: ["203.0.113.10"], NS: ["ns1.example.com"], MX: ["mail.example.com"], TXT: ["v=spf1 include:_spf.example.com -all", "v=DMARC1; p=reject"] } }), provider("whois"), provider("reputation")]),
  "new-business": await run([provider("dns", { records: { A: ["203.0.113.70"] } }), provider("whois")]),
  "provider-failure": await run([provider("dns", { throwError: "provider unavailable" })]),
  "missing-ownership": await run([provider("dns", { records: { A: ["203.0.113.80"], NS: ["ns1.host.test"] } }), provider("whois")]),
  "known-enforcement": await run([provider("marketplace", { findings: [{ id: "known-enforcement", title: "Known enforcement action", description: "Verified marketplace enforcement notice was supplied.", severity: "high" }] })]),
  "negative-evidence": await run([provider("reputation", { findings: [{ id: "confirmed-fraud", title: "Confirmed fraud evidence", description: "Confirmed fraud signal from reputation evidence.", severity: "critical" }] })]),
  "ksp": await run([provider("dns", { records: { A: ["203.0.113.20"], NS: ["ns1.host.test"], MX: ["mail.host.test"], TXT: ["v=spf1 include:host.test ~all"] } }), provider("whois")]),
  "c-data": await run([provider("dns", { records: { A: ["203.0.113.30"], NS: ["ns1.host.test"] } }), provider("reputation")]),
  "gadget-deals": await run([provider("dns", { records: { A: ["203.0.113.40"], MX: ["mail.host.test"] } })]),
  "new-domain": await run([provider("dns", { records: { A: ["203.0.113.50"] } }), provider("whois")]),
  "missing-data-only": [],
  "known-phishing-domain": await run([provider("dns", { records: { A: ["203.0.113.60"] }, findings: [{ id: "known-phishing", title: "Known phishing infrastructure", description: "Verified phishing signal from reputation evidence.", severity: "critical" }] })]),
  "known-malicious-domain": await run([provider("reputation", { findings: [{ id: "known-malicious", title: "Known malicious infrastructure", description: "Confirmed malicious infrastructure reputation issue.", severity: "high" }] })]),
  "marketplace-seller": await run([provider("dns", { records: { A: ["203.0.113.50"], NS: ["ns1.market.test"], MX: ["mail.market.test"], TXT: ["v=spf1 include:market.test -all"] } }), provider("marketplace", { records: { Seller: ["verified seller profile"] } })]),
  "email-only-input": await run([provider("dns", { records: { MX: ["mail.email.test"], TXT: ["v=spf1 include:email.test ~all"] } })]),
  "integrity-stripe": await run([dns("stripe.com", ["v=spf1 include:test -all"]), whois(), profile("stripe.com", "Stripe"), reputation()]),
  "integrity-ynet": await run([dns("ynet.co.il", ["v=spf1 include:test -all"]), whois(), profile("ynet.co.il", "Ynet"), reputation()]),
  "integrity-bankhapoalim": await run([dns("bankhapoalim.co.il", ["v=spf1 include:test -all"]), whois(), profile("bankhapoalim.co.il", "Bank Hapoalim"), reputation()]),
  "integrity-gadgetdeals": await run([dns("gadgetdeals.co.il", ["v=spf1 include:test -all"]), whois(), profile("gadgetdeals.co.il", "Gadget Deals"), reputation()]),
  "integrity-negative-marketplace": await run([profile("market.example", "Example LLC"), provider("marketplace", { evidence: [ev("seller", "document", "Marketplace seller identity", "Different Seller", "explicit-marketplace-evidence")] })]),
  "integrity-missing-dmarc": await run([dns("missing-dmarc.example", ["v=spf1 include:test -all"]), provider("dmarc", { evidence: [ev("dmarc-record", "configuration", "DMARC record", "unavailable", "node:dns")], findings: [{ id: "dmarc-missing", title: "DMARC record missing", description: "No DMARC", severity: "medium" }] })]),
};
const path = "lib/decisionEngine/referenceProviderSnapshots.json";
const doc = JSON.parse(readFileSync(path, "utf8"));
doc.snapshots = snapshots;
writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
