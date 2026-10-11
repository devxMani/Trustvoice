// app/api/stripe/webhook/route.ts
// Receives Stripe webhooks and re-verifies revenue daily.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getTierFromRevenue } from "@/lib/tiers";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle relevant events
  switch (event.type) {
    case "charge.succeeded":
    case "payment_intent.succeeded":
    case "invoice.payment_succeeded": {
      // Re-verify revenue for the connected account
      const account = (event as { account?: string }).account;
      if (account) {
        await reVerifyAccount(account);
      }
      break;
    }
    case "account.updated": {
      const acct = event.data.object as Stripe.Account;
      await reVerifyAccount(acct.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function reVerifyAccount(stripeAccountId: string) {
  const profile = await prisma.profile.findFirst({
    where: { stripeAccountId },
  });
  if (!profile) return;

  // Only re-verify if last verified > 1 hour ago
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (profile.lastVerifiedAt && profile.lastVerifiedAt > oneHourAgo) return;

  const { verifyRevenueWithConnect } = await import("@/lib/stripe");
  const result = await verifyRevenueWithConnect(stripeAccountId);

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      verifiedRevenueCents: result.revenueCents,
      tier: result.tier,
      lastVerifiedAt: result.verifiedAt,
    },
  });
}
