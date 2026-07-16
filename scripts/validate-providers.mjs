import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const productionPath = join(root, "lib/providers/productionProviders.ts");
const providerSource = readFileSync(productionPath, "utf8");

const expectedProviderClasses = [
  "SSLProvider",
  "DNSProvider",
  "WHOISProvider",
  "SecurityHeadersProvider",
  "SPFProvider",
  "DMARCProvider",
  "BusinessProfileProvider",
  "ReputationProvider",
  "WebsiteMetadataProvider",
  "ContactDiscoveryProvider",
  "SocialProfileProvider",
  "AuthoritativeCompanyEvidenceProvider",
];

const legacyProviderFiles = [
  "lib/providers/DNSProvider.ts",
  "lib/providers/WHOISProvider.ts",
];
const placeholderModules = ["lib/providers/placeholderProviders.ts"];

const classMatches = [...providerSource.matchAll(/export\s+class\s+(\w+Provider)\s+extends\s+ProductionProvider/g)].map((match) => match[1]);
const classCounts = new Map();
for (const className of classMatches) classCounts.set(className, (classCounts.get(className) || 0) + 1);

const providerIdMatches = [...providerSource.matchAll(/readonly\s+id\s*=\s*["']([^"']+)["']/g)].map((match) => match[1]);
const providerIdCounts = new Map();
for (const providerId of providerIdMatches) providerIdCounts.set(providerId, (providerIdCounts.get(providerId) || 0) + 1);

const missingClasses = expectedProviderClasses.filter((className) => !classCounts.has(className));
const unexpectedClasses = classMatches.filter((className) => !expectedProviderClasses.includes(className));
const duplicateClasses = [...classCounts.entries()].filter(([, count]) => count > 1);
const duplicateProviderIds = [...providerIdCounts.entries()].filter(([, count]) => count > 1);
const legacyFilesFound = legacyProviderFiles.filter((file) => existsSync(join(root, file)));
const placeholderModulesFound = placeholderModules.filter((file) => existsSync(join(root, file)));
const duplicateImplementations = duplicateClasses.length + duplicateProviderIds.length;

console.log(`Provider classes: ${classMatches.length}`);
console.log(`Unique class names: ${classCounts.size}`);
console.log(`Unique provider IDs: ${providerIdCounts.size}`);
console.log(`Duplicate implementations: ${duplicateImplementations}`);
console.log(`Legacy provider files: ${legacyFilesFound.length}`);
console.log(`Placeholder modules: ${placeholderModulesFound.length}`);

if (missingClasses.length) console.error(`Missing provider classes: ${missingClasses.join(", ")}`);
if (unexpectedClasses.length) console.error(`Unexpected provider classes: ${unexpectedClasses.join(", ")}`);
if (duplicateClasses.length) console.error(`Duplicate provider classes: ${duplicateClasses.map(([name, count]) => `${name} (${count})`).join(", ")}`);
if (duplicateProviderIds.length) console.error(`Duplicate provider IDs: ${duplicateProviderIds.map(([id, count]) => `${id} (${count})`).join(", ")}`);
if (legacyFilesFound.length) console.error(`Legacy provider files still present: ${legacyFilesFound.join(", ")}`);
if (placeholderModulesFound.length) console.error(`Placeholder modules still present: ${placeholderModulesFound.join(", ")}`);

if (
  classMatches.length !== expectedProviderClasses.length ||
  classCounts.size !== expectedProviderClasses.length ||
  providerIdCounts.size !== expectedProviderClasses.length ||
  duplicateImplementations !== 0 ||
  missingClasses.length ||
  unexpectedClasses.length ||
  legacyFilesFound.length ||
  placeholderModulesFound.length
) {
  process.exit(1);
}
