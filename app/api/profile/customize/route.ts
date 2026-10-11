// app/api/profile/customize/route.ts
// POST: Update player character customization and voice agent details

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      characterSkin,
      characterHair,
      characterOutfit,
      characterColor,
      petType,
      agentName,
      agentWebhookUrl,
      startup,
      bio,
      twitterUrl,
      linkedinUrl,
    } = body;

    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        ...(characterSkin !== undefined && { characterSkin: String(characterSkin) }),
        ...(characterHair !== undefined && { characterHair: String(characterHair) }),
        ...(characterOutfit !== undefined && { characterOutfit: String(characterOutfit) }),
        ...(characterColor !== undefined && { characterColor: String(characterColor) }),
        ...(petType !== undefined && { petType: String(petType) }),
        ...(agentName !== undefined && { agentName: agentName ? String(agentName) : null }),
        ...(agentWebhookUrl !== undefined && { agentWebhookUrl: agentWebhookUrl ? String(agentWebhookUrl) : null }),
        ...(startup !== undefined && { startup: startup ? String(startup) : null }),
        ...(bio !== undefined && { bio: bio ? String(bio) : null }),
        ...(twitterUrl !== undefined && { twitterUrl: twitterUrl ? String(twitterUrl) : null }),
        ...(linkedinUrl !== undefined && { linkedinUrl: linkedinUrl ? String(linkedinUrl) : null }),
      },
    });

    return NextResponse.json({ ok: true, profile: updatedProfile });
  } catch (error) {
    console.error("[profile/customize]", error);
    return NextResponse.json(
      { error: "Failed to update customization" },
      { status: 500 }
    );
  }
}
