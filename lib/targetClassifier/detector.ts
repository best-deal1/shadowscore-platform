import type { ParsedTargetInput, PlatformDetection, TargetType } from "./types";

interface PlatformRule {
  platform: string;
  domains: string[];
  sellerSegments?: string[];
  storeSegments?: string[];
  companySegments?: string[];
  profileSegments?: string[];
  defaultType: TargetType;
}

const PLATFORM_RULES: PlatformRule[] = [
  { platform: "eBay", domains: ["ebay.com"], sellerSegments: ["usr"], storeSegments: ["str"], defaultType: "Marketplace Seller" },
  { platform: "Amazon", domains: ["amazon.com"], sellerSegments: ["sp", "shops", "seller"], storeSegments: ["stores"], defaultType: "Marketplace Store" },
  { platform: "Etsy", domains: ["etsy.com"], storeSegments: ["shop"], defaultType: "Marketplace Store" },
  { platform: "LinkedIn", domains: ["linkedin.com"], companySegments: ["company"], profileSegments: ["in"], defaultType: "Company" },
  { platform: "Facebook", domains: ["facebook.com", "fb.com"], profileSegments: [], defaultType: "Business Profile" },
  { platform: "Instagram", domains: ["instagram.com"], profileSegments: [], defaultType: "Business Profile" },
  { platform: "TikTok", domains: ["tiktok.com"], profileSegments: ["@"], defaultType: "Business Profile" },
  { platform: "X", domains: ["x.com", "twitter.com"], profileSegments: [], defaultType: "Business Profile" },
];

const normalizeHost = (host: string): string => host.toLowerCase().replace(/^www\./, "");

const pathSegments = (url: URL): string[] => url.pathname.split("/").map(decodeURIComponent).filter(Boolean);

const matchesRule = (host: string, rule: PlatformRule): boolean => rule.domains.some((domain) => host === domain || host.endsWith(`.${domain}`));

const segmentAfter = (segments: string[], markers: string[] = []): string | undefined => {
  for (const marker of markers) {
    if (marker === "@") {
      const handle = segments.find((segment) => segment.startsWith("@"));
      if (handle) return handle.replace(/^@/, "");
    }

    const index = segments.findIndex((segment) => segment.toLowerCase() === marker.toLowerCase());
    if (index >= 0 && segments[index + 1]) return segments[index + 1];
  }

  return undefined;
};

export function detectPlatform(parsed: ParsedTargetInput): PlatformDetection | null {
  for (const url of parsed.urls) {
    const host = normalizeHost(url.hostname);
    const rule = PLATFORM_RULES.find((candidate) => matchesRule(host, candidate));
    if (!rule) continue;

    const segments = pathSegments(url);
    const querySeller = url.searchParams.get("seller") ?? undefined;
    const seller = segmentAfter(segments, rule.sellerSegments) ?? querySeller;
    const store = segmentAfter(segments, rule.storeSegments);
    const company = segmentAfter(segments, rule.companySegments);
    const profile = segmentAfter(segments, rule.profileSegments) ?? (segments.length === 1 ? segments[0].replace(/^@/, "") : undefined);
    const identifier = seller ?? store ?? company ?? profile;
    const targetType: TargetType = seller ? "Marketplace Seller" : store ? "Marketplace Store" : company ? "Company" : rule.defaultType;

    return {
      platform: rule.platform,
      host,
      domain: rule.domains[0],
      seller,
      store,
      profile: company ?? profile,
      handle: profile,
      targetType,
      confidence: identifier ? 0.95 : 0.82,
      reasoning: identifier
        ? `Matched ${rule.platform} URL pattern and extracted identifier from path.`
        : `Matched ${rule.platform} domain without a specific path identifier.`,
    };
  }

  return null;
}
