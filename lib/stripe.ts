// lib/stripe.ts — Stripe client and revenue verification
// ⚠️  SERVER-SIDE ONLY — never import in client components
import Stripe from "stripe";
import { getTierFromRevenue } from "./tiers";
import { Tier } from "@prisma/client";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export interface RevenueResult {
  revenueCents: number;
  tier: Tier;
  chargeCount: number;
  verifiedAt: Date;
}

/**
 * Verify revenue using a user-provided Stripe API key.
 * Sums all successful charges in the last 30 days.
 */
export async function verifyRevenueWithApiKey(
  apiKey: string
): Promise<RevenueResult> {
  const userStripe = new Stripe(apiKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });

  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
  );

  let revenueCents = 0;
  let chargeCount = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  // Paginate through all charges in last 30 days
  while (hasMore) {
    const charges = await userStripe.charges.list({
      limit: 100,
      created: { gte: thirtyDaysAgo },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const charge of charges.data) {
      if (charge.status === "succeeded" && !charge.refunded) {
        // Convert to USD if needed (simplified)
        revenueCents += charge.amount;
        chargeCount++;
      }
    }

    hasMore = charges.has_more;
    if (charges.data.length > 0) {
      startingAfter = charges.data[charges.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  const tier = getTierFromRevenue(revenueCents);
  return { revenueCents, tier, chargeCount, verifiedAt: new Date() };
}

/**
 * Verify revenue via Stripe Connect (OAuth).
 * Uses balance transactions for accuracy.
 */
export async function verifyRevenueWithConnect(
  stripeAccountId: string
): Promise<RevenueResult> {
  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
  );

  let revenueCents = 0;
  let chargeCount = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const txns = await stripe.balanceTransactions.list(
      {
        limit: 100,
        type: "charge",
        created: { gte: thirtyDaysAgo },
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      },
      { stripeAccount: stripeAccountId }
    );

    for (const txn of txns.data) {
      revenueCents += txn.net; // Net after Stripe fees
      chargeCount++;
    }

    hasMore = txns.has_more;
    if (txns.data.length > 0) {
      startingAfter = txns.data[txns.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  const tier = getTierFromRevenue(revenueCents);
  return { revenueCents, tier, chargeCount, verifiedAt: new Date() };
}

/**
 * Create a Stripe Connect OAuth URL for connecting an account.
 */
export function createConnectUrl(userId: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.STRIPE_CLIENT_ID!,
    scope: "read_only",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/stripe/callback`,
    state: userId, // We'll verify this on callback
    "stripe_user[business_type]": "individual",
  });
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}
