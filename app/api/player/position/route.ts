// app/api/player/position/route.ts
// POST: Update player position (stored in DB for persistence, sync via LiveKit data)
// GET:  Get all online players' positions

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Guest mode
  }

  const body = await req.json().catch(() => ({}));
  const { x, y } = body as { x: number; y: number };

  if (typeof x !== "number" || typeof y !== "number") {
    return NextResponse.json({ error: "x, y required" }, { status: 400 });
  }

  if (session?.user?.id) {
    try {
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: {
          positionX: x,
          positionY: y,
          lastSeen: new Date(),
          isOnline: true,
        },
      });
    } catch {
      // DB optional
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Guest mode
  }

  // Get players seen in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const players = await prisma.profile.findMany({
    where: {
      isOnline: true,
      lastSeen: { gte: fiveMinutesAgo },
      ...(session?.user?.id ? { NOT: { userId: session.user.id } } : {}),
    },
    select: {
      userId: true,
      positionX: true,
      positionY: true,
      tier: true,
      characterSkin: true,
      characterOutfit: true,
      petType: true,
      agentName: true,
      startup: true,
      bio: true,
      user: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json({ players });
}
