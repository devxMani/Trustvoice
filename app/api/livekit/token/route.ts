// app/api/livekit/token/route.ts
// POST: Generate a LiveKit JWT token for a player (supports guests & signed-in founders)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/livekit";

export async function POST(req: NextRequest) {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {
      // Guest mode
    }

    const body = await req.json().catch(() => ({}));
    const { roomName } = body as { roomName?: string };

    const targetRoom = roomName || "world-main";
    const sanitizedRoom = targetRoom.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 64);

    const userId = session?.user?.id || "founder-guest-" + Math.random().toString(36).substring(7);
    const userName = session?.user?.name || "Marc Lou";

    let profile = null;
    if (session?.user?.id) {
      try {
        profile = await prisma.profile.findUnique({
          where: { userId: session.user.id },
          select: { tier: true, characterSkin: true, petType: true },
        });
      } catch {
        // DB optional
      }
    }

    const metadata = JSON.stringify({
      userId,
      tier: profile?.tier ?? "SCALE",
      characterSkin: profile?.characterSkin ?? "0",
      petType: profile?.petType ?? "crown",
    });

    // Check if LiveKit credentials exist; if not, return a mock JWT so game loads cleanly
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return NextResponse.json({
        token: "demo-guest-token-" + Date.now(),
        roomName: sanitizedRoom,
        isDemo: true,
      });
    }

    const token = await generateLiveKitToken({
      roomName: sanitizedRoom,
      participantName: userName,
      participantIdentity: userId,
      metadata,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return NextResponse.json({ token, roomName: sanitizedRoom });
  } catch (error) {
    console.error("[livekit/token]", error);
    // Return demo token on failure so the client always renders the world
    return NextResponse.json({
      token: "fallback-demo-token-" + Date.now(),
      roomName: "world-main",
    });
  }
}
