import { defaultTrustWatchRules } from "./rules";
import type { TrustWatchBusiness, TrustWatchRule, TrustWatchWatchlist } from "./types";

export function createWatchlist(params: {
  id: string;
  userId: string;
  name: string;
  businesses?: TrustWatchBusiness[];
  rules?: TrustWatchRule[];
  timestamp?: string;
}): TrustWatchWatchlist {
  const timestamp = params.timestamp ?? new Date().toISOString();

  return {
    id: params.id,
    userId: params.userId,
    name: params.name,
    businesses: params.businesses ?? [],
    rules: params.rules ?? defaultTrustWatchRules,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function addBusinessToWatchlist(
  watchlist: TrustWatchWatchlist,
  business: TrustWatchBusiness,
  timestamp = new Date().toISOString(),
): TrustWatchWatchlist {
  const businesses = watchlist.businesses.some((item) => item.id === business.id)
    ? watchlist.businesses.map((item) => (item.id === business.id ? business : item))
    : [...watchlist.businesses, business];

  return { ...watchlist, businesses, updatedAt: timestamp };
}

export function removeBusinessFromWatchlist(
  watchlist: TrustWatchWatchlist,
  businessId: string,
  timestamp = new Date().toISOString(),
): TrustWatchWatchlist {
  return {
    ...watchlist,
    businesses: watchlist.businesses.filter((business) => business.id !== businessId),
    updatedAt: timestamp,
  };
}

export const sampleTrustWatchWatchlist = createWatchlist({
  id: "watchlist_primary",
  userId: "user_123",
  name: "Primary vendor monitoring",
  timestamp: "2026-07-07T09:00:00.000Z",
  businesses: [
    {
      id: "acme",
      name: "Acme Supply Co.",
      domain: "acme.example",
      email: "security@acme.example",
      reputationScore: 82,
    },
    {
      id: "northstar",
      name: "Northstar Logistics",
      domain: "northstar.example",
      email: "ops@northstar.example",
      reputationScore: 74,
    },
  ],
});
