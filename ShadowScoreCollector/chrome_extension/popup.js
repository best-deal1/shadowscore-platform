const KEYWORDS = {
  "MC011 / Account Review": ["mc011", "account review", "under review", "seller review", "verification review"],
  "Payout Hold / Reserve": ["payout hold", "funds on hold", "payment hold", "reserve", "rolling reserve", "payouts paused", "withholding", "money held"],
  "Suspension / Restriction": ["suspended", "suspension", "restricted", "restriction", "deactivated", "account blocked", "terminated", "banned", "permanently suspended"],
  "Tracking / Delivery Proof": ["tracking", "tba", "label created", "proof of delivery", "delivered", "carrier", "delivery confirmation", "valid tracking"],
  "Linked Account / Identity Risk": ["linked account", "related account", "same ip", "same device", "identity", "verification failed", "kyc", "document rejected", "verify documents"],
  "IP / Brand / VERO": ["vero", "ip complaint", "trademark", "copyright", "brand complaint", "counterfeit", "authenticity", "invoice", "policy violation"],
  "Appeal / Reinstatement": ["appeal", "reinstate", "reinstatement", "poa", "plan of action", "any solution", "need help", "account back"],
  "Compliance / Tax": ["vat", "hmrc", "tax", "user agreement", "kyc", "business details", "seller obligations"]
};

const WEIGHTS = {
  "MC011 / Account Review": 20,
  "Payout Hold / Reserve": 18,
  "Suspension / Restriction": 25,
  "Tracking / Delivery Proof": 14,
  "Linked Account / Identity Risk": 22,
  "IP / Brand / VERO": 22,
  "Appeal / Reinstatement": 12,
  "Compliance / Tax": 10
};

const MARKETPLACES = ["ebay", "amazon", "walmart", "etsy", "tiktok shop", "shein", "shopify"];
const STORAGE_KEY = "shadowscore_master_signals_v4";
const AUTO_KEY = "shadowscore_auto_monitor_enabled_v4";
const LAST_KEY = "shadowscore_last_collect_v4";
const AUTO_ALARM_MS = 60000;

let autoTimer = null;

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hashText(text) {
  let hash = 0;
  const clean = normalize(text).slice(0, 1500);
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
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
      matched_terms.push(...found.slice(0, 6));
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
    'article'
  ];

  const candidates = [];
  const seen = new Set();

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(el => {
      const rect = el.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight * 1.6;
      if (!visible) return;

      const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length < 60 || text.length > 5000) return;

      const key = text.slice(0, 300);
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
        fingerprint: hashText(text),
        url: location.href,
        title: document.title,
        collected_at: new Date().toISOString(),
        excerpt: text.slice(0, 700),
        text,
        source: "visible_page_click_or_monitor",
        ...analysis
      };
    });
}

function toCsv(rows) {
  const columns = ["fingerprint", "url", "title", "collected_at", "marketplace", "severity", "score", "categories", "matched_terms", "excerpt"];
  const escape = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = columns.join(",");
  const body = rows.map(row => columns.map(col => {
    const value = Array.isArray(row[col]) ? row[col].join(" | ") : row[col];
    return escape(value);
  }).join(",")).join("\n");
  return header + "\n" + body;
}

function nowFileStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function getMaster() {
  const data = await chrome.storage.local.get([STORAGE_KEY]);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

async function setMaster(rows) {
  await chrome.storage.local.set({ [STORAGE_KEY]: rows });
}

async function appendUnique(rows) {
  const master = await getMaster();
  const seen = new Set(master.map(row => row.fingerprint));
  const newRows = [];

  for (const row of rows) {
    if (!seen.has(row.fingerprint)) {
      seen.add(row.fingerprint);
      newRows.push(row);
    }
  }

  const updated = [...master, ...newRows];
  await setMaster(updated);
  await chrome.storage.local.set({ [LAST_KEY]: new Date().toLocaleTimeString() });

  return {
    added: newRows.length,
    total: updated.length
  };
}

async function collectVisible() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractVisiblePosts
  });

  const rows = result || [];
  const stats = await appendUnique(rows);
  return { rows, ...stats };
}

async function downloadRows(rows, format, prefix) {
  const timestamp = nowFileStamp();
  let blob;
  let filename;

  if (format === "csv") {
    blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    filename = `ShadowScoreCollector/${prefix}-${timestamp}.csv`;
  } else {
    blob = new Blob([JSON.stringify({ total: rows.length, rows }, null, 2)], { type: "application/json" });
    filename = `ShadowScoreCollector/${prefix}-${timestamp}.json`;
  }

  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({ url, filename, saveAs: false });
}

async function collectAndDownload(format) {
  setStatus("Collecting visible signals...");
  const { rows, added, total } = await collectVisible();
  await downloadRows(rows, format, "visible-signals");
  setStatus(`Collected ${rows.length}. Added ${added} new. Dataset total ${total}.`);
  await refreshStats();
}

async function downloadMaster(format) {
  const master = await getMaster();
  if (!master.length) {
    setStatus("Local dataset is empty.");
    return;
  }

  await downloadRows(master, format, "master-signals");
  setStatus(`Downloaded master dataset with ${master.length} rows.`);
}

async function clearMaster() {
  if (!confirm("Clear the local ShadowScore dataset stored in this browser?")) return;
  await setMaster([]);
  await chrome.storage.local.set({ [LAST_KEY]: "Never" });
  setStatus("Local dataset cleared.");
  await refreshStats();
}

function setStatus(message) {
  const el = document.getElementById("status");
  if (el) el.textContent = message;
}

async function refreshStats() {
  const master = await getMaster();
  const data = await chrome.storage.local.get([AUTO_KEY, LAST_KEY]);

  document.getElementById("total").textContent = String(master.length);
  document.getElementById("last").textContent = data[LAST_KEY] || "Never";
  document.getElementById("autoMonitor").checked = Boolean(data[AUTO_KEY]);
  document.getElementById("mode").textContent = data[AUTO_KEY] ? "Auto Monitor" : "Manual";
}

async function runAutoCollect() {
  const data = await chrome.storage.local.get([AUTO_KEY]);
  if (!data[AUTO_KEY]) return;

  try {
    const { rows, added, total } = await collectVisible();
    setStatus(`Auto monitor: scanned ${rows.length}, added ${added}. Total ${total}.`);
    await refreshStats();
  } catch (error) {
    setStatus(`Auto monitor paused: ${error.message || error}`);
  }
}

function startAutoTimer() {
  stopAutoTimer();
  autoTimer = setInterval(runAutoCollect, AUTO_ALARM_MS);
}

function stopAutoTimer() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

document.getElementById("collectJson").addEventListener("click", () => collectAndDownload("json"));
document.getElementById("collectCsv").addEventListener("click", () => collectAndDownload("csv"));
document.getElementById("downloadMaster").addEventListener("click", () => downloadMaster("json"));
document.getElementById("downloadMasterCsv").addEventListener("click", () => downloadMaster("csv"));
document.getElementById("clearMaster").addEventListener("click", clearMaster);

document.getElementById("autoMonitor").addEventListener("change", async (event) => {
  const enabled = event.target.checked;
  await chrome.storage.local.set({ [AUTO_KEY]: enabled });

  if (enabled) {
    setStatus("Auto monitor enabled. Keep the Facebook tab open and visible. It scans every 60 seconds while popup is open.");
    startAutoTimer();
    await runAutoCollect();
  } else {
    stopAutoTimer();
    setStatus("Auto monitor disabled.");
  }

  await refreshStats();
});

refreshStats().then(async () => {
  const data = await chrome.storage.local.get([AUTO_KEY]);
  if (data[AUTO_KEY]) startAutoTimer();
});
