// app/api/livekit/token/route.ts
// POST: Generate a LiveKit JWT token for a player.
// Body: { roomName: string }
// Returns: { token: string }

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomName } = body as { roomName: string };

    if (!roomName || typeof roomName !== "string") {
      return NextResponse.json(
        { error: "roomName is required" },
        { status: 400 }
      );
    }

    // Sanitize room name
    const sanitizedRoom = roomName.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 64);

    const user = session.user;

    // Get profile for metadata
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { tier: true, characterSkin: true, petType: true },
    });

    const metadata = JSON.stringify({
      userId: user.id,
      tier: profile?.tier ?? "FREE",
      characterSkin: profile?.characterSkin ?? "default",
      petType: profile?.petType ?? "plant",
    });

    const token = await generateLiveKitToken({
      roomName: sanitizedRoom,
      participantName: user.name ?? user.email ?? "Founder",
      participantIdentity: user.id,
      metadata,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return NextResponse.json({ token, roomName: sanitizedRoom });
  } catch (error) {
    console.error("[livekit/token]", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
