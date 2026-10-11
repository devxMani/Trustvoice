// app/api/cron/reverify/route.ts
// GET or POST: Automatically re-verify revenue for all founders active in the last 30 days
// Supports Vercel Cron jobs via `Authorization: Bearer <CRON_SECRET>`

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRevenueWithApiKey,
  verifyRevenueWithConnect,
} from "@/lib/stripe";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  // Check authorization header
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find profiles with Stripe credentials that haven't been verified in > 24 hours
    const profilesToVerify = await prisma.profile.findMany({
      where: {
        OR: [
          { stripeAccountId: { not: null } },
          { stripeApiKey: { not: null } },
        ],
        AND: [
          {
            OR: [
              { lastVerifiedAt: null },
              { lastVerifiedAt: { lt: twentyFourHoursAgo } },
            ],
          },
        ],
      },
      take: 50, // Batch limit per cron run
    });

    const results = {
      totalFound: profilesToVerify.length,
      successCount: 0,
      tierChangedCount: 0,
      errors: [] as { userId: string; error: string }[],
    };

    for (const profile of profilesToVerify) {
      try {
        let revResult;
        if (profile.stripeAccountId) {
          revResult = await verifyRevenueWithConnect(profile.stripeAccountId);
        } else if (profile.stripeApiKey) {
          revResult = await verifyRevenueWithApiKey(profile.stripeApiKey);
        } else {
          continue;
        }

        const tierChanged = profile.tier !== revResult.tier;

        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            verifiedRevenueCents: revResult.revenueCents,
            tier: revResult.tier,
            lastVerifiedAt: revResult.verifiedAt,
          },
        });

        results.successCount++;
        if (tierChanged) results.tierChangedCount++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.errors.push({ userId: profile.userId, error: errorMsg });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error: unknown) {
    console.error("[cron/reverify]", error);
    const errorMsg = error instanceof Error ? error.message : "Cron execution failed";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
