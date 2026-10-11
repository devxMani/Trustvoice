// components/game/PhaserGame.tsx
// React wrapper for the Phaser game engine.
// Uses a portal-style approach to keep the canvas outside React's tree.

"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Game } from "phaser";
import type { PlayerState, WorldScene as WorldSceneType } from "@/lib/phaser/scenes/WorldScene";
import type { Tier } from "@prisma/client";

interface PhaserGameProps {
  playerData: PlayerState;
  onProximity: (playerId: string | null) => void;
  onPositionUpdate: (x: number, y: number, direction: string) => void;
  onBuildingEnter: (buildingId: string) => void;
  onPlayerClick: (player: PlayerState) => void;
  className?: string;
}

// Store a ref to the world scene so React can call imperative methods on it
export type WorldSceneRef = {
  addOrUpdateRemotePlayer: (data: PlayerState) => void;
  removeRemotePlayer: (id: string) => void;
  showChatBubble: (playerId: string, text: string) => void;
  updatePlayerTier: (tier: Tier) => void;
};

export function PhaserGame({
  playerData,
  onProximity,
  onPositionUpdate,
  onBuildingEnter,
  onPlayerClick,
  className,
}: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const worldSceneRef = useRef<WorldSceneType | null>(null);

  // Expose imperative handle via a DOM custom event (simpler than forwardRef here)
  const getWorldScene = useCallback((): WorldSceneType | null => {
    return worldSceneRef.current;
  }, []);

  // Attach the ref to the window for external React access (simple approach)
  useEffect(() => {
    (window as Window & { __trustVoiceScene?: WorldSceneType | null }).__trustVoiceScene = null;
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Dynamic import of Phaser (client-only)
    let game: Game;

    async function initPhaser() {
      const Phaser = (await import("phaser")).default;
      const { BootScene } = await import("@/lib/phaser/scenes/BootScene");
      const { WorldScene } = await import("@/lib/phaser/scenes/WorldScene");

      const worldScene = new WorldScene();
      worldScene.setPlayerData(playerData);
      worldScene.onProximity = onProximity;
      worldScene.onPositionUpdate = onPositionUpdate;
      worldScene.onBuildingEnter = onBuildingEnter;

      worldSceneRef.current = worldScene;
      (window as Window & { __trustVoiceScene?: WorldSceneType | null }).__trustVoiceScene = worldScene;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current!,
        width: "100%",
        height: "100%",
        backgroundColor: "#3a5c2a",
        scene: [BootScene, worldScene],
        physics: {
          default: "arcade",
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        render: {
          pixelArt: true,
          antialias: false,
          roundPixels: true,
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        dom: {
          createContainer: true,
        },
      });

      gameRef.current = game;

      // Listen for player click events
      game.events.on("player-click", onPlayerClick);
    }

    initPhaser().catch(console.error);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        worldSceneRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update callbacks when they change (without restarting the game)
  useEffect(() => {
    if (worldSceneRef.current) {
      worldSceneRef.current.onProximity = onProximity;
      worldSceneRef.current.onPositionUpdate = onPositionUpdate;
      worldSceneRef.current.onBuildingEnter = onBuildingEnter;
    }
  }, [onProximity, onPositionUpdate, onBuildingEnter]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
}

// Helper hook to get the world scene imperatively
export function useWorldScene(): WorldSceneType | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { __trustVoiceScene?: WorldSceneType | null }).__trustVoiceScene ?? null;
}
