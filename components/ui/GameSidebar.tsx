// components/ui/GameSidebar.tsx
// Right-side HUD: online players list, chat, character studio, leaderboard, settings.

"use client";

import { useState } from "react";
import {
  Users,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Sparkles,
  Bot,
  Volume2,
} from "lucide-react";
import { TierBadge } from "./TierBadge";
import type { Tier } from "@prisma/client";
import { cn } from "@/lib/utils";

interface OnlinePlayer {
  id: string;
  name: string;
  tier: Tier;
  avatar?: string;
  agentName?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

interface GameSidebarProps {
  localPlayer: {
    name: string;
    tier: Tier;
    revenueCents: number;
    characterSkin: string;
    petType: string;
    agentName?: string;
  };
  onlinePlayers: OnlinePlayer[];
  chatMessages: ChatMessage[];
  currentBuildingRoom?: string | null;
  onSendMessage: (text: string) => void;
  onPlayerClick: (player: OnlinePlayer) => void;
  onOpenCustomizer?: () => void;
  onOpenLeaderboard?: () => void;
  onLeaveBuilding?: () => void;
}

type Tab = "players" | "chat" | "settings";

export function GameSidebar({
  localPlayer,
  onlinePlayers,
  chatMessages,
  currentBuildingRoom,
  onSendMessage,
  onPlayerClick,
  onOpenCustomizer,
  onOpenLeaderboard,
  onLeaveBuilding,
}: GameSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("players");
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  if (collapsed) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <button
          onClick={() => setCollapsed(false)}
          className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 transition-all"
          title="Open sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div
          className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center cursor-pointer"
          onClick={() => {
            setCollapsed(false);
            setActiveTab("players");
          }}
          title="Online founders"
        >
          <span className="text-xs font-bold text-green-400">{onlinePlayers.length + 1}</span>
        </div>
        {onOpenLeaderboard && (
          <button
            onClick={onOpenLeaderboard}
            className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 hover:bg-amber-500/30 transition-all"
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-72 flex flex-col bg-black/85 border-l border-white/10 backdrop-blur-md h-full z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex flex-col min-w-0">
          <span className="text-white font-semibold text-sm truncate">{localPlayer.name}</span>
          <div className="mt-0.5">
            <TierBadge tier={localPlayer.tier} size="sm" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="p-1.5 rounded-lg text-amber-400 hover:bg-white/10 transition-colors"
              title="View Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setCollapsed(true)}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Building Room Alert Banner if inside a building */}
      {currentBuildingRoom && (
        <div className="bg-purple-900/40 border-b border-purple-500/30 px-3 py-2 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-1.5 truncate">
            <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse flex-shrink-0" />
            <span className="truncate font-mono text-[11px]">Room: {currentBuildingRoom}</span>
          </div>
          {onLeaveBuilding && (
            <button
              onClick={onLeaveBuilding}
              className="text-[10px] bg-purple-500/20 hover:bg-purple-500/40 px-2 py-0.5 rounded text-purple-300 transition-colors flex-shrink-0"
            >
              Leave
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(["players", "chat", "settings"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 flex items-center justify-center gap-1 text-xs transition-colors",
              activeTab === tab
                ? "text-white border-b-2 border-blue-400 font-semibold"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {tab === "players" && <Users className="w-3 h-3" />}
            {tab === "chat" && <MessageSquare className="w-3 h-3" />}
            {tab === "settings" && <Settings className="w-3 h-3" />}
            <span className="capitalize">{tab}</span>
            {tab === "players" && (
              <span className="ml-1 bg-green-500/20 text-green-400 px-1.5 rounded-full text-[10px]">
                {onlinePlayers.length + 1}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {/* Players Tab */}
        {activeTab === "players" && (
          <div className="h-full overflow-y-auto p-2 space-y-1">
            {/* Local player entry */}
            <div className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-left">
              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">
                {localPlayer.petType === "crown" ? "👑" : localPlayer.petType === "rocket" ? "🚀" : localPlayer.petType === "robot" ? "🤖" : "🌱"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate flex items-center gap-1">
                  <span>{localPlayer.name}</span>
                  <span className="text-[10px] text-blue-400 font-mono">(you)</span>
                </div>
                <TierBadge tier={localPlayer.tier} size="sm" className="mt-0.5" />
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
            </div>

            {/* Remote players */}
            {onlinePlayers.length === 0 ? (
              <div className="text-white/30 text-xs text-center py-8">
                No other founders nearby yet.
              </div>
            ) : (
              onlinePlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPlayerClick(p)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                    {getTierEmoji(p.tier)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{p.name}</div>
                    <TierBadge tier={p.tier} size="sm" className="mt-0.5" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-xs">
                  <span className="text-blue-400 font-semibold">{msg.senderName}: </span>
                  <span className="text-white/80">{msg.text}</span>
                  <div className="text-white/20 text-[10px] mt-0.5">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="text-white/30 text-xs text-center py-6">
                  Say hi to founders in your proximity!
                </div>
              )}
            </div>
            <div className="p-2 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Say something..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400/50"
                  maxLength={200}
                />
                <button
                  onClick={handleSendChat}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-bold"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings / Studio Tab */}
        {activeTab === "settings" && (
          <div className="p-3 space-y-4 overflow-y-auto h-full">
            {/* Founder Studio Button */}
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Founder Studio</div>
              {onOpenCustomizer && (
                <button
                  onClick={onOpenCustomizer}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-all text-left text-purple-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Customize Avatar & Agent</div>
                      <div className="text-[10px] text-white/50">Skin, outfit, companion pet, webhook</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>
              )}
            </div>

            {/* Leaderboard Button */}
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Rankings</div>
              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all text-left text-amber-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Founders Hall of Fame</div>
                      <div className="text-[10px] text-white/50">Top verified MRR founders</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>
              )}
            </div>

            {/* Controls Guide */}
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Controls & Hotkeys</div>
              <div className="space-y-1.5 text-xs text-white/60 bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between items-center">
                  <span>Walk</span>
                  <span className="font-mono text-white/40 text-[11px] bg-white/5 px-1.5 py-0.5 rounded">WASD / Arrows</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Talk (Proximity)</span>
                  <span className="font-mono text-white/40 text-[11px] bg-white/5 px-1.5 py-0.5 rounded">Space</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Move to point</span>
                  <span className="font-mono text-white/40 text-[11px] bg-white/5 px-1.5 py-0.5 rounded">Left Click</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Founder Card</span>
                  <span className="font-mono text-white/40 text-[11px] bg-white/5 px-1.5 py-0.5 rounded">Click Player</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTierEmoji(tier: Tier): string {
  const emojis: Record<Tier, string> = { FREE: "🌱", STARTER: "🤖", GROWTH: "🚀", SCALE: "👑" };
  return emojis[tier] ?? "🌱";
}
