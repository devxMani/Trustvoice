// app/api/player/position/route.ts
// POST: Update player position (stored in DB for persistence, sync via LiveKit data)
// GET:  Get all online players' positions

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { x, y } = body as { x: number; y: number };

  if (typeof x !== "number" || typeof y !== "number") {
    return NextResponse.json({ error: "x, y required" }, { status: 400 });
  }

  await prisma.profile.update({
    where: { userId: session.user.id },
    data: {
      positionX: x,
      positionY: y,
      lastSeen: new Date(),
      isOnline: true,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get players seen in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const players = await prisma.profile.findMany({
    where: {
      isOnline: true,
      lastSeen: { gte: fiveMinutesAgo },
      NOT: { userId: session.user.id },
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
