// components/ui/LeaderboardModal.tsx
// Founders Hall of Fame and revenue leaderboard modal

"use client";

import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Sparkles, X, Bot, Phone, RefreshCw } from "lucide-react";
import { TierBadge } from "./TierBadge";
import { formatRevenue } from "@/lib/tiers";
import type { Tier } from "@prisma/client";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  image?: string;
  verifiedRevenueCents: number;
  tier: Tier;
  startup?: string;
  agentName?: string;
  petType?: string;
  isOnline: boolean;
  twitterUrl?: string;
  lastVerifiedAt?: string;
}

interface LeaderboardModalProps {
  onClose: () => void;
  onSelectFounder?: (founderId: string) => void;
  onDemoAgent?: (founderId: string) => void;
}

export function LeaderboardModal({
  onClose,
  onSelectFounder,
  onDemoAgent,
}: LeaderboardModalProps) {
  const [tierFilter, setTierFilter] = useState<Tier | "ALL">("ALL");
  const [founders, setFounders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (tier?: string) => {
    setLoading(true);
    try {
      const url = tier && tier !== "ALL" ? `/api/leaderboard?tier=${tier}` : `/api/leaderboard`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.leaderboard) {
        setFounders(data.leaderboard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(tierFilter);
  }, [tierFilter]);

  return (
    <div className="bg-gray-900 border border-white/20 rounded-2xl p-5 text-white shadow-2xl max-w-lg w-full relative backdrop-blur-md">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pr-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Founders Hall of Fame</h3>
            <p className="text-white/40 text-xs">Live 30-day Stripe verified MRR rankings</p>
          </div>
        </div>

        <button
          onClick={() => fetchLeaderboard(tierFilter)}
          className="text-white/40 hover:text-white transition-colors p-1"
          title="Refresh rankings"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tier Filter Tabs */}
      <div className="flex bg-white/5 rounded-xl p-1 mb-3 gap-1 overflow-x-auto">
        {(["ALL", "SCALE", "GROWTH", "STARTER", "FREE"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
              tierFilter === t ? "bg-white/15 text-white shadow-sm" : "text-white/40 hover:text-white"
            }`}
          >
            {t === "ALL" && "All"}
            {t === "SCALE" && "👑 $20K+"}
            {t === "GROWTH" && "🚀 $5K-$20K"}
            {t === "STARTER" && "🤖 $1K-$5K"}
            {t === "FREE" && "🌱 Free"}
          </button>
        ))}
      </div>

      {/* Founders List */}
      <div className="bg-black/40 border border-white/10 rounded-xl max-h-80 overflow-y-auto divide-y divide-white/5">
        {loading ? (
          <div className="py-12 text-center text-white/40 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            <span>Fetching verified founder rankings...</span>
          </div>
        ) : founders.length === 0 ? (
          <div className="py-10 text-center text-white/40 text-xs">
            No founders found in this tier yet. Be the first!
          </div>
        ) : (
          founders.map((f) => (
            <div
              key={f.id}
              className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors gap-3"
            >
              {/* Rank and Info */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-pixel text-[11px] text-white/50 w-5 text-center flex-shrink-0">
                  {f.rank === 1 ? "🥇" : f.rank === 2 ? "🥈" : f.rank === 3 ? "🥉" : `#${f.rank}`}
                </span>

                <div className="w-8 h-8 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center text-base flex-shrink-0">
                  {f.petType === "crown" ? "👑" : f.petType === "rocket" ? "🚀" : f.petType === "robot" ? "🤖" : "🌱"}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{f.name}</span>
                    {f.isOnline && (
                      <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" title="Online now" />
                    )}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {f.startup ? f.startup : "Independent Founder"}
                  </div>
                </div>
              </div>

              {/* Revenue & Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {formatRevenue(f.verifiedRevenueCents)}/mo
                  </div>
                  <TierBadge tier={f.tier} size="sm" />
                </div>

                {f.agentName && onDemoAgent && (
                  <button
                    onClick={() => onDemoAgent(f.id)}
                    className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-colors"
                    title={`Demo ${f.agentName}`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-white/40 font-mono">
        <span>Verified via Stripe Connect & charges</span>
        <span>Re-checked every 24h</span>
      </div>
    </div>
  );
}
