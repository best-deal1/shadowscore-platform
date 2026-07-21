export type PlatformConsumer = "command_center" | "workspace" | "public_api" | "partner_api";

export type PlatformCapabilityId =
  | "identity"
  | "evidence"
  | "trust"
  | "risk"
  | "monitoring"
  | "decision"
  | "intelligence"
  | "relationship_graph";

export type PlatformCapability = {
  id: PlatformCapabilityId;
  name: string;
  description: string;
  outputs: readonly string[];
  consumers: readonly PlatformConsumer[];
  implementation: string;
};

export type PlatformCapabilityCatalog = {
  version: string;
  capabilities: readonly PlatformCapability[];
};
