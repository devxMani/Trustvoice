// app/api/stripe/callback/route.ts
// OAuth callback for Stripe Connect

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, verifyRevenueWithConnect } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  // Validate state = userId
  if (state !== session.user.id) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=no_code", req.url)
    );
  }

  try {
    // Exchange code for access token
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const stripeAccountId = response.stripe_user_id;
    if (!stripeAccountId) throw new Error("No account ID returned");

    // Verify revenue immediately
    const result = await verifyRevenueWithConnect(stripeAccountId);

    // Save to profile
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        stripeAccountId,
        verifiedRevenueCents: result.revenueCents,
        tier: result.tier,
        lastVerifiedAt: result.verifiedAt,
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard?connected=true", req.url)
    );
  } catch (err) {
    console.error("[stripe/callback]", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=connection_failed", req.url)
    );
  }
}
