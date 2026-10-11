// app/world/page.tsx — Server component: direct entry (no forced auth roadblocks)

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorldClient } from "./WorldClient";
import type { Tier } from "@prisma/client";

export default async function WorldPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Auth optional for local/demo mode
  }

  // Default guest founder so anyone can test and play immediately without auth setup
  let initialPlayer = {
    id: "founder-demo",
    name: "Marc Lou",
    email: "founder@trustvoice.app",
    image: undefined as string | undefined,
    tier: "SCALE" as Tier, // Unlocked so user can explore every quadrant of the map!
    revenueCents: 20500000, // $205,000/mo (like reference screenshot)
    characterSkin: "0",
    characterOutfit: "0",
    petType: "crown",
    agentWebhookUrl: undefined as string | undefined,
    agentName: "Marc's Voice AI" as string | undefined,
    positionX: 780,
    positionY: 620,
    startup: "TrustMRR" as string | undefined,
    bio: "Building voice-AI startups in public." as string | undefined,
  };

  // If signed in and database is available, fetch real user profile
  if (session?.user?.id) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        include: { user: { select: { name: true, email: true, image: true } } },
      });

      if (profile) {
        // Mark as online
        await prisma.profile.update({
          where: { userId: session.user.id },
          data: { isOnline: true, lastSeen: new Date() },
        });

        initialPlayer = {
          id: session.user.id,
          name: profile.user.name ?? profile.user.email ?? "Founder",
          email: profile.user.email ?? "",
          image: profile.user.image ?? undefined,
          tier: profile.tier,
          revenueCents: profile.verifiedRevenueCents,
          characterSkin: profile.characterSkin,
          characterOutfit: profile.characterOutfit,
          petType: profile.petType,
          agentWebhookUrl: profile.agentWebhookUrl ?? undefined,
          agentName: profile.agentName ?? undefined,
          positionX: profile.positionX,
          positionY: profile.positionY,
          startup: profile.startup ?? undefined,
          bio: profile.bio ?? undefined,
        };
      }
    } catch (e) {
      console.warn("[world/page] Database not available, using demo player profile", e);
    }
  }

  const livekitUrl = process.env.LIVEKIT_URL || "wss://trustvoice.livekit.cloud";

  return (
    <WorldClient
      initialPlayer={initialPlayer}
      livekitUrl={livekitUrl}
    />
  );
}
