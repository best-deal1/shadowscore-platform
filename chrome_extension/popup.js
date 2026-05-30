const KEYWORDS = {
  "MC011 / Account Review": ["mc011", "account review", "under review", "seller review", "verification review"],
  "Payout Hold / Reserve": ["payout hold", "funds on hold", "payment hold", "reserve", "rolling reserve", "payouts paused"],
  "Suspension / Restriction": ["suspended", "suspension", "restricted", "restriction", "deactivated", "account blocked", "terminated", "banned"],
  "Tracking / Delivery Proof": ["tracking", "tba", "label created", "proof of delivery", "delivered", "carrier", "delivery confirmation"],
  "Linked Account / Identity Risk": ["linked account", "related account", "same ip", "same device", "identity", "verification failed", "kyc"],
  "IP / Brand / VERO": ["vero", "ip complaint", "trademark", "copyright", "brand complaint", "counterfeit", "authenticity", "invoice"],
  "Appeal / Reinstatement": ["appeal", "reinstate", "reinstatement", "poa", "plan of action", "any solution", "need help", "account back"]
};

const WEIGHTS = {
  "MC011 / Account Review": 20,
  "Payout Hold / Reserve": 18,
  "Suspension / Restriction": 25,
  "Tracking / Delivery Proof": 14,
  "Linked Account / Identity Risk": 22,
  "IP / Brand / VERO": 22,
  "Appeal / Reinstatement": 12
};

const MARKETPLACES = ["ebay", "amazon", "walmart", "etsy", "tiktok shop", "shein", "shopify"];

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\\s+/g, " ").trim();
}

function classify(text) {
  const t = normalize(text);
  const categories = [];
  const matched_terms = [];
  let score = 0;

  for (const [category, terms] of Object.entries(KEYWORDS)) {
    const found = terms.filter(term => t.includes(term));
    if (found.length) {
      categories.push(category);
      matched_terms.push(...found.slice(0, 5));
      score += WEIGHTS[category] || 10;
    }
  }

  let severity = "Low";
  if (score >= 65) severity = "Critical";
  else if (score >= 40) severity = "High";
  else if (score >= 20) severity = "Elevated";
  else if (score > 0) severity = "Watchlist";

  const marketplaceHits = MARKETPLACES.filter(m => t.includes(m));

  return {
    marketplace: marketplaceHits.length ? marketplaceHits.join(", ") : "Unknown",
    categories: categories.length ? categories : ["Unclassified"],
    matched_terms,
    severity,
    score: Math.min(score, 100)
  };
}

function extractVisiblePosts() {
  const selectors = [
    '[role="article"]',
    '[data-pagelet*="FeedUnit"]',
    'article',
    'div'
  ];

  const candidates = [];
  const seen = new Set();

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(el => {
      const rect = el.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight * 1.5;
      if (!visible) return;

      const text = (el.innerText || el.textContent || "").replace(/\\s+/g, " ").trim();
      if (text.length < 60 || text.length > 3000) return;

      const key = text.slice(0, 220);
      if (seen.has(key)) return;
      seen.add(key);

      candidates.push(text);
    });
  }

  return candidates
    .filter(text => {
      const t = normalize(text);
      return Object.values(KEYWORDS).flat().some(k => t.includes(k));
    })
    .map((text, index) => {
      const analysis = classify(text);
      return {
        id: index + 1,
        url: location.href,
        title: document.title,
        collected_at: new Date().toISOString(),
        excerpt: text.slice(0, 500),
        text,
        ...analysis
      };
    });
}

function toCsv(rows) {
  const columns = ["id", "url", "title", "collected_at", "marketplace", "severity", "score", "categories", "matched_terms", "excerpt"];
  const escape = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = columns.join(",");
  const body = rows.map(row => columns.map(col => {
    const value = Array.isArray(row[col]) ? row[col].join(" | ") : row[col];
    return escape(value);
  }).join(",")).join("\\n");
  return header + "\\n" + body;
}

async function collect(format) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractVisiblePosts
  });

  const rows = result || [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  let blob;
  let filename;

  if (format === "csv") {
    blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    filename = `shadowscore-pain-signals-${timestamp}.csv`;
  } else {
    blob = new Blob([JSON.stringify({ total: rows.length, rows }, null, 2)], { type: "application/json" });
    filename = `shadowscore-pain-signals-${timestamp}.json`;
  }

  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({ url, filename, saveAs: true });

  document.getElementById("status").textContent = `Collected ${rows.length} matching posts/comments from the visible page.`;
}

document.getElementById("collect").addEventListener("click", () => collect("json"));
document.getElementById("collectCsv").addEventListener("click", () => collect("csv"));
