// components/voice/VoiceControls.tsx
// Mute/unmute, push-to-talk, and room info controls.

"use client";

import { useState, useCallback } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VoiceControlsProps {
  onLeave?: () => void;
  roomName?: string;
  participantCount?: number;
}

export function VoiceControls({
  onLeave,
  roomName,
  participantCount,
}: VoiceControlsProps) {
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(async () => {
    const enabled = localParticipant.isMicrophoneEnabled;
    await localParticipant.setMicrophoneEnabled(!enabled);
    setIsMuted(!!enabled);
  }, [localParticipant]);

  return (
    <div className="flex items-center gap-2 bg-black/80 rounded-xl px-4 py-2 border border-white/10 backdrop-blur-sm">
      {/* Room info */}
      {roomName && (
        <div className="flex items-center gap-1 text-xs text-white/60 mr-2">
          <Volume2 className="w-3 h-3" />
          <span className="font-mono">{roomName}</span>
          {participantCount !== undefined && (
            <span className="text-white/40">· {participantCount}</span>
          )}
        </div>
      )}

      {/* Mute toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMute}
        className={cn(
          "rounded-full w-10 h-10 p-0",
          isMuted
            ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
            : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
        )}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>

      {/* Leave */}
      {onLeave && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLeave}
          className="rounded-full w-10 h-10 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400"
          title="Leave voice"
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
