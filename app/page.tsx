// app/page.tsx — Landing page
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/world");

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Pixel grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating pixel art icons */}
      <div className="absolute inset-0 pointer-events-none">
        {["🌱", "🤖", "🚀", "👑", "💎", "🎮"].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-3xl animate-float"
            style={{
              left: `${10 + i * 14}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              opacity: 0.3,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center max-w-3xl px-6">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-2xl">
            🎙️
          </div>
          <div className="text-left">
            <div className="font-pixel text-2xl text-white">TrustVoice</div>
            <div className="text-blue-400 text-sm font-mono">VoiceMRR Chat</div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
          The pixel world for{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            voice-AI founders
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Connect your Stripe. Verify your revenue. Unlock zones based on what you&apos;ve
          built. Talk to real founders with spatial voice.
        </p>

        {/* Tier preview */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { emoji: "🌱", label: "Starter Village", color: "#6b7280", bg: "#1f2937" },
            { emoji: "🤖", label: "$1K–$5K/mo", color: "#10b981", bg: "#064e3b" },
            { emoji: "🚀", label: "$5K–$20K/mo", color: "#3b82f6", bg: "#1e3a5f" },
            { emoji: "👑", label: "$20K+/mo", color: "#f59e0b", bg: "#451a03" },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
              style={{
                color: t.color,
                backgroundColor: t.bg,
                borderColor: `${t.color}40`,
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            🎮 Enter the World
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-lg transition-all border border-white/10"
          >
            View on GitHub
          </a>
        </div>

        {/* Trust signals */}
        <p className="text-gray-600 text-sm mt-8">
          Revenue verified server-side via Stripe API · Spatial audio via LiveKit · Built with Next.js 15
        </p>
      </div>
    </main>
  );
}
