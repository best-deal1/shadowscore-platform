export type CompanyEvidenceRecord = {
  id: string;
  names: string[];
  domain: string;
  ticker?: string;
  legalName: string;
  historicalRisk?: {
    title: string;
    description: string;
    source: string;
    severity: "high" | "critical";
  };
};

const COMPANY_EVIDENCE: CompanyEvidenceRecord[] = [
  { id: "microsoft", names: ["microsoft", "microsoft corporation", "msft"], domain: "microsoft.com", ticker: "MSFT", legalName: "Microsoft Corporation" },
  { id: "apple", names: ["apple", "apple inc", "aapl"], domain: "apple.com", ticker: "AAPL", legalName: "Apple Inc." },
  { id: "nvidia", names: ["nvidia", "nvidia corporation", "nvda"], domain: "nvidia.com", ticker: "NVDA", legalName: "NVIDIA Corporation" },
  { id: "openai", names: ["openai"], domain: "openai.com", legalName: "OpenAI" },
  { id: "stripe", names: ["stripe", "stripe inc"], domain: "stripe.com", legalName: "Stripe, Inc." },
  { id: "paypal", names: ["paypal", "paypal holdings", "pypl"], domain: "paypal.com", ticker: "PYPL", legalName: "PayPal Holdings, Inc." },
  { id: "amazon", names: ["amazon", "amazon.com", "amzn"], domain: "amazon.com", ticker: "AMZN", legalName: "Amazon.com, Inc." },
  { id: "google", names: ["google", "alphabet", "goog", "googl"], domain: "google.com", ticker: "GOOGL", legalName: "Alphabet Inc." },
  { id: "ftx", names: ["ftx", "ftx trading"], domain: "ftx.com", legalName: "FTX Trading Ltd.", historicalRisk: { title: "Verified criminal fraud conviction involving FTX", description: "The U.S. Department of Justice reported that FTX founder Samuel Bankman-Fried was convicted of fraud and conspiracy charges connected to the cryptocurrency exchange.", source: "https://www.justice.gov/opa/pr/samuel-bankman-fried-sentenced-25-years-his-orchestration-multiple-fraudulent-schemes", severity: "critical" } },
  { id: "theranos", names: ["theranos", "theranos inc"], domain: "theranos.com", legalName: "Theranos, Inc.", historicalRisk: { title: "Verified SEC fraud enforcement involving Theranos", description: "The U.S. Securities and Exchange Commission charged Theranos and its founder with raising funds through false or exaggerated statements.", source: "https://www.sec.gov/newsroom/press-releases/2018-41", severity: "critical" } },
  { id: "wirecard", names: ["wirecard", "wirecard ag"], domain: "wirecard.com", legalName: "Wirecard AG", historicalRisk: { title: "Verified criminal fraud charges involving Wirecard", description: "The U.S. Department of Justice announced fraud charges tied to a scheme involving Wirecard and the reported processing of payment transactions.", source: "https://www.justice.gov/usao-edny/pr/former-wirecard-executive-charged-fraud", severity: "critical" } },
  { id: "celsius", names: ["celsius", "celsius network"], domain: "celsius.network", legalName: "Celsius Network LLC", historicalRisk: { title: "Verified regulatory fraud charges involving Celsius", description: "The U.S. Securities and Exchange Commission charged Celsius Network and its former chief executive with fraud and unregistered securities activity.", source: "https://www.sec.gov/newsroom/press-releases/2023-133", severity: "critical" } },
];

function normalized(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "").replace(/[.,]$/, "");
}

export function companyEvidenceFor(value: string) {
  const query = normalized(value);
  return COMPANY_EVIDENCE.find((company) => company.domain === query || company.names.some((name) => normalized(name) === query));
}

export function resolveCompanyTarget(value: string) {
  const company = companyEvidenceFor(value);
  return company ? { requestedTarget: value.trim(), resolvedTarget: company.domain, company } : { requestedTarget: value.trim(), resolvedTarget: value.trim() };
}

export const validationCompanies = COMPANY_EVIDENCE.map((company) => company.names[0]);
