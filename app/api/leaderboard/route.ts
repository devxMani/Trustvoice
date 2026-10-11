// app/api/leaderboard/route.ts
// GET: Returns top verified founders ranked by 30-day verified revenue

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Tier } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tierFilter = searchParams.get("tier") as Tier | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const profiles = await prisma.profile.findMany({
      where: {
        ...(tierFilter ? { tier: tierFilter } : {}),
      },
      orderBy: {
        verifiedRevenueCents: "desc",
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    const leaderboard = profiles.map((p, index) => ({
      rank: index + 1,
      id: p.userId,
      name: p.user.name || "Anonymous Founder",
      image: p.user.image,
      verifiedRevenueCents: p.verifiedRevenueCents,
      tier: p.tier,
      startup: p.startup,
      agentName: p.agentName,
      petType: p.petType,
      isOnline: p.isOnline && p.lastSeen >= fiveMinutesAgo,
      twitterUrl: p.twitterUrl,
      lastVerifiedAt: p.lastVerifiedAt,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("[leaderboard]", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
