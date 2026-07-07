export type TargetType =
  | "Website"
  | "Business"
  | "Marketplace Seller"
  | "Marketplace Store"
  | "Company"
  | "Brand"
  | "Business Profile"
  | "Email"
  | "Phone"
  | "Evidence Package"
  | "Unknown";

export type IdentifierKind =
  | "domain"
  | "url"
  | "platform"
  | "seller"
  | "store"
  | "company"
  | "brand"
  | "profile"
  | "email"
  | "phone"
  | "handle"
  | "evidenceItem";

export interface ExtractedIdentifier {
  kind: IdentifierKind;
  label: string;
  value: string;
}

export interface ParsedTargetInput {
  rawInput: string;
  cleanedInput: string;
  tokens: string[];
  urls: URL[];
  emails: string[];
  phones: string[];
  domains: string[];
  looksLikeEvidencePackage: boolean;
}

export interface TargetClassificationResult {
  targetType: TargetType;
  normalizedTarget: string;
  detectedPlatform: string | null;
  extractedIdentifiers: ExtractedIdentifier[];
  confidence: number;
  reasoning: string;
}

export interface PlatformDetection {
  platform: string;
  host: string;
  domain: string;
  seller?: string;
  store?: string;
  profile?: string;
  handle?: string;
  targetType: TargetType;
  confidence: number;
  reasoning: string;
}
