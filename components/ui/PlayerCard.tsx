// components/ui/PlayerCard.tsx
// Profile card shown when clicking on another player.

"use client";

import { useState } from "react";
import { X, Phone, Bot, Twitter, Linkedin } from "lucide-react";
import { TierBadge } from "./TierBadge";
import { Button } from "./button";
import type { PlayerState } from "@/lib/phaser/scenes/WorldScene";
import type { Tier } from "@/lib/tiers";

interface PlayerCardProps {
  player: PlayerState & {
    startup?: string;
    bio?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    agentName?: string;
  };
  onClose: () => void;
  onStartVoiceCall: (playerId: string) => void;
  onDemoAgent: (playerId: string) => void;
}

export function PlayerCard({
  player,
  onClose,
  onStartVoiceCall,
  onDemoAgent,
}: PlayerCardProps) {
  const [isCallingAgent, setIsCallingAgent] = useState(false);

  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-72 overflow-hidden">
      {/* Header */}
      <div
        className="relative p-4 pb-3"
        style={{ background: "linear-gradient(135deg, #1e3a5f, #0d1b2a)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl border-2 border-white/20 bg-gray-700 flex items-center justify-center text-2xl"
            style={{ imageRendering: "pixelated" }}
          >
            {getTierEmoji(player.tier)}
          </div>
          <div>
            <div className="font-bold text-white text-base">{player.name}</div>
            {player.startup && (
              <div className="text-white/60 text-xs mt-0.5">{player.startup}</div>
            )}
            <div className="mt-1">
              <TierBadge tier={player.tier as Tier} size="sm" />
            </div>
          </div>
        </div>

        {/* Bio */}
        {player.bio && (
          <p className="text-white/60 text-xs mt-3 leading-relaxed">{player.bio}</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <Button
          className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20"
          variant="ghost"
          size="sm"
          onClick={() => onStartVoiceCall(player.id)}
        >
          <Phone className="w-4 h-4 mr-2" />
          Start Voice Call
        </Button>

        <Button
          className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20"
          variant="ghost"
          size="sm"
          onClick={() => {
            onDemoAgent(player.id);
          }}
        >
          <Bot className="w-4 h-4 mr-2" />
          {player.agentName ? `Demo: ${player.agentName}` : "Demo Voice Agent"}
        </Button>

        {/* Social links */}
        <div className="flex gap-2 pt-1">
          {player.twitterUrl && (
            <a
              href={player.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-blue-400 transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {player.linkedinUrl && (
            <a
              href={player.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-blue-400 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function getTierEmoji(tier: string): string {
  const emojis: Record<string, string> = {
    FREE: "🌱",
    STARTER: "🤖",
    GROWTH: "🚀",
    SCALE: "👑",
  };
  return emojis[tier] ?? "🌱";
}
