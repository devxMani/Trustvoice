// components/voice/SpatialAudio.tsx
// Manages LiveKit spatial audio: adjusts volume of remote participants
// based on their distance from the local player in the game world.

"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { RemoteParticipant, Track, RoomEvent } from "livekit-client";
import { spatialVolume } from "@/lib/utils";
import type { PlayerState } from "@/lib/phaser/scenes/WorldScene";

interface SpatialAudioProps {
  /** Map of participant identity → their current world position */
  participantPositions: Map<string, { x: number; y: number }>;
  localPosition: { x: number; y: number };
  maxDistance?: number;
  enabled?: boolean;
}

export function SpatialAudio({
  participantPositions,
  localPosition,
  maxDistance = 200,
  enabled = true,
}: SpatialAudioProps) {
  const participants = useParticipants();
  const room = useRoomContext();
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const updateVolumes = useCallback(() => {
    if (!enabled) return;

    participants.forEach((participant) => {
      if (!(participant instanceof RemoteParticipant)) return;

      const pos = participantPositions.get(participant.identity);
      if (!pos) return;

      const dist = Math.sqrt(
        (pos.x - localPosition.x) ** 2 +
        (pos.y - localPosition.y) ** 2
      );

      const volume = spatialVolume(dist, maxDistance);

      // Set volume on all audio tracks of this participant
      participant.getTrackPublications().forEach((pub) => {
        if (pub.kind === Track.Kind.Audio && pub.track) {
          const audioEl = audioElementsRef.current.get(
            `${participant.identity}-${pub.trackSid}`
          );
          if (audioEl) {
            audioEl.volume = volume;
          }
          // Also set via livekit API if available
          if (pub.track && "setVolume" in pub.track) {
            (pub.track as { setVolume: (v: number) => void }).setVolume(volume);
          }
        }
      });
    });
  }, [participants, participantPositions, localPosition, maxDistance, enabled]);

  // Update volumes every 100ms
  useEffect(() => {
    const interval = setInterval(updateVolumes, 100);
    return () => clearInterval(interval);
  }, [updateVolumes]);

  // Manage audio elements for tracks
  useEffect(() => {
    const handleTrackSubscribed = (
      _track: Track,
      publication: { trackSid: string },
      participant: RemoteParticipant
    ) => {
      const key = `${participant.identity}-${publication.trackSid}`;
      // Audio elements managed by LiveKit's AudioRenderer; we just track the ref
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed as Parameters<typeof room.on>[1]);
    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed as Parameters<typeof room.on>[1]);
    };
  }, [room]);

  // This component renders nothing — it's pure logic
  return null;
}
