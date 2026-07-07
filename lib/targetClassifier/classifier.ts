import { detectPlatform } from "./detector";
import { parseTargetInput } from "./parser";
import type { ExtractedIdentifier, TargetClassificationResult } from "./types";

const clampConfidence = (value: number): number => Math.max(0, Math.min(1, Number(value.toFixed(2))));

const titleCase = (value: string): string => value.replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());

const isLikelyBusinessName = (value: string): boolean => /^[\p{L}\p{N}][\p{L}\p{N} '&.,-]{1,80}$/u.test(value) && !value.includes("@");

export function classifyTarget(input: unknown): TargetClassificationResult {
  const parsed = parseTargetInput(input);
  const identifiers: ExtractedIdentifier[] = [];

  if (!parsed.cleanedInput) {
    return { targetType: "Unknown", normalizedTarget: "", detectedPlatform: null, extractedIdentifiers: [], confidence: 0, reasoning: "Input was empty after trimming whitespace." };
  }

  const platform = detectPlatform(parsed);
  if (platform) {
    identifiers.push({ kind: "platform", label: "Platform", value: platform.platform }, { kind: "domain", label: "Domain", value: platform.domain });
    if (platform.seller) identifiers.push({ kind: "seller", label: "Seller", value: platform.seller });
    if (platform.store) identifiers.push({ kind: "store", label: "Store", value: platform.store });
    if (platform.profile) identifiers.push({ kind: "profile", label: "Profile", value: platform.profile });
    const normalizedTarget = platform.seller ?? platform.store ?? platform.profile ?? platform.host;

    return {
      targetType: platform.targetType,
      normalizedTarget,
      detectedPlatform: platform.platform,
      extractedIdentifiers: identifiers,
      confidence: clampConfidence(platform.confidence),
      reasoning: platform.reasoning,
    };
  }

  if (parsed.emails.length === 1 && parsed.cleanedInput === parsed.emails[0]) {
    return {
      targetType: "Email",
      normalizedTarget: parsed.emails[0],
      detectedPlatform: null,
      extractedIdentifiers: [{ kind: "email", label: "Email", value: parsed.emails[0] }],
      confidence: 0.98,
      reasoning: "Input matched a single email address pattern.",
    };
  }

  if (parsed.phones.length === 1 && parsed.cleanedInput.replace(/\s+/g, " ").trim() === parsed.phones[0]) {
    return {
      targetType: "Phone",
      normalizedTarget: parsed.phones[0],
      detectedPlatform: null,
      extractedIdentifiers: [{ kind: "phone", label: "Phone", value: parsed.phones[0] }],
      confidence: 0.9,
      reasoning: "Input matched a single phone number pattern.",
    };
  }

  if (parsed.looksLikeEvidencePackage) {
    parsed.urls.forEach((url) => identifiers.push({ kind: "url", label: "URL", value: url.href }));
    parsed.emails.forEach((email) => identifiers.push({ kind: "email", label: "Email", value: email }));
    parsed.phones.forEach((phone) => identifiers.push({ kind: "phone", label: "Phone", value: phone }));
    return {
      targetType: "Evidence Package",
      normalizedTarget: parsed.cleanedInput.slice(0, 200),
      detectedPlatform: null,
      extractedIdentifiers: identifiers,
      confidence: 0.78,
      reasoning: "Input contains multiple or structured evidence signals rather than one atomic target.",
    };
  }

  if (parsed.domains.length === 1) {
    return {
      targetType: "Website",
      normalizedTarget: parsed.domains[0],
      detectedPlatform: null,
      extractedIdentifiers: [{ kind: "domain", label: "Domain", value: parsed.domains[0] }],
      confidence: 0.93,
      reasoning: "Input matched a single non-marketplace domain or URL.",
    };
  }

  if (isLikelyBusinessName(parsed.cleanedInput)) {
    const normalizedName = titleCase(parsed.cleanedInput);
    return {
      targetType: "Business",
      normalizedTarget: normalizedName,
      detectedPlatform: null,
      extractedIdentifiers: [{ kind: "brand", label: "Name", value: normalizedName }],
      confidence: 0.66,
      reasoning: "Input looks like a standalone organization, business, or brand name without platform-specific evidence.",
    };
  }

  return {
    targetType: "Unknown",
    normalizedTarget: parsed.cleanedInput,
    detectedPlatform: null,
    extractedIdentifiers: [],
    confidence: 0.2,
    reasoning: "No supported deterministic pattern matched the submitted input.",
  };
}
