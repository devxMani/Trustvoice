// lib/tiers.ts — Tier logic, constants, and helpers
export type Tier = "FREE" | "STARTER" | "GROWTH" | "SCALE";

// ─── Revenue Thresholds ──────────────────────────────────────────────────────

export const TIER_THRESHOLDS = {
  FREE: 0,
  STARTER: 100_000,      // $1k in cents
  GROWTH: 500_000,       // $5k in cents
  SCALE: 2_000_000,      // $20k in cents
} as const;

// ─── Tier Metadata ───────────────────────────────────────────────────────────

export interface TierConfig {
  name: string;
  label: string;
  minCents: number;
  maxCents: number | null;
  color: string;
  bgColor: string;
  emoji: string;
  pet: string;
  zone: string;
  zoneDescription: string;
  mapX: number; // Top-left tile X of this zone
  mapY: number; // Top-left tile Y of this zone
  spawnX: number; // Spawn pixel X for this tier
  spawnY: number; // Spawn pixel Y for this tier
}

export const TIERS: Record<Tier, TierConfig> = {
  FREE: {
    name: "FREE",
    label: "Free",
    minCents: 0,
    maxCents: 99_999,
    color: "#6b7280",
    bgColor: "#f3f4f6",
    emoji: "🌱",
    pet: "plant",
    zone: "Starter Village",
    zoneDescription: "Where every founder begins",
    mapX: 0,
    mapY: 0,
    spawnX: 400,
    spawnY: 400,
  },
  STARTER: {
    name: "STARTER",
    label: "$1K–$5K/mo",
    minCents: 100_000,
    maxCents: 499_999,
    color: "#10b981",
    bgColor: "#d1fae5",
    emoji: "🤖",
    pet: "robot",
    zone: "Growth Park",
    zoneDescription: "Getting traction, building fast",
    mapX: 50,
    mapY: 0,
    spawnX: 1800,
    spawnY: 400,
  },
  GROWTH: {
    name: "GROWTH",
    label: "$5K–$20K/mo",
    minCents: 500_000,
    maxCents: 1_999_999,
    color: "#3b82f6",
    bgColor: "#dbeafe",
    emoji: "🚀",
    pet: "rocket",
    zone: "Scale District",
    zoneDescription: "Real momentum, serious founders",
    mapX: 0,
    mapY: 40,
    spawnX: 400,
    spawnY: 1600,
  },
  SCALE: {
    name: "SCALE",
    label: "$20K+/mo",
    minCents: 2_000_000,
    maxCents: null,
    color: "#f59e0b",
    bgColor: "#fef3c7",
    emoji: "👑",
    pet: "crown",
    zone: "Whale Lounge",
    zoneDescription: "The inner circle — you made it",
    mapX: 50,
    mapY: 40,
    spawnX: 1800,
    spawnY: 1600,
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Derive tier from last-30-day revenue (in cents).
 * Must run server-side only.
 */
export function getTierFromRevenue(revenueCents: number): Tier {
  if (revenueCents >= TIER_THRESHOLDS.SCALE) return "SCALE";
  if (revenueCents >= TIER_THRESHOLDS.GROWTH) return "GROWTH";
  if (revenueCents >= TIER_THRESHOLDS.STARTER) return "STARTER";
  return "FREE";
}

/**
 * Format revenue for display.
 */
export function formatRevenue(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

/**
 * Check if a player can access a given zone.
 */
export function canAccessZone(playerTier: Tier, zoneTier: Tier): boolean {
  const order: Tier[] = ["FREE", "STARTER", "GROWTH", "SCALE"];
  return order.indexOf(playerTier) >= order.indexOf(zoneTier);
}

/**
 * Get the tier config by tier name.
 */
export function getTierConfig(tier: Tier): TierConfig {
  return TIERS[tier];
}
