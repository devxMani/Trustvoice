// app/dashboard/page.tsx — Profile + Stripe connect dashboard

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createConnectUrl } from "@/lib/stripe";
import { TIERS, formatRevenue } from "@/lib/tiers";
import Link from "next/link";
import { DashboardClient } from "./DashboardClient";
import { CharacterCustomizer } from "@/components/ui/CharacterCustomizer";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  if (!profile) redirect("/login");

  const connectUrl = createConnectUrl(session.user.id);
  const tierConfig = TIERS[profile.tier];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <nav className="border-b border-white/10 bg-black/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-sm text-white">TrustVoice</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/world"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            🎮 Enter World
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Status alerts */}
        {params.connected && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 text-sm">
            ✅ Stripe connected! Revenue verified.
          </div>
        )}
        {params.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            ⚠️ {params.error.replace(/_/g, " ")}
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            {profile.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.user.image}
                alt={profile.user.name ?? ""}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
                {tierConfig.emoji}
              </div>
            )}
            <div>
              <div className="text-xl font-bold">{profile.user.name}</div>
              <div className="text-gray-400 text-sm">{profile.user.email}</div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-sm font-semibold"
                  style={{ color: tierConfig.color, backgroundColor: tierConfig.bgColor + "33" }}
                >
                  {tierConfig.emoji} {tierConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-1">Verified MRR (30d)</div>
              <div className="text-2xl font-bold text-white">
                {formatRevenue(profile.verifiedRevenueCents)}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {profile.lastVerifiedAt
                  ? `Updated ${profile.lastVerifiedAt.toLocaleDateString()}`
                  : "Not verified yet"}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-1">Current Tier</div>
              <div className="text-2xl font-bold" style={{ color: tierConfig.color }}>
                {tierConfig.zone}
              </div>
              <div className="text-gray-500 text-xs mt-1">{tierConfig.zoneDescription}</div>
            </div>
          </div>
        </div>

        {/* Stripe verification */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-1">Revenue Verification</h2>
          <p className="text-gray-400 text-sm mb-5">
            Connect your Stripe to verify monthly revenue and unlock zones.
            Your secret key is verified server-side and never stored in plaintext.
          </p>

          <DashboardClient
            hasStripe={!!profile.stripeAccountId || !!profile.stripeApiKey}
            connectUrl={connectUrl}
          />
        </div>

        {/* Next tier */}
        {profile.tier !== "SCALE" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Next Unlock
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔒</div>
              <div>
                <div className="font-semibold text-white">
                  {
                    {
                      FREE: "Growth Park — reach $1K/mo",
                      STARTER: "Scale District — reach $5K/mo",
                      GROWTH: "Whale Lounge — reach $20K/mo",
                      SCALE: "",
                    }[profile.tier]
                  }
                </div>
                <div className="text-gray-400 text-sm">
                  Keep shipping 🚀 Connect Stripe to re-verify anytime.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Founder Studio Customizer */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-1">Founder Studio</h2>
          <p className="text-gray-400 text-sm mb-5">
            Configure your pixel avatar, companion pet, and voice agent endpoint.
          </p>
          <CharacterCustomizer
            initialSkin={profile.characterSkin}
            initialOutfit={profile.characterOutfit}
            initialHair={profile.characterHair}
            initialPet={profile.petType}
            initialAgentName={profile.agentName ?? ""}
            initialAgentWebhookUrl={profile.agentWebhookUrl ?? ""}
            initialStartup={profile.startup ?? ""}
            initialBio={profile.bio ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
