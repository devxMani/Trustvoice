// lib/livekit.ts — LiveKit server-side token generation
// ⚠️  SERVER-SIDE ONLY
import {
  AccessToken,
  VideoGrant,
  RoomServiceClient,
} from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL!;

export interface TokenOptions {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  /** Extra metadata to attach (JSON string) */
  metadata?: string;
  /** Whether participant can publish audio/video */
  canPublish?: boolean;
  /** Whether participant can subscribe to others */
  canSubscribe?: boolean;
  /** Room-level data channel access */
  canPublishData?: boolean;
}

/**
 * Generate a LiveKit JWT access token for a participant.
 * Must be called server-side.
 */
export async function generateLiveKitToken(
  opts: TokenOptions
): Promise<string> {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: opts.participantIdentity,
    name: opts.participantName,
    metadata: opts.metadata,
    ttl: "2h",
  });

  const grant: VideoGrant = {
    room: opts.roomName,
    roomJoin: true,
    canPublish: opts.canPublish ?? true,
    canSubscribe: opts.canSubscribe ?? true,
    canPublishData: opts.canPublishData ?? true,
  };

  at.addGrant(grant);
  return at.toJwt();
}

/**
 * Get the "world" room name for a specific zone.
 */
export function getZoneRoomName(zone: string): string {
  return `trustvoice-world-${zone.toLowerCase().replace(/\s+/g, "-")}`;
}

/**
 * Get a proximity voice room name (between two players).
 */
export function getProximityRoomName(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `trustvoice-proximity-${sorted[0]}-${sorted[1]}`;
}

/**
 * Get a building/office room name.
 */
export function getBuildingRoomName(buildingId: string): string {
  return `trustvoice-building-${buildingId}`;
}

/**
 * List active rooms via RoomServiceClient.
 */
export async function listActiveRooms() {
  const svc = new RoomServiceClient(
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
  );
  return svc.listRooms();
}
