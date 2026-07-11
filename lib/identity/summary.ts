import type { IdentityResolutionResult } from "./types";

export function summarizeIdentityResolution(result: IdentityResolutionResult): string[] {
  return [
    `Resolved ${result.identities.length} identity object(s).`,
    `Tracked ${result.contradictions.length} contradiction(s).`,
    `Identity graph contains ${result.graph.nodes.length} nodes and ${result.graph.edges.length} edges.`,
  ];
}
