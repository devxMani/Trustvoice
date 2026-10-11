// app/world/WorldClient.tsx
// Main game client: Phaser + LiveKit + real-time multiplayer + radar + modals

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import "@livekit/components-styles";

import { GameSidebar } from "@/components/ui/GameSidebar";
import { PlayerCard } from "@/components/ui/PlayerCard";
import { VoiceControls } from "@/components/voice/VoiceControls";
import { SpatialAudio } from "@/components/voice/SpatialAudio";
import { Minimap } from "@/components/game/Minimap";
import { CharacterCustomizer } from "@/components/ui/CharacterCustomizer";
import { AgentDemoModal } from "@/components/ui/AgentDemoModal";
import { LeaderboardModal } from "@/components/ui/LeaderboardModal";
import { getZoneRoomName } from "@/lib/livekit";
import type { Tier } from "@prisma/client";
import type { PlayerState } from "@/lib/phaser/scenes/WorldScene";

// Dynamic import of PhaserGame (client-only, no SSR)
const PhaserGame = dynamic(
  () => import("@/components/game/PhaserGame").then((m) => ({ default: m.PhaserGame })),
  { ssr: false, loading: () => <GameLoadingScreen /> }
);

interface WorldClientProps {
  initialPlayer: {
    id: string;
    name: string;
    email: string;
    image?: string;
    tier: Tier;
    revenueCents: number;
    characterSkin: string;
    characterOutfit: string;
    petType: string;
    agentWebhookUrl?: string;
    agentName?: string;
    positionX: number;
    positionY: number;
    startup?: string;
    bio?: string;
  };
  livekitUrl: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

// LiveKit data message types
type DataMsgType = "position" | "chat" | "presence";
interface DataMsg {
  type: DataMsgType;
  payload: unknown;
}

// LiveKit internal data channel listener component
function LiveKitDataListener({
  onDataReceived,
}: {
  onDataReceived: (data: Uint8Array, participant?: any) => void;
}) {
  const room = useRoomContext();
  useEffect(() => {
    room.on(RoomEvent.DataReceived, onDataReceived as any);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived as any);
    };
  }, [room, onDataReceived]);
  return null;
}

export function WorldClient({ initialPlayer, livekitUrl }: WorldClientProps) {
  const [livekitToken, setLivekitToken] = useState<string>("");
  const [currentRoom, setCurrentRoom] = useState("world-main");
  const [currentBuildingRoom, setCurrentBuildingRoom] = useState<string | null>(null);

  // Player customization state
  const [playerState, setPlayerState] = useState({
    characterSkin: initialPlayer.characterSkin,
    characterOutfit: initialPlayer.characterOutfit,
    petType: initialPlayer.petType,
    agentName: initialPlayer.agentName,
    agentWebhookUrl: initialPlayer.agentWebhookUrl,
    startup: initialPlayer.startup,
    bio: initialPlayer.bio,
  });

  const [participantPositions, setParticipantPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const [localPosition, setLocalPosition] = useState({
    x: initialPlayer.positionX,
    y: initialPlayer.positionY,
  });
  const [remotePlayers, setRemotePlayers] = useState<PlayerState[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerState | null>(null);
  const [nearbyPlayerId, setNearbyPlayerId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inVoice, setInVoice] = useState(false);

  // Modal states
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [demoAgentTarget, setDemoAgentTarget] = useState<{
    id: string;
    name: string;
    agentName?: string;
    startup?: string;
  } | null>(null);

  // ─── LiveKit Token ─────────────────────────────────────────────────────────

  const fetchToken = useCallback(async (roomName: string) => {
    const res = await fetch("/api/livekit/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName }),
    });
    const data = await res.json();
    return data.token as string;
  }, []);

  useEffect(() => {
    const roomName = getZoneRoomName("main");
    fetchToken(roomName).then(setLivekitToken);
  }, [fetchToken]);

  // ─── Phaser Callbacks ──────────────────────────────────────────────────────

  const handlePositionUpdate = useCallback(
    (x: number, y: number, direction: string) => {
      setLocalPosition({ x, y });

      // Broadcast via LiveKit data channel
      const msg: DataMsg = {
        type: "position",
        payload: {
          id: initialPlayer.id,
          x,
          y,
          direction,
          tier: initialPlayer.tier,
          name: initialPlayer.name,
          petType: playerState.petType,
          characterSkin: playerState.characterSkin,
          characterOutfit: playerState.characterOutfit,
          agentName: playerState.agentName,
          startup: playerState.startup,
        },
      };

      window.dispatchEvent(
        new CustomEvent("trustvoice-send-data", { detail: msg })
      );
    },
    [initialPlayer, playerState]
  );

  const handleProximity = useCallback((playerId: string | null) => {
    setNearbyPlayerId(playerId);
  }, []);

  // Enter building room voice channel
  const handleBuildingEnter = useCallback(
    async (buildingId: string) => {
      const roomName = `trustvoice-building-${buildingId}`;
      const token = await fetchToken(roomName);
      setLivekitToken(token);
      setCurrentRoom(buildingId);
      setCurrentBuildingRoom(buildingId);
      setInVoice(true);
    },
    [fetchToken]
  );

  // Leave building room and return to world audio
  const handleLeaveBuilding = useCallback(async () => {
    const roomName = getZoneRoomName("main");
    const token = await fetchToken(roomName);
    setLivekitToken(token);
    setCurrentRoom("world-main");
    setCurrentBuildingRoom(null);
  }, [fetchToken]);

  const handlePlayerClick = useCallback((player: PlayerState) => {
    setSelectedPlayer(player);
  }, []);

  // ─── LiveKit Data Handlers ─────────────────────────────────────────────────

  const handleDataReceived = useCallback(
    (data: Uint8Array, participant: { identity: string } | undefined) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(data)) as DataMsg;

        if (msg.type === "position") {
          const pos = msg.payload as PlayerState;

          // Update Phaser scene
          const scene = (window as Window & { __trustVoiceScene?: { addOrUpdateRemotePlayer: (d: PlayerState) => void } }).__trustVoiceScene;
          if (scene) {
            scene.addOrUpdateRemotePlayer(pos);
          }

          // Update position map for spatial audio
          setParticipantPositions((prev) => {
            const next = new Map(prev);
            next.set(pos.id, { x: pos.x, y: pos.y });
            return next;
          });

          // Update remote players list
          setRemotePlayers((prev) => {
            const idx = prev.findIndex((p) => p.id === pos.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = pos;
              return next;
            }
            return [...prev, pos];
          });
        } else if (msg.type === "chat") {
          const chat = msg.payload as { text: string; senderName: string };
          const senderId = participant?.identity ?? "unknown";

          setChatMessages((prev) => [
            ...prev.slice(-99),
            {
              id: `${Date.now()}-${senderId}`,
              senderId,
              senderName: chat.senderName,
              text: chat.text,
              timestamp: new Date(),
            },
          ]);

          // Show chat bubble in game
          const scene = (window as Window & { __trustVoiceScene?: { showChatBubble: (id: string, text: string) => void } }).__trustVoiceScene;
          if (scene) {
            scene.showChatBubble(senderId, chat.text);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    },
    []
  );

  // ─── Chat ──────────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    (text: string) => {
      const msg: DataMsg = {
        type: "chat",
        payload: { text, senderName: initialPlayer.name },
      };
      window.dispatchEvent(
        new CustomEvent("trustvoice-send-data", { detail: msg })
      );

      // Show own bubble
      const scene = (window as Window & { __trustVoiceScene?: { showChatBubble: (id: string, text: string) => void } }).__trustVoiceScene;
      if (scene) scene.showChatBubble(initialPlayer.id, text);

      setChatMessages((prev) => [
        ...prev.slice(-99),
        {
          id: `${Date.now()}-local`,
          senderId: initialPlayer.id,
          senderName: initialPlayer.name + " (you)",
          text,
          timestamp: new Date(),
        },
      ]);
    },
    [initialPlayer]
  );

  // ─── Voice Call ────────────────────────────────────────────────────────────

  const handleStartVoiceCall = useCallback(
    async (playerId: string) => {
      const roomName = `trustvoice-prox-${[initialPlayer.id, playerId]
        .sort()
        .join("-")}`;
      const token = await fetchToken(roomName);
      setLivekitToken(token);
      setInVoice(true);
      setSelectedPlayer(null);
    },
    [fetchToken, initialPlayer.id]
  );

  // ─── Demo Agent Trigger ───────────────────────────────────────────────────

  const handleDemoAgent = useCallback((playerId: string) => {
    const player = remotePlayers.find((p) => p.id === playerId);
    if (player) {
      setDemoAgentTarget({
        id: player.id,
        name: player.name,
        agentName: (player as unknown as { agentName?: string }).agentName,
        startup: (player as unknown as { startup?: string }).startup,
      });
    } else if (playerId === initialPlayer.id) {
      setDemoAgentTarget({
        id: initialPlayer.id,
        name: initialPlayer.name,
        agentName: playerState.agentName,
        startup: playerState.startup,
      });
    }
    setSelectedPlayer(null);
  }, [remotePlayers, initialPlayer, playerState]);

  // ─── Player data for Phaser ────────────────────────────────────────────────

  const playerDataForPhaser: PlayerState = {
    id: initialPlayer.id,
    name: initialPlayer.name,
    x: initialPlayer.positionX,
    y: initialPlayer.positionY,
    direction: "down",
    isMoving: false,
    tier: initialPlayer.tier,
    characterSkin: playerState.characterSkin,
    characterOutfit: playerState.characterOutfit,
    petType: playerState.petType,
  };

  return (
    <div className="w-screen h-screen bg-gray-950 flex overflow-hidden select-none">
      {/* Game canvas area */}
      <div className="flex-1 relative">
        {livekitToken ? (
          <LiveKitRoom
            token={livekitToken}
            serverUrl={livekitUrl}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => setInVoice(false)}
            className="absolute inset-0"
          >
            {/* LiveKit data message subscriber */}
            <LiveKitDataListener onDataReceived={handleDataReceived} />

            {/* Render remote audio tracks */}
            <RoomAudioRenderer />

            {/* Spatial audio logic (only active when in world, not inside private building room) */}
            <SpatialAudio
              participantPositions={participantPositions}
              localPosition={localPosition}
              maxDistance={200}
              enabled={!currentBuildingRoom}
            />

            {/* Phaser Game */}
            <PhaserGame
              playerData={playerDataForPhaser}
              onProximity={handleProximity}
              onPositionUpdate={handlePositionUpdate}
              onBuildingEnter={handleBuildingEnter}
              onPlayerClick={handlePlayerClick}
              className="absolute inset-0 w-full h-full"
            />

            {/* Proximity hint */}
            {nearbyPlayerId && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="proximity-hint bg-black/85 text-white text-xs px-4 py-2 rounded-full border border-white/20 font-mono backdrop-blur-md shadow-xl flex items-center gap-2">
                  <span>Founder in range!</span>
                  <span>Press <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">SPACE</kbd> to talk</span>
                </div>
              </div>
            )}

            {/* Voice controls (bottom center) */}
            {inVoice && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                <VoiceControls
                  roomName={currentRoom}
                  onLeave={() => {
                    setInVoice(false);
                    if (currentBuildingRoom) handleLeaveBuilding();
                  }}
                />
              </div>
            )}

            {/* Minimap Radar (bottom right of game view) */}
            <div className="absolute bottom-5 right-5 z-40 hidden sm:block">
              <Minimap
                playerPosition={localPosition}
                remotePlayers={remotePlayers}
                currentTier={initialPlayer.tier}
              />
            </div>

            {/* Mobile Touch Controls */}
            <MobileTouchControls />

            {/* Top HUD Bar */}
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
              <div className="bg-black/75 rounded-xl px-3.5 py-2 border border-white/10 backdrop-blur-md flex items-center gap-2">
                <span className="font-pixel text-xs text-white">🎙️ TrustVoice</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                  {currentBuildingRoom ? `Room: ${currentBuildingRoom}` : "Spatial World"}
                </span>
              </div>

              {/* Quick Hall of Fame Button */}
              <button
                onClick={() => setShowLeaderboard(true)}
                className="bg-black/75 hover:bg-black/90 text-amber-300 border border-amber-500/30 rounded-xl px-3 py-2 text-xs backdrop-blur-md flex items-center gap-1.5 transition-all shadow-md font-semibold"
              >
                <span>🏆 Leaderboard</span>
              </button>

              {/* Quick Studio Button */}
              <button
                onClick={() => setShowCustomizer(true)}
                className="bg-black/75 hover:bg-black/90 text-purple-300 border border-purple-500/30 rounded-xl px-3 py-2 text-xs backdrop-blur-md flex items-center gap-1.5 transition-all shadow-md font-semibold"
              >
                <span>✨ Studio</span>
              </button>
            </div>
          </LiveKitRoom>
        ) : (
          <GameLoadingScreen />
        )}

        {/* Modal: Player Profile Card */}
        {selectedPlayer && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <PlayerCard
              player={selectedPlayer}
              onClose={() => setSelectedPlayer(null)}
              onStartVoiceCall={handleStartVoiceCall}
              onDemoAgent={handleDemoAgent}
            />
          </div>
        )}

        {/* Modal: Voice Agent Demo Tester */}
        {demoAgentTarget && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <AgentDemoModal
              targetUserId={demoAgentTarget.id}
              agentName={demoAgentTarget.agentName}
              founderName={demoAgentTarget.name}
              startup={demoAgentTarget.startup}
              onClose={() => setDemoAgentTarget(null)}
            />
          </div>
        )}

        {/* Modal: Founder Studio Customizer */}
        {showCustomizer && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <CharacterCustomizer
              initialSkin={playerState.characterSkin}
              initialOutfit={playerState.characterOutfit}
              initialPet={playerState.petType}
              initialAgentName={playerState.agentName}
              initialAgentWebhookUrl={playerState.agentWebhookUrl}
              initialStartup={playerState.startup}
              initialBio={playerState.bio}
              onSaveSuccess={(updated) => {
                setPlayerState((prev) => ({ ...prev, ...updated }));
              }}
              onClose={() => setShowCustomizer(false)}
            />
          </div>
        )}

        {/* Modal: Founders Hall of Fame Leaderboard */}
        {showLeaderboard && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <LeaderboardModal
              onClose={() => setShowLeaderboard(false)}
              onDemoAgent={(targetId) => {
                setShowLeaderboard(false);
                handleDemoAgent(targetId);
              }}
            />
          </div>
        )}
      </div>

      {/* Sidebar */}
      <GameSidebar
        localPlayer={{
          name: initialPlayer.name,
          tier: initialPlayer.tier,
          revenueCents: initialPlayer.revenueCents,
          characterSkin: playerState.characterSkin,
          petType: playerState.petType,
          agentName: playerState.agentName,
        }}
        onlinePlayers={remotePlayers.map((p) => ({
          id: p.id,
          name: p.name,
          tier: p.tier,
          agentName: (p as unknown as { agentName?: string }).agentName,
        }))}
        chatMessages={chatMessages}
        currentBuildingRoom={currentBuildingRoom}
        onSendMessage={handleSendMessage}
        onPlayerClick={(p) => setSelectedPlayer(remotePlayers.find((r) => r.id === p.id) ?? null)}
        onOpenCustomizer={() => setShowCustomizer(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onLeaveBuilding={handleLeaveBuilding}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GameLoadingScreen() {
  return (
    <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="font-pixel text-2xl text-yellow-400 animate-pulse">
        🎮 TrustVoice
      </div>
      <div className="text-gray-400 text-sm font-mono">Entering multiplayer world...</div>
      <div className="flex gap-2">
        {["🌱", "🤖", "🚀", "👑"].map((e, i) => (
          <span
            key={i}
            className="text-2xl animate-pixel-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

function MobileTouchControls() {
  const sendMoveEvent = (dir: string | null) => {
    window.dispatchEvent(new CustomEvent("trustvoice-touch", { detail: { dir } }));
  };

  return (
    <div className="md:hidden absolute bottom-24 left-4 z-50">
      <div className="grid grid-cols-3 gap-1">
        <div />
        <button
          onPointerDown={() => sendMoveEvent("up")}
          onPointerUp={() => sendMoveEvent(null)}
          className="touch-btn"
        >
          ▲
        </button>
        <div />
        <button
          onPointerDown={() => sendMoveEvent("left")}
          onPointerUp={() => sendMoveEvent(null)}
          className="touch-btn"
        >
          ◀
        </button>
        <div />
        <button
          onPointerDown={() => sendMoveEvent("right")}
          onPointerUp={() => sendMoveEvent(null)}
          className="touch-btn"
        >
          ▶
        </button>
        <div />
        <button
          onPointerDown={() => sendMoveEvent("down")}
          onPointerUp={() => sendMoveEvent(null)}
          className="touch-btn"
        >
          ▼
        </button>
        <div />
      </div>
    </div>
  );
}
