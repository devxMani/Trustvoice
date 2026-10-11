// components/ui/TierBadge.tsx
// Displays a revenue tier badge with color, emoji, and label.

import { Tier } from "@prisma/client";
import { TIERS } from "@/lib/tiers";
import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tier: Tier;
  revenueCents?: number;
  size?: "sm" | "md" | "lg";
  showRevenue?: boolean;
  className?: string;
}

export function TierBadge({
  tier,
  revenueCents,
  size = "md",
  showRevenue = false,
  className,
}: TierBadgeProps) {
  const config = TIERS[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold border",
        {
          "text-xs px-2 py-0.5": size === "sm",
          "text-sm px-3 py-1": size === "md",
          "text-base px-4 py-1.5": size === "lg",
        },
        className
      )}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: `${config.color}40`,
      }}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
      {showRevenue && revenueCents !== undefined && (
        <span className="opacity-70 text-xs">
          ({formatRevenueCents(revenueCents)}/mo)
        </span>
      )}
    </span>
  );
}

function formatRevenueCents(cents: number): string {
  const d = cents / 100;
  if (d >= 1000) return `$${(d / 1000).toFixed(1)}K`;
  return `$${d.toFixed(0)}`;
}
