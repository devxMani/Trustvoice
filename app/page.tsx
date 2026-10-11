"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Circle, LockKeyhole, Mic2, ShieldCheck, Users, Zap } from "lucide-react";

const districts = [
  { name: "Starter Village", range: "$0–1k MRR", tone: "bg-[#d9f3e8]", accent: "text-emerald-800", unlocked: true },
  { name: "Growth Park", range: "$1k–5k MRR", tone: "bg-[#e9e1ff]", accent: "text-violet-800", unlocked: true },
  { name: "Scale District", range: "$5k–20k MRR", tone: "bg-[#ffe7c2]", accent: "text-orange-900", unlocked: false },
  { name: "Whale Lounge", range: "$20k+ MRR", tone: "bg-[#f8d6d0]", accent: "text-rose-900", unlocked: false },
];

function PixelFounder({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-32 w-24 ${className}`} aria-hidden="true">
      <div className="absolute left-7 top-2 h-8 w-10 bg-[#191919] shadow-[0_0_0_4px_#191919]" />
      <div className="absolute left-5 top-9 h-12 w-14 bg-[#f1b18b] shadow-[0_0_0_4px_#f1b18b]" />
      <div className="absolute left-7 top-16 h-2 w-2 bg-[#191919]" />
      <div className="absolute left-15 top-16 h-2 w-2 bg-[#191919]" />
      <div className="absolute left-2 top-20 h-11 w-20 bg-[#f26d4c] shadow-[0_0_0_4px_#f26d4c]" />
      <div className="absolute left-4 top-30 h-2 w-7 bg-[#191919]" />
      <div className="absolute right-4 top-30 h-2 w-7 bg-[#191919]" />
      <div className="absolute -right-2 top-14 h-8 w-8 bg-[#a9d8be] shadow-[0_0_0_3px_#191919]" />
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f5f1] text-[#151515] selection:bg-[#f26d4c] selection:text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-black/10 px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="TrustVoice home">
          <span className="grid size-9 place-items-center bg-[#f26d4c] text-white shadow-[3px_3px_0_#151515]"><Mic2 size={18} /></span>
          <span className="text-lg font-semibold tracking-[-0.04em]">trustvoice</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-black/55 md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-black">How it works</a>
          <a href="#districts" className="transition-colors hover:text-black">Districts</a>
          <Link href="/dashboard" className="transition-colors hover:text-black">For founders</Link>
        </nav>
        <Link href="/world" className="inline-flex items-center gap-2 bg-[#151515] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
          Enter the world <ArrowUpRight size={16} />
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pt-28">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 border border-black/10 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-black/55">
            <Circle size={8} fill="currentColor" className="text-[#f26d4c]" /> A private network for voice founders
          </div>
          <h1 className="max-w-3xl text-[clamp(3.4rem,7vw,6.6rem)] font-semibold leading-[.92] tracking-[-0.085em]">Build in public.<br /><span className="text-[#f26d4c]">Talk in person.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-black/58">TrustVoice is a living pixel world for founders building voice AI. Verify your revenue, meet the right people, and demo what you are shipping.</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/world" className="inline-flex items-center gap-3 bg-[#f26d4c] px-5 py-3.5 text-sm font-semibold text-white shadow-[4px_4px_0_#151515] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#151515]">Explore the world <ArrowUpRight size={17} /></Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 border border-black/15 bg-white px-5 py-3.5 text-sm font-semibold transition-colors hover:border-black/40">Verify your MRR <ShieldCheck size={16} /></Link>
          </div>
          <div className="mt-12 flex items-center gap-8 border-t border-black/10 pt-5 text-sm text-black/50"><span><strong className="text-2xl font-semibold tracking-[-.06em] text-black">4</strong> districts</span><span><strong className="text-2xl font-semibold tracking-[-.06em] text-black">24/7</strong> founder hours</span><span><strong className="text-2xl font-semibold tracking-[-.06em] text-black">1</strong> good network</span></div>
        </div>

        <div className="relative min-h-[470px] border border-black/10 bg-[#ebe9e2] p-4 shadow-[10px_10px_0_rgba(21,21,21,.08)]">
          <div className="flex items-center justify-between border-b border-black/10 pb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-black/45"><span>TrustVoice / live map</span><span className="flex items-center gap-2"><Circle size={7} fill="#39a56a" className="text-[#39a56a]" /> 18 online</span></div>
          <div className="relative mt-4 h-[390px] overflow-hidden bg-[#b9d8c4]" style={{ backgroundImage: "linear-gradient(#ffffff35 1px, transparent 1px), linear-gradient(90deg, #ffffff35 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
            <div className="absolute left-[8%] top-[10%] h-28 w-36 border-4 border-[#6ea78e] bg-[#d9f3e8]" /><div className="absolute right-[9%] top-[13%] h-36 w-44 border-4 border-[#ad95dc] bg-[#e9e1ff]" /><div className="absolute bottom-[10%] left-[13%] h-32 w-44 border-4 border-[#de9e51] bg-[#ffe7c2]" /><div className="absolute bottom-[13%] right-[11%] h-28 w-40 border-4 border-[#d6877c] bg-[#f8d6d0]" />
            <div className="absolute left-[42%] top-[39%] h-24 w-24 border-4 border-[#151515] bg-[#f26d4c] shadow-[6px_6px_0_#151515]" /><div className="absolute left-[46%] top-[44%] h-5 w-5 bg-[#f1b18b] shadow-[0_0_0_3px_#151515]" />
            <PixelFounder className="absolute left-[42%] top-[52%] scale-75" /><div className="absolute left-[49%] top-[28%] bg-[#151515] px-3 py-2 text-[11px] font-semibold text-white">Walk up. Say hello.</div>
            <span className="absolute left-[15%] top-[17%] text-[10px] font-bold uppercase tracking-[.16em] text-emerald-900">starter village</span><span className="absolute right-[13%] top-[22%] text-[10px] font-bold uppercase tracking-[.16em] text-violet-900">growth park</span><span className="absolute bottom-[18%] left-[20%] text-[10px] font-bold uppercase tracking-[.16em] text-orange-900">scale district</span><span className="absolute bottom-[21%] right-[15%] text-[10px] font-bold uppercase tracking-[.16em] text-rose-900">whale lounge</span>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-black/10 bg-white"><div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3 lg:px-8"><div><span className="text-xs font-bold uppercase tracking-[.2em] text-[#f26d4c]">01 / Verify</span><h2 className="mt-3 text-2xl font-semibold tracking-[-.05em]">Show your signal.</h2><p className="mt-3 text-sm leading-6 text-black/55">Connect Stripe and unlock the district that matches your actual momentum.</p></div><div><span className="text-xs font-bold uppercase tracking-[.2em] text-[#f26d4c]">02 / Enter</span><h2 className="mt-3 text-2xl font-semibold tracking-[-.05em]">Find your people.</h2><p className="mt-3 text-sm leading-6 text-black/55">Walk through a small, focused world where proximity turns into real conversations.</p></div><div><span className="text-xs font-bold uppercase tracking-[.2em] text-[#f26d4c]">03 / Demo</span><h2 className="mt-3 text-2xl font-semibold tracking-[-.05em]">Let the product speak.</h2><p className="mt-3 text-sm leading-6 text-black/55">Test voice agents live, compare notes, and leave with a sharper product.</p></div></div></section>

      <section id="districts" className="mx-auto max-w-6xl px-6 py-20 lg:px-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f26d4c]">The map</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.07em]">Earn your way across.</h2></div><p className="max-w-sm text-sm leading-6 text-black/55">Every district has its own pace, people, and rooms. Revenue verification keeps the network useful.</p></div><div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{districts.map((district) => <div key={district.name} className={`${district.tone} min-h-44 border border-black/10 p-5 ${district.accent}`}><div className="flex items-start justify-between"><span className="grid size-8 place-items-center border border-current/20 bg-white/40">{district.unlocked ? <Check size={15} /> : <LockKeyhole size={15} />}</span><span className="text-[10px] font-bold uppercase tracking-[.15em]">{district.range}</span></div><h3 className="mt-12 text-lg font-semibold tracking-[-.04em]">{district.name}</h3><p className="mt-1 text-xs opacity-65">{district.unlocked ? "Open to verified founders" : "Unlock with verified revenue"}</p></div>))}</div></section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-black/10 px-6 py-8 text-sm text-black/45 md:flex-row md:items-center md:justify-between lg:px-8"><span className="font-semibold text-black">trustvoice</span><span>Verified founders. Better conversations. More signal.</span><Link href="/world" className="inline-flex items-center gap-1 font-semibold text-black">Enter the world <ArrowUpRight size={14} /></Link></footer>
    </main>
  );
}

const _unused = { Users, Zap };
void _unused;
