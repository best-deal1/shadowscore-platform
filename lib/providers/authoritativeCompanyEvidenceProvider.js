const SEC_COMPANY_TICKERS_EXCHANGE_URL = "https://www.sec.gov/files/company_tickers_exchange.json";
const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK";
const SEC_HEADERS = { "user-agent": "ShadowScore evidence provider contact@shadowscore.io", accept: "application/json" };

function normalizeTicker(value) { return String(value || "").trim().replace(/^ticker:/i, "").toUpperCase(); }
function normalizeCik(value) { const raw = String(value || "").trim().replace(/^cik:/i, "").replace(/^0+/, ""); return /^\d+$/.test(raw) ? raw.padStart(10, "0") : ""; }
function normalizeDomain(value) { return String(value || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#:]/)[0].replace(/\.$/, ""); }
function publicCompanyTarget(context) {
  const raw = String(context?.target || "").trim();
  const tickerMatch = raw.match(/^(?:ticker:)?([A-Z.\-]{1,8})$/i);
  const cikMatch = raw.match(/^(?:cik:)?(\d{1,10})$/i);
  if (cikMatch) return { cik: normalizeCik(cikMatch[1]), supported: true };
  if (tickerMatch && !raw.includes(".")) return { ticker: normalizeTicker(tickerMatch[1]), supported: true };
  const domain = normalizeDomain(raw);
  if (domain && domain.includes(".")) return { domain, supported: true };
  return { supported: false, reason: "Not Supported" };
}
async function fetchSecJson(url) {
  const response = await fetch(url, { headers: SEC_HEADERS });
  if (!response.ok) throw new Error(`SEC authoritative company lookup failed: ${response.status}`);
  return await response.json();
}

class AuthoritativeCompanyEvidenceProvider {
  constructor() { this.id = "authoritative-company"; this.name = "Authoritative Company Evidence Provider"; this.version = "1.0.0"; this.category = "business_profile"; }
  async execute(context) {
    const startedAtDate = new Date(); const startedAt = startedAtDate.toISOString();
    try {
      const collected = await this.collect(context); const completedAtDate = new Date();
      return { providerId: this.id, providerVersion: this.version, status: "completed", startedAt, completedAt: completedAtDate.toISOString(), duration: completedAtDate.getTime() - startedAtDate.getTime(), findings: collected.findings, evidence: collected.evidence, metadata: { category: this.category, providerName: this.name, ...collected.metadata }, errors: [] };
    } catch (error) {
      const completedAtDate = new Date();
      return { providerId: this.id, providerVersion: this.version, status: "skipped", startedAt, completedAt: completedAtDate.toISOString(), duration: completedAtDate.getTime() - startedAtDate.getTime(), findings: [], evidence: [{ id: `${this.id}-unavailable`, type: "observation", label: `${this.name} availability`, value: /ticker|CIK|domain/i.test(error?.message || "") ? "Not Supported" : "Unavailable", source: this.id }], metadata: { category: this.category, providerName: this.name, lookupPerformed: false }, errors: [error instanceof Error ? error.message : "Unknown provider execution error"] };
    }
  }
  async collect(context) {
    const target = publicCompanyTarget(context); if (!target.supported) throw new Error("Authoritative public-company lookup requires a ticker or CIK; domains, page titles and SSL certificates are not legal-identity sources.");
    const dataset = await fetchSecJson(SEC_COMPANY_TICKERS_EXCHANGE_URL);
    let row = dataset.data.find(([cik, , ticker]) => (target.cik && String(cik).padStart(10, "0") === target.cik) || (target.ticker && ticker.toUpperCase() === target.ticker));
    let submissions;
    if (!row && target.domain) {
      for (const candidate of dataset.data) {
        const candidateCik = String(candidate[0]).padStart(10, "0");
        try {
          const candidateSubmissions = await fetchSecJson(`${SEC_SUBMISSIONS_URL}${candidateCik}.json`);
          if (normalizeDomain(candidateSubmissions.website) === target.domain) { row = candidate; submissions = candidateSubmissions; break; }
        } catch {}
      }
    }
    if (!row) throw new Error(`SEC authoritative company lookup found no public-company row for ${target.ticker || target.cik || target.domain}`);
    const [cikNumber, legalName, ticker, exchange] = row; const cik = String(cikNumber).padStart(10, "0"); const submissionsUrl = `${SEC_SUBMISSIONS_URL}${cik}.json`;
    if (!submissions) { try { submissions = await fetchSecJson(submissionsUrl); } catch {} }
    const evidence = [
      { id: `sec-${ticker.toLowerCase()}-legal-name`, type: "document", label: "Authoritative legal company name", value: legalName, source: SEC_COMPANY_TICKERS_EXCHANGE_URL },
      { id: `sec-${ticker.toLowerCase()}-ticker`, type: "document", label: "SEC ticker", value: ticker, source: SEC_COMPANY_TICKERS_EXCHANGE_URL },
      { id: `sec-${ticker.toLowerCase()}-exchange`, type: "document", label: "Exchange listing", value: exchange, source: SEC_COMPANY_TICKERS_EXCHANGE_URL },
      { id: `sec-${ticker.toLowerCase()}-cik`, type: "document", label: "SEC CIK", value: cik, source: SEC_COMPANY_TICKERS_EXCHANGE_URL },
    ];
    const reportedWebsite = normalizeDomain(submissions?.website);
    if (reportedWebsite) evidence.push({ id: `sec-${ticker.toLowerCase()}-website`, type: "document", label: "SEC company website", value: reportedWebsite, source: submissionsUrl });
    return { findings: [], evidence, metadata: { integrationStatus: "connected", lookupPerformed: true, authoritative: true, authority: "U.S. Securities and Exchange Commission", legalIdentitySourcePolicy: "Legal company identity is acquired only from SEC authoritative public-company data. Domains, website titles and SSL certificates are not used as legal-identity sources.", legalName: submissions?.name || legalName, ticker, exchange, cik, sourceUrl: SEC_COMPANY_TICKERS_EXCHANGE_URL, submissionsUrl, resolverEvidence: { id: `sec:${cik}`, legalName: submissions?.name || legalName, ticker, exchange, domain: reportedWebsite || undefined, verified: true, verificationStatus: "authoritative", source: "sec_company_tickers_exchange_and_submissions", evidenceRefs: evidence.map((item) => item.id), observedAt: new Date().toISOString() } } };
  }
}

module.exports = { AuthoritativeCompanyEvidenceProvider, SEC_COMPANY_TICKERS_EXCHANGE_URL };
