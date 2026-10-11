// app/world/page.tsx — Server component: auth guard + data fetch

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorldClient } from "./WorldClient";

export default async function WorldPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch player profile
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true, email: true, image: true } } },
  });

  if (!profile) redirect("/dashboard");

  // Mark as online
  await prisma.profile.update({
    where: { userId: session.user.id },
    data: { isOnline: true, lastSeen: new Date() },
  });

  const livekitUrl = process.env.LIVEKIT_URL!;

  return (
    <WorldClient
      initialPlayer={{
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
      }}
      livekitUrl={livekitUrl}
    />
  );
}
