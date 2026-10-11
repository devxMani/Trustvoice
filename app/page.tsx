// app/page.tsx — Beautiful, High-Conversion Landing Page for TrustVoice

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  ShieldCheck,
  Bot,
  Compass,
  ArrowRight,
  Sparkles,
  Users,
  Trophy,
  Github,
  CheckCircle2,
  Volume2,
} from "lucide-react";

export default function HomePage() {
  const [selectedTier, setSelectedTier] = useState<"FREE" | "STARTER" | "GROWTH" | "SCALE">("SCALE");

  const tierDetails = {
    FREE: {
      name: "Starter Village",
      range: "$0 – $1K / mo",
      emoji: "🌱",
      pet: "Sprout (Plant Pet)",
      petEmoji: "🌱",
      color: "from-gray-500 to-emerald-600",
      accent: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-950/20",
      desc: "Where every indie founder starts. Build in public, test prototypes, and talk shop around the village fountain.",
      features: ["Starter Village access", "Sprout plant companion", "Spatial proximity voice", "Global & zone chat"],
    },
    STARTER: {
      name: "Growth Park",
      range: "$1K – $5K / mo",
      emoji: "🤖",
      pet: "CyberBot (AI Assistant)",
      petEmoji: "🤖",
      color: "from-emerald-500 to-teal-600",
      accent: "text-teal-400",
      border: "border-teal-500/30",
      bg: "bg-teal-950/20",
      desc: "First paying customers and repeatable growth. Hang out with founders scaling inbound voice agents.",
      features: ["Growth Park & Hub office", "CyberBot companion", "Building voice channels", "Audio agent demo testing"],
    },
    GROWTH: {
      name: "Scale District",
      range: "$5K – $20K / mo",
      emoji: "🚀",
      pet: "Astra (Rocket Pet)",
      petEmoji: "🚀",
      color: "from-blue-500 to-indigo-600",
      accent: "text-blue-400",
      border: "border-blue-500/30",
      bg: "bg-blue-950/20",
      desc: "Serious traction, high concurrency, and production voice pipelines. Access private labs and sound rooms.",
      features: ["Scale District & Tower labs", "Astra rocket companion", "Priority voice bitrate", "Verified scale founder badge"],
    },
    SCALE: {
      name: "Whale Lounge",
      range: "$20K+ / mo",
      emoji: "👑",
      pet: "Apex (Diamond Crown)",
      petEmoji: "👑",
      color: "from-amber-500 to-yellow-600",
      accent: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-950/20",
      desc: "The inner circle. Multi-million run-rate voice founders sharing infra tips, enterprise deals, and proprietary architectures.",
      features: ["Whale Lounge Palace unlock", "Diamond Crown companion", "All map areas accessible", "VIP founder badge & radar priority"],
    },
  };

  const active = tierDetails[selectedTier];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col relative selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Background Pixel Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Navbar */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              🎙️
            </div>
            <div>
              <div className="font-pixel text-sm text-white flex items-center gap-1.5">
                TrustVoice
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                  MRR
                </span>
              </div>
              <div className="text-[10px] text-white/50 font-mono">Voice-AI Founders World</div>
            </div>
          </Link>

          {/* Center stats badge */}
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-white/80 font-mono font-medium">18 Founders walking & talking</span>
          </div>

          {/* Action links */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex text-xs font-semibold text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              Connect Stripe
            </Link>

            <Link
              href="/world"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center gap-1.5 active:scale-95"
            >
              <span>🎮 Enter World</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center relative z-10">
        {/* Subtitle Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-mono text-purple-300 mb-6 backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>The Habbo Hotel for Voice-AI Founders</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15] mb-6">
          A pixel multiplayer world for founders with{" "}
          <span className="bg-gradient-to-r from-blue-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
            verified voice revenue
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-gray-300 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed font-normal">
          Connect Stripe to verify your last-30-day MRR. Unlock exclusive map zones,
          walk up to other founders for real-time spatial voice calls, and demo your voice agents live.
        </p>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center mb-16">
          <Link
            href="/world"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-base transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
          >
            <span>🎮 Jump Into World (Instant Play)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl text-base transition-all border border-white/15 flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verify Stripe MRR</span>
          </Link>
        </div>

        {/* Interactive World / Tier Showcase */}
        <div className="w-full max-w-4xl bg-black/60 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative mb-20 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <div className="font-pixel text-xs text-white/50 mb-1">INTERACTIVE MAP ZONES</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Explore the 4 Revenue Districts</span>
              </h2>
            </div>

            {/* Clickable Tier Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
              {(["FREE", "STARTER", "GROWTH", "SCALE"] as const).map((t) => {
                const conf = tierDetails[t];
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      selectedTier === t
                        ? "bg-white/20 text-white shadow-md border border-white/30 scale-105"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{conf.emoji}</span>
                    <span>{conf.range}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tier Preview Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Visual Canvas Representation */}
            <div className={`rounded-2xl border ${active.border} ${active.bg} p-6 relative overflow-hidden flex flex-col justify-between min-h-[260px]`}>
              {/* Floating Badge in upper corner */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full bg-black/60 border border-white/10 ${active.accent}`}>
                  {active.emoji} {active.name}
                </span>
                <span className="text-xs font-mono text-white/50">{active.range}</span>
              </div>

              {/* Simulated Character & Chat Bubble matching Marc Lou reference screenshot */}
              <div className="my-auto py-4 flex flex-col items-center">
                {/* Speech Bubble */}
                <div className="bg-[#181d28] border border-white/20 rounded-xl p-2.5 shadow-xl max-w-[240px] text-center mb-3 relative">
                  <div className="text-[10px] font-bold text-amber-300 font-mono mb-0.5">
                    Marc Lou {active.range.replace("/ mo", "/mo")} 💎
                  </div>
                  <div className="text-[11px] text-white font-mono">
                    Welcome to the {active.name}!
                  </div>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#181d28] mx-auto -mb-4 mt-1" />
                </div>

                {/* Pixel Character + Pet */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-14 rounded-lg bg-gray-800 border-2 border-white/20 flex flex-col items-center justify-center shadow-lg">
                    <div className="w-6 h-2 bg-amber-500 rounded-t-sm" />
                    <div className="w-5 h-4 bg-[#ffcc99] flex items-center justify-around px-0.5">
                      <div className="w-1 h-1 bg-black rounded-full" />
                      <div className="w-1 h-1 bg-black rounded-full" />
                    </div>
                    <div className="w-7 h-5 bg-blue-600 rounded-b-sm" />
                  </div>

                  {/* Companion Pet */}
                  <div className="text-3xl animate-bounce">
                    {active.petEmoji}
                  </div>
                </div>
              </div>

              {/* Bottom tag */}
              <div className="text-[11px] text-white/50 font-mono flex items-center justify-between">
                <span>Companion: {active.pet}</span>
                <span className="text-green-400">● 6 Online</span>
              </div>
            </div>

            {/* Features Description */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{active.name}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{active.desc}</p>
              </div>

              <div className="space-y-2 pt-2">
                {active.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href="/world"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 font-mono"
                >
                  <span>Walk into this district now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left mb-20">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Stripe Revenue Verified</h4>
            <p className="text-white/60 text-xs leading-relaxed">
              Real founders only. Last 30-day revenue is verified server-side via Stripe Connect or read-only API keys.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Volume2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Spatial Proximity Voice</h4>
            <p className="text-white/60 text-xs leading-relaxed">
              Powered by LiveKit. Volume scales with distance. Walk up to anyone to start talking naturally.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Demo Voice Agents Live</h4>
            <p className="text-white/60 text-xs leading-relaxed">
              Connect your Vapi, Bland.ai, or custom webhook. Other founders can test your voice agent right in the world!
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Pixel World & Radar</h4>
            <p className="text-white/60 text-xs leading-relaxed">
              Built on Phaser 3 with animated water, fountains, companion pets, and a real-time founder radar.
            </p>
          </div>
        </div>

        {/* Founder Testimonial / Story Card */}
        <div className="w-full max-w-2xl bg-gradient-to-r from-purple-950/30 via-black to-blue-950/30 border border-white/15 rounded-2xl p-6 mb-16 flex items-center gap-4 text-left">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 border-2 border-white/20 flex items-center justify-center text-3xl flex-shrink-0">
            👑
          </div>
          <div>
            <div className="text-xs text-white/90 italic mb-1">
              &quot;The most valuable insights don&apos;t happen on Twitter or LinkedIn. They happen when founders hang out in real-time with spatial audio.&quot;
            </div>
            <div className="text-[11px] text-white/50 font-mono">
              Marc Lou · Verified $205K/mo Founder · Creator of TrustMRR Chat
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Ready to meet other voice founders?</h3>
          <p className="text-white/60 text-sm mb-6">No login required to explore. Walk freely around the map right now.</p>
          <Link
            href="/world"
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/30 inline-flex items-center gap-2"
          >
            <span>🎮 Enter TrustVoice</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/60 py-8 text-center text-xs text-white/40 font-mono">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>TrustVoice — Habbo/Gather style multiplayer world for voice-AI founders.</div>
          <div className="flex items-center gap-4">
            <Link href="/world" className="hover:text-white transition-colors">World</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Stripe Dashboard</Link>
            <a
              href="https://github.com/devxMani/Trustvoice"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
