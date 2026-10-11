// app/api/stripe/verify/route.ts
// POST: Verify Stripe revenue for the logged-in user.
// Accepts: { apiKey?: string } — if provided, uses user's key.
//          If user has stripeAccountId (Connect), uses that.
// Returns: { revenueCents, tier, chargeCount, verifiedAt }

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  verifyRevenueWithApiKey,
  verifyRevenueWithConnect,
} from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const { apiKey } = body as { apiKey?: string };

    // Get the user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Choose verification method
    let result;

    if (apiKey) {
      // Validate key format
      if (!apiKey.startsWith("sk_")) {
        return NextResponse.json(
          { error: "Invalid Stripe API key format. Must start with sk_" },
          { status: 400 }
        );
      }
      result = await verifyRevenueWithApiKey(apiKey);

      // Store the encrypted key (in production, encrypt this!)
      await prisma.profile.update({
        where: { userId },
        data: { stripeApiKey: apiKey },
      });
    } else if (profile.stripeAccountId) {
      result = await verifyRevenueWithConnect(profile.stripeAccountId);
    } else if (profile.stripeApiKey) {
      result = await verifyRevenueWithApiKey(profile.stripeApiKey);
    } else {
      return NextResponse.json(
        { error: "No Stripe credentials connected. Please connect Stripe first." },
        { status: 400 }
      );
    }

    // Update profile with verified data
    await prisma.profile.update({
      where: { userId },
      data: {
        verifiedRevenueCents: result.revenueCents,
        tier: result.tier,
        lastVerifiedAt: result.verifiedAt,
      },
    });

    return NextResponse.json({
      revenueCents: result.revenueCents,
      tier: result.tier,
      chargeCount: result.chargeCount,
      verifiedAt: result.verifiedAt.toISOString(),
    });
  } catch (error) {
    console.error("[stripe/verify]", error);
    const message =
      error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
