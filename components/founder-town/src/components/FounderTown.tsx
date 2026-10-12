"use client";

import { useEffect, useRef, useState } from "react";
import { drawCharacter, drawPet, drawTown } from "../game/draw";
import {
  HAIR_COLORS,
  HAIR_STYLES,
  SHIRT_COLORS,
  SKIN_COLORS,
  TIERS,
  canEnter,
  tierOf,
} from "../game/content";
import { INT_H, INT_W } from "../game/map";
import {
  applyProfile,
  clickUI,
  clickWorld,
  createTown,
  loadSave,
  say,
  saveTown,
  toggleHeart,
  updateTown,
} from "../game/sim";
import type { Look, TierId, Town } from "../game/types";
import { Heart, Lock, SendHorizontal } from "lucide-react";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getY: () => number;
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number) => void;
      setPos?: (x: number, y: number) => void;
    };
  }
}

function sliderToRevenue(t: number): number {
  if (t <= 0) return 0;
  const value = Math.pow(2_000_000, t / 1000);
  if (value < 1) return 0;
  if (value < 1000) return Math.round(value);
  if (value < 10_000) return Math.round(value / 10) * 10;
  if (value < 100_000) return Math.round(value / 100) * 100;
  return Math.round(value / 1000) * 1000;
}

function revenueToSlider(n: number): number {
  if (n <= 0) return 0;
  return Math.round((Math.log(Math.min(n, 2_000_000)) / Math.log(2_000_000)) * 1000);
}

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `$${Math.round(n / 1000)}K`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${Math.round(n)}`;
}

function SpritePreview({ look, revenue }: { look: Look; revenue: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    ctx.imageSmoothingEnabled = false;
    drawCharacter(ctx, 22, 40, look, 0, 0, 0);
    drawPet(ctx, 38, 42, tierOf(revenue).id, 0);
  }, [look, revenue]);
  return <canvas ref={ref} width={48} height={48} className="h-28 w-28" style={{ imageRendering: "pixelated" }} />;
}

function PetButton({
  tier,
  on,
  onPick,
}: {
  tier: (typeof TIERS)[number];
  on: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 24, 24);
    drawPet(ctx, 12, 20, tier.id, 1);
  }, [tier.id]);
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      className={`flex flex-col items-center gap-1 rounded-lg px-1 py-1 ${on ? "bg-tv-soft ring-2 ring-tv-blue" : "bg-transparent"}`}
    >
      <canvas ref={ref} width={24} height={24} className="h-8 w-8" style={{ imageRendering: "pixelated" }} />
      <span className="font-sans text-xs leading-none text-tv-muted">{tier.label}</span>
    </button>
  );
}

function Creator({
  town,
  mode,
  onClose,
}: {
  town: Town;
  mode: "create" | "edit";
  onClose: () => void;
}) {
  const [name, setName] = useState(town.player.name);
  const [look, setLook] = useState<Look>(town.player.look);
  const [revenue, setRevenue] = useState(town.player.revenue);
  const [anonymous, setAnonymous] = useState(town.anonymous);
  const [startup, setStartup] = useState(town.startupName);
  const [blurb, setBlurb] = useState(town.blurb);
  const tier = tierOf(revenue);

  useEffect(() => {
    applyProfile(town, { name, look, revenue, anonymous, startupName: startup, blurb });
  }, [town, name, look, revenue, anonymous, startup, blurb]);

  const patchLook = (partial: Partial<Look>) => setLook((prev) => ({ ...prev, ...partial }));

  return (
    <div className="creator-dock pointer-events-auto absolute inset-x-2 bottom-2 top-auto z-20 overflow-auto">
      <form
        className="pixel-panel flex flex-col gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          applyProfile(town, { name, look, revenue, anonymous, startupName: startup, blurb, seen: true });
          town.seen = true;
          town.createOpen = false;
          onClose();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-pixel text-base text-tv-blue">TRUSTVOICE</p>
            <h1 className="font-pixel text-base text-tv-ink">{mode === "create" ? "FOUNDER TOWN" : "MY PROFILE"}</h1>
          </div>
          <SpritePreview look={look} revenue={revenue} />
        </div>
        <p className="font-sans text-sm leading-snug text-tv-muted">
          Walk the town. Rooms open from your last 30 days. A tree follows you between $1K and $10K.
        </p>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs text-tv-muted">NAME</span>
          <input className="pixel-input" maxLength={16} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Cycle label="HAIR" value={HAIR_STYLES[look.hair] ?? "Short"} onPrev={() => patchLook({ hair: (look.hair + HAIR_STYLES.length - 1) % HAIR_STYLES.length })} onNext={() => patchLook({ hair: (look.hair + 1) % HAIR_STYLES.length })} />
          <Cycle label="COLOR" value={String(look.hairColor + 1)} swatch={HAIR_COLORS[look.hairColor]} onPrev={() => patchLook({ hairColor: (look.hairColor + HAIR_COLORS.length - 1) % HAIR_COLORS.length })} onNext={() => patchLook({ hairColor: (look.hairColor + 1) % HAIR_COLORS.length })} />
          <Cycle label="SKIN" value={String(look.skin + 1)} swatch={SKIN_COLORS[look.skin]} onPrev={() => patchLook({ skin: (look.skin + SKIN_COLORS.length - 1) % SKIN_COLORS.length })} onNext={() => patchLook({ skin: (look.skin + 1) % SKIN_COLORS.length })} />
        </div>
        <div className="flex flex-wrap gap-1">
          {SHIRT_COLORS.map((color, i) => (
            <button
              key={color}
              type="button"
              aria-label={`Shirt ${i + 1}`}
              onClick={() => patchLook({ shirt: i })}
              className={`h-8 w-8 rounded-full ring-2 ${look.shirt === i ? "ring-tv-ink" : "ring-transparent"}`}
              style={{ background: color }}
            />
          ))}
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs text-tv-muted">LAST 30 DAYS · {money(revenue)} · {tier.label}</span>
          <input
            className="rev-slider"
            type="range"
            min={0}
            max={1000}
            value={revenueToSlider(revenue)}
            onChange={(e) => setRevenue(sliderToRevenue(Number(e.target.value)))}
          />
        </label>
        <div className="grid grid-cols-6 gap-1">
          {TIERS.map((row) => (
            <PetButton
              key={row.id}
              tier={row}
              on={tier.id === row.id}
              onPick={() => setRevenue(row.id === "seed" ? 500 : row.id === "tree" ? 4200 : row.id === "rocket" ? 52000 : row.id === "diamond" ? 220000 : row.id === "crown" ? 1400000 : 0)}
            />
          ))}
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs text-tv-muted">STARTUP</span>
          <input className="pixel-input" maxLength={28} placeholder="Name" value={startup} onChange={(e) => setStartup(e.target.value)} />
        </label>
        <input className="pixel-input" maxLength={90} placeholder="One line about it" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        <button
          type="button"
          className="flex items-center justify-between rounded-lg bg-tv-soft px-3 py-2 text-left"
          onClick={() => setAnonymous((v) => !v)}
        >
          <span className="font-sans text-sm font-medium">Anonymous mode</span>
          <span className={`h-6 w-11 rounded-full p-0.5 ${anonymous ? "bg-tv-blue" : "bg-tv-line"}`}>
            <span className={`block h-5 w-5 rounded-full bg-tv-white ${anonymous ? "ml-5" : "ml-0"}`} />
          </span>
        </button>
        <p className="font-sans text-xs text-tv-muted">
          Hides your name and startup. The number stays. Eggs found {town.eggs.length}/5.
        </p>
        <button type="submit" className="rounded-lg bg-tv-blue px-3 py-3 font-pixel text-base text-tv-white">
          {mode === "create" ? "ENTER THE TOWN" : "BACK TO TOWN"}
        </button>
      </form>
    </div>
  );
}

function Cycle({
  label,
  value,
  swatch,
  onPrev,
  onNext,
}: {
  label: string;
  value: string;
  swatch?: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-xs text-tv-muted">{label}</span>
      <div className="flex items-center justify-between gap-1 rounded-lg bg-tv-soft px-1 py-1">
        <button type="button" className="px-2 py-1 font-pixel text-tv-blue" onClick={onPrev} aria-label={`Previous ${label}`}>
          ‹
        </button>
        {swatch ? <span className="h-4 w-4 rounded-full" style={{ background: swatch }} /> : <span className="font-sans text-xs">{value}</span>}
        <button type="button" className="px-2 py-1 font-pixel text-tv-blue" onClick={onNext} aria-label={`Next ${label}`}>
          ›
        </button>
      </div>
    </div>
  );
}

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function TextMode({ town, onClose }: { town: Town; onClose: () => void }) {
  const [room, setRoom] = useState<TierId>(tierOf(town.player.revenue).id);
  const [draft, setDraft] = useState("");
  const [showList, setShowList] = useState(true);
  const [, poke] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const tier = TIERS.find((t) => t.id === room)!;
  const open = canEnter(town.player.revenue, room);
  const messages = town.messages.filter((m) => m.room === room).slice().sort((a, b) => a.ts - b.ts);
  const here = town.npcs.filter((n) => n.home === room).length;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [room, messages.length]);

  return (
    <div className="absolute inset-0 z-30 bg-tv-bg text-tv-ink">
      <div className="grid h-full grid-cols-1 md:grid-cols-[300px_1fr]">
        <aside className={`${showList ? "flex" : "hidden"} h-full flex-col bg-tv-white md:flex`}>
          <header className="flex items-center justify-between px-4 py-4">
            <h2 className="font-sans text-2xl font-semibold">Chats</h2>
            <button type="button" className="rounded-full px-3 py-2 text-sm text-tv-muted" onClick={onClose}>
              World
            </button>
          </header>
          <ul className="flex flex-1 flex-col gap-1 overflow-auto px-2">
            {TIERS.map((row) => {
              const unlocked = canEnter(town.player.revenue, row.id);
              const count = town.npcs.filter((n) => n.home === row.id).length;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRoom(row.id);
                      setShowList(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${room === row.id ? "bg-tv-soft" : ""}`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-tv-soft">
                      <PetMark tier={row.id} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-sans text-sm font-semibold">{row.label} /mo</span>
                      <span className="block text-xs text-tv-muted">{count} in town</span>
                    </span>
                    {!unlocked && <Lock className="size-4 text-tv-muted" aria-label="Locked" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <footer className="px-5 py-4 text-sm text-tv-muted">
            Chat groups for founders
            <br />
            with the same revenue.
            <p className="mt-3 flex items-center gap-2 font-medium text-tv-ink">
              <Star /> by TrustVoice
            </p>
          </footer>
        </aside>
        <section className={`${showList ? "hidden" : "flex"} h-full min-w-0 flex-col md:flex`}>
          <header className="flex items-center gap-3 border-b border-tv-line bg-tv-white px-4 py-3">
            <button type="button" className="rounded-full px-2 py-2 text-sm md:hidden" onClick={() => setShowList(true)}>
              Chats
            </button>
            <PetMark tier={room} />
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm font-semibold">{tier.label} /mo</p>
              <p className="text-xs text-tv-muted">
                {tier.membersLabel} · {here} founders
              </p>
            </div>
            <button type="button" className="hidden rounded-full px-3 py-2 text-sm text-tv-muted md:inline" onClick={onClose}>
              Back to town
            </button>
          </header>
          {open ? (
            <>
              <div ref={scroller} className="flex flex-1 flex-col gap-3 overflow-auto px-4 py-4">
                {messages.map((msg, i) => {
                  const prev = messages[i - 1];
                  const showDay = !prev || dayLabel(prev.ts) !== dayLabel(msg.ts);
                  const loved = town.hearted.has(msg.id);
                  const hearts = (msg.hearts ?? 0) + (loved ? 1 : 0);
                  return (
                    <div key={msg.id}>
                      {showDay && <p className="mb-2 text-center text-xs text-tv-muted">{dayLabel(msg.ts)}</p>}
                      <div className="flex justify-end">
                        <div className={`relative max-w-md rounded-2xl bg-tv-bubble px-3 py-2 text-tv-white ${msg.mine ? "" : "border-l-4 border-tv-gold"}`}>
                          {!msg.mine && <p className="mb-1 text-sm font-semibold text-tv-gold">{msg.author}</p>}
                          <p className="font-sans text-sm leading-snug">{msg.text}</p>
                          <p className="mt-1 text-right text-xs text-tv-muted">
                            {new Date(msg.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <button
                            type="button"
                            className="absolute -bottom-3 -right-2 grid h-8 min-w-8 place-items-center rounded-full bg-tv-white px-1 text-xs text-tv-heart shadow"
                            onClick={() => {
                              toggleHeart(town, msg.id);
                              poke((n) => n + 1);
                            }}
                            aria-label="Heart"
                          >
                            <Heart className={`size-3 ${loved ? "fill-tv-heart" : ""}`} />
                            {hearts > 0 ? hearts : ""}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="flex items-center gap-2 px-3 pb-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = draft.trim();
                  if (!text) return;
                  say(town, text);
                  setDraft("");
                  poke((n) => n + 1);
                }}
              >
                <input
                  className="pixel-input"
                  placeholder="Message"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-tv-ink text-tv-white" aria-label="Send">
                  <SendHorizontal className="size-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center px-6 text-center">
              <div>
                <Lock className="mx-auto mb-3 size-8 text-tv-muted" />
                <p className="font-sans text-lg font-semibold">This room is locked</p>
                <p className="mt-2 max-w-sm text-sm text-tv-muted">
                  It opens when your last 30 days reach {tier.label}. Drag revenue in your profile, then walk back to the building.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PetMark({ tier }: { tier: TierId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 24, 24);
    drawPet(ctx, 12, 20, tier, 0.4);
  }, [tier]);
  return <canvas ref={ref} width={24} height={24} className="h-8 w-8" style={{ imageRendering: "pixelated" }} />;
}

function Star() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path fill="#2f5ea8" d="M8 1.2 9.8 6h4.4L11 8.8l1.2 4.8L8 11.2 3.8 13.6 5 8.8 1.8 6h4.4z" />
    </svg>
  );
}

export function FounderTown() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const townRef = useRef<Town | null>(null);
  const sheetRef = useRef<"closed" | "create" | "edit">("create");
  const textRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState<"closed" | "create" | "edit">("create");
  const [textOn, setTextOn] = useState(false);
  const [tick, setTick] = useState(0);
  const [draft, setDraft] = useState("");
  const sigRef = useRef("");

  sheetRef.current = sheet;
  textRef.current = textOn;

  useEffect(() => {
    const town = createTown(loadSave());
    townRef.current = town;
    town.onRequest = (request) => {
      if (request === "text") {
        textRef.current = true;
        setTextOn(true);
      }
      if (request === "profile" || request === "create") {
        sheetRef.current = "edit";
        setSheet("edit");
      }
    };
    if (town.seen) {
      sheetRef.current = "closed";
      setSheet("closed");
      town.createOpen = false;
    }
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const fit = () => {
      const cssW = stage.clientWidth || window.innerWidth;
      const cssH = stage.clientHeight || window.innerHeight;
      let scale = Math.floor(Math.min(cssW / 340, cssH / 210));
      if (scale < 2) scale = 2;
      if (scale > 4) scale = 4;
      const viewW = Math.max(180, Math.floor(cssW / scale));
      const viewH = Math.max(150, Math.floor(cssH / scale));
      canvas.width = viewW;
      canvas.height = viewH;
      canvas.style.width = `${viewW * scale}px`;
      canvas.style.height = `${viewH * scale}px`;
      town.viewW = viewW;
      town.viewH = viewH;
      town.narrow = cssW < 860;
    };
    fit();

    window.__controlsTest = {
      getYaw: () => {
        if (town.player.facing === 2) return Math.PI / 2;
        if (town.player.facing === 3) return -Math.PI / 2;
        if (town.player.facing === 1) return Math.PI;
        return 0;
      },
      getSpeed: () => town.speed,
      getX: () => town.player.x,
      getY: () => town.player.y,
      setKeys: (codes) => {
        town.qaKeys = new Set(codes);
      },
      setSteer: (v) => {
        town.qaKeys = new Set(v > 0 ? ["KeyW", "KeyA"] : v < 0 ? ["KeyW", "KeyD"] : ["KeyW"]);
      },
      setPos: (x, y) => {
        town.player.x = x;
        town.player.y = y;
        town.player.path = null;
        town.cam.x = x - town.viewW / 2;
        town.cam.y = y - town.viewH / 2;
      },
    };

    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      town.createOpen = sheetRef.current !== "closed";
      town.textOpen = textRef.current;
      town.hudLift = town.narrow && sheetRef.current === "closed" && !textRef.current ? 34 : 0;
      updateTown(town, dt);
      const ctx = canvas.getContext("2d");
      if (ctx) drawTown(ctx, town);
      const sig = [
        town.prompt,
        town.menu ?? "",
        town.inspectId ?? "",
        town.chatOpen ? "c" : "",
        town.adMode ? "a" : "",
        town.toast?.text ?? "",
        town.player.revenue,
        town.eggs.length,
        town.mode,
        town.room ?? "",
        town.player.name,
      ].join("|");
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        setTick((n) => n + 1);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const down = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if (typing) {
        if (e.code === "Escape") {
          town.chatOpen = false;
          town.adMode = false;
          (e.target as HTMLElement).blur();
        }
        return;
      }
      if (e.repeat) return;
      town.keys.add(e.code);
      town.just.add(e.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => town.keys.delete(e.code);
    const blur = () => town.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    const vis = () => {
      if (document.hidden) town.keys.clear();
    };
    document.addEventListener("visibilitychange", vis);
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    setReady(true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", vis);
      ro.disconnect();
      delete window.__controlsTest;
    };
  }, []);

  const town = townRef.current;
  void tick;

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const current = townRef.current;
    const canvas = canvasRef.current;
    if (!current || !canvas) return;
    if (!current.audio) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) current.audio = new Ctx();
    }
    void current.audio?.resume();
    const rect = canvas.getBoundingClientRect();
    const view = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
    if (clickUI(current, view.x, view.y)) {
      setTick((n) => n + 1);
      return;
    }
    if (current.mode === "in") {
      const ox = Math.floor((current.viewW - INT_W) / 2);
      const oy = Math.floor((current.viewH - INT_H) / 2);
      clickWorld(current, view.x - ox, view.y - oy);
    } else {
      clickWorld(current, view.x + current.cam.x, view.y + current.cam.y);
    }
  };

  return (
    <main className="town-root">
      <h1 className="sr-only">TrustVoice Founder Town</h1>
      <div ref={stageRef} className="town-stage">
        <canvas ref={canvasRef} onPointerDown={onPointer} aria-label="Founder town map" />
      </div>
      {ready && town && sheet !== "closed" && (
        <Creator town={town} mode={sheet === "edit" ? "edit" : "create"} onClose={() => setSheet("closed")} />
      )}
      {ready && town && textOn && (
        <TextMode
          town={town}
          onClose={() => {
            textRef.current = false;
            setTextOn(false);
          }}
        />
      )}
      {ready && town && (town.chatOpen || town.adMode) && !textOn && sheet === "closed" && (
        <form
          className="absolute inset-x-0 bottom-0 z-20 flex gap-2 bg-tv-ink p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (town.adMode) applyProfile(town, { ad: text || town.ad });
            else if (text) say(town, text);
            town.chatOpen = false;
            town.adMode = false;
            setDraft("");
            setTick((n) => n + 1);
          }}
        >
          <input
            autoFocus
            className="pixel-input"
            maxLength={town.adMode ? 18 : 180}
            placeholder={town.adMode ? "Your ad" : "Say something in town"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="rounded-full bg-tv-blue px-4 font-sans text-sm font-semibold text-tv-white">
            Send
          </button>
        </form>
      )}
      {ready && sheet === "closed" && !textOn && (
        <div className="touch-controls pointer-events-none absolute inset-0 z-10">
          <Pad
            onChange={(x, y) => {
              const current = townRef.current;
              if (!current) return;
              current.touch = { x, y };
            }}
          />
          <div className="pointer-events-auto absolute bottom-4 right-3 flex flex-col gap-2">
            <Round label="Look" onPress={() => press(townRef.current, "Space")} />
            <Round label="Talk" onPress={() => press(townRef.current, "Enter")} />
            <Round label="Menu" onPress={() => press(townRef.current, "Escape")} />
          </div>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {town?.prompt ?? "Loading founder town"}
      </p>
    </main>
  );
}

function press(town: Town | null, code: string) {
  if (!town) return;
  if (!town.audio) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) town.audio = new Ctx();
  }
  town.just.add(code);
  saveTown(town);
}

function Round({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      className="grid h-14 min-w-14 place-items-center rounded-full bg-tv-ink px-3 font-sans text-sm font-semibold text-tv-white"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
    >
      {label}
    </button>
  );
}

function Pad({ onChange }: { onChange: (x: number, y: number) => void }) {
  const id = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const end = () => {
    id.current = null;
    onChange(0, 0);
  };
  return (
    <div
      className="pad pointer-events-auto absolute bottom-4 left-3 h-32 w-32 rounded-full"
      onPointerDown={(e) => {
        e.stopPropagation();
        id.current = e.pointerId;
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        origin.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (id.current !== e.pointerId) return;
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        const m = Math.hypot(dx, dy);
        if (m < 10) onChange(0, 0);
        else onChange((dx / m) * Math.min(1, m / 42), (dy / m) * Math.min(1, m / 42));
      }}
      onPointerUp={end}
      onPointerCancel={end}
    />
  );
}
