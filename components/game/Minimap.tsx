// components/game/Minimap.tsx
// Retro pixel radar minimap showing world zones, players, and current location

"use client";

import { useState } from "react";
import { Compass, Maximize2, Minimize2, Users } from "lucide-react";
import { MAP_WIDTH_PX, MAP_HEIGHT_PX, ZONES } from "@/lib/phaser/MapGenerator";
import type { Tier } from "@/lib/tiers";
import type { PlayerState } from "@/lib/phaser/scenes/WorldScene";

interface MinimapProps {
  playerPosition: { x: number; y: number };
  remotePlayers: PlayerState[];
  currentTier: Tier;
  onZoneClick?: (x: number, y: number) => void;
}

export function Minimap({
  playerPosition,
  remotePlayers,
  currentTier,
  onZoneClick,
}: MinimapProps) {
  const [expanded, setExpanded] = useState(false);

  // Compute percentages of map
  const playerPercentX = (playerPosition.x / MAP_WIDTH_PX) * 100;
  const playerPercentY = (playerPosition.y / MAP_HEIGHT_PX) * 100;

  // Determine which zone the player is currently inside
  const isRight = playerPercentX >= 50;
  const isBottom = playerPercentY >= 50;

  let currentZoneName = "Starter Village";
  if (!isRight && !isBottom) currentZoneName = "Starter Village ($0–$1K)";
  else if (isRight && !isBottom) currentZoneName = "Growth Park ($1K–$5K)";
  else if (!isRight && isBottom) currentZoneName = "Scale District ($5K–$20K)";
  else if (isRight && isBottom) currentZoneName = "Whale Lounge ($20K+)";

  const tierOrder: Tier[] = ["FREE", "STARTER", "GROWTH", "SCALE"];
  const playerRank = tierOrder.indexOf(currentTier);

  return (
    <div
      className={`bg-black/85 border border-white/20 rounded-2xl p-2.5 backdrop-blur-md shadow-2xl transition-all duration-300 flex flex-col ${
        expanded ? "w-64 h-64" : "w-44 h-44"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/80">
          <Compass className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-pixel text-[9px] truncate max-w-[100px]">RADAR</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-green-400 font-mono flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5" /> {remotePlayers.length + 1}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-white/40 hover:text-white transition-colors p-0.5"
            title={expanded ? "Minimize radar" : "Expand radar"}
          >
            {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Radar Canvas / Grid */}
      <div className="relative flex-1 rounded-xl bg-gray-950 border border-white/10 overflow-hidden">
        {/* Quadrant Zone Layout */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {/* Starter Village (Top Left) */}
          <div className="border-r border-b border-white/10 bg-[#3a5c2a]/40 relative">
            <span className="absolute top-1 left-1 text-[8px] font-pixel text-white/40">SV</span>
          </div>

          {/* Growth Park (Top Right) */}
          <div
            className={`border-b border-white/10 relative transition-colors ${
              playerRank < 1 ? "bg-black/60" : "bg-[#10b981]/20"
            }`}
          >
            <span className="absolute top-1 right-1 text-[8px] font-pixel text-emerald-400/60">GP</span>
            {playerRank < 1 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-60">🔒</span>
            )}
          </div>

          {/* Scale District (Bottom Left) */}
          <div
            className={`border-r border-white/10 relative transition-colors ${
              playerRank < 2 ? "bg-black/60" : "bg-[#3b82f6]/20"
            }`}
          >
            <span className="absolute bottom-1 left-1 text-[8px] font-pixel text-blue-400/60">SD</span>
            {playerRank < 2 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-60">🔒</span>
            )}
          </div>

          {/* Whale Lounge (Bottom Right) */}
          <div
            className={`relative transition-colors ${
              playerRank < 3 ? "bg-black/60" : "bg-[#f59e0b]/20"
            }`}
          >
            <span className="absolute bottom-1 right-1 text-[8px] font-pixel text-amber-400/60">WL</span>
            {playerRank < 3 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-60">👑</span>
            )}
          </div>
        </div>

        {/* Central Crossroads paths */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-yellow-600/30 -translate-y-1/2 pointer-events-none" />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-600/30 -translate-x-1/2 pointer-events-none" />

        {/* Remote Players Dots */}
        {remotePlayers.map((rp) => {
          const rx = (rp.x / MAP_WIDTH_PX) * 100;
          const ry = (rp.y / MAP_HEIGHT_PX) * 100;
          const colors: Record<Tier, string> = {
            FREE: "bg-gray-400",
            STARTER: "bg-emerald-400",
            GROWTH: "bg-blue-400",
            SCALE: "bg-amber-400",
          };
          return (
            <div
              key={rp.id}
              className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm ${
                colors[rp.tier] || "bg-white"
              }`}
              style={{ left: `${rx}%`, top: `${ry}%` }}
              title={`${rp.name} (${rp.tier})`}
            />
          );
        })}

        {/* Local Player (Pulsing Indicator) */}
        <div
          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10"
          style={{ left: `${playerPercentX}%`, top: `${playerPercentY}%` }}
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400 border border-white"></span>
        </div>
      </div>

      {/* Footer / Location readout */}
      <div className="mt-1.5 px-0.5 flex items-center justify-between text-[9px] text-white/50 font-mono">
        <span className="truncate">{currentZoneName}</span>
        <span>
          {Math.round(playerPosition.x)},{Math.round(playerPosition.y)}
        </span>
      </div>
    </div>
  );
}
