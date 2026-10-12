import { canEnter, formatMo, NPCS, SEED_MESSAGES, tierOf } from "./content";
import { ascii } from "./font";
import {
  blockedPixel,
  buildMap,
  findPath,
  interiorBlocked,
  INT_H,
  INT_W,
  snapWalkable,
} from "./map";
import type { Actor, Building, ChatMsg, Look, TierId, Town } from "./types";
import { COLS, ROWS, TILE } from "./types";

const SAVE_KEY = "trustvoice-town-v1";

export type SaveData = {
  v: 1;
  name: string;
  look: Look;
  revenue: number;
  anonymous: boolean;
  startupName: string;
  blurb: string;
  ad: string;
  eggs: string[];
  seen: boolean;
  muted: boolean;
  showNames: boolean;
  showBubbles: boolean;
  extra: ChatMsg[];
  hearted: string[];
};

const defaultLook = (): Look => ({ hair: 0, hairColor: 0, skin: 0, shirt: 0 });

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (!data || data.v !== 1 || !data.look) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveTown(town: Town) {
  const data: SaveData = {
    v: 1,
    name: town.player.name,
    look: town.player.look,
    revenue: town.player.revenue,
    anonymous: town.anonymous,
    startupName: town.startupName,
    blurb: town.blurb,
    ad: town.ad,
    eggs: town.eggs,
    seen: town.seen,
    muted: town.muted,
    showNames: town.showNames,
    showBubbles: town.showBubbles,
    extra: town.messages.filter((m) => m.mine),
    hearted: [...town.hearted],
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function makeActor(partial: Omit<Actor, "outX" | "outY" | "slotX" | "slotY" | "frame" | "frameT" | "moving" | "wanderT" | "path" | "pathI" | "petX" | "petY" | "facing"> & { facing?: Actor["facing"] }): Actor {
  return {
    ...partial,
    facing: partial.facing ?? 0,
    frame: 0,
    frameT: 0,
    moving: false,
    wanderT: Math.random() * 2,
    path: null,
    pathI: 0,
    petX: partial.x - 12,
    petY: partial.y + 2,
    outX: partial.x,
    outY: partial.y,
    slotX: partial.x,
    slotY: partial.y,
  };
}

export function createTown(save: SaveData | null): Town {
  const map = buildMap();
  const look = save?.look ?? defaultLook();
  const spawn = snapWalkable(map, map.spawn.x, map.spawn.y);
  const player = makeActor({
    id: "you",
    name: save?.name?.trim() || "Alex",
    revenue: save?.revenue ?? 0,
    look,
    x: spawn.x,
    y: spawn.y,
    home: tierOf(save?.revenue ?? 0).id,
    outside: true,
    lines: [],
    lineI: 0,
    startups: [],
    phase: 0.4,
  });
  const npcs = NPCS.map((def) => {
    const spot = snapWalkable(map, def.x, def.y);
    return makeActor({
      id: def.id,
      name: def.name,
      revenue: def.revenue,
      look: def.look,
      x: spot.x,
      y: spot.y,
      home: tierOf(def.revenue).id,
      outside: def.outside,
      lines: def.lines,
      lineI: 0,
      startups: def.startups,
      phase: Math.random() * 6,
    });
  });
  const extra = save?.extra ?? [];
  return {
    time: 0,
    map,
    player,
    npcs,
    cam: { x: spawn.x - 180, y: spawn.y - 120 },
    keys: new Set(),
    qaKeys: null,
    just: new Set(),
    touch: { x: 0, y: 0 },
    mode: "out",
    room: null,
    fade: 0,
    fadeDir: 0,
    pending: null,
    menu: null,
    menuIndex: 2,
    inspectId: null,
    bubbles: [],
    toast: null,
    eggs: save?.eggs ?? [],
    dest: null,
    autoEnter: null,
    autoInspect: null,
    chatOpen: false,
    adMode: false,
    muted: save?.muted ?? false,
    showNames: save?.showNames ?? false,
    showBubbles: save?.showBubbles ?? true,
    anonymous: save?.anonymous ?? false,
    startupName: save?.startupName ?? "",
    blurb: save?.blurb ?? "",
    ad: save?.ad ?? "",
    messages: [...SEED_MESSAGES, ...extra],
    hearted: new Set(save?.hearted ?? []),
    shake: 0,
    prompt: "WASD walk   SPACE look   ESC menu",
    hits: [],
    viewW: 320,
    viewH: 200,
    hudLift: 0,
    createOpen: false,
    textOpen: false,
    narrow: false,
    seen: save?.seen ?? true,
    speed: 0,
    chatter: 2,
    returnX: spawn.x,
    returnY: spawn.y,
    displaced: false,
    audio: null,
    onRequest: null,
  };
}

function held(town: Town, code: string): boolean {
  return (town.qaKeys ?? town.keys).has(code);
}

function blip(town: Town, freq: number, dur = 0.06) {
  if (town.muted || !town.audio) return;
  const ac = town.audio;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "square";
  o.frequency.value = freq;
  g.gain.value = 0.03;
  o.connect(g);
  g.connect(ac.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.stop(ac.currentTime + dur);
}

function displayName(town: Town, actor: Actor): string {
  if (actor.id === "you" && town.anonymous) return "Anonymous";
  return actor.name.split(" ")[0] ?? actor.name;
}

export function pushBubble(town: Town, actor: Actor, text: string) {
  const clean = ascii(text).slice(0, 140);
  if (!clean.trim()) return;
  town.bubbles = town.bubbles.filter((b) => b.anchor !== actor.id);
  town.bubbles.push({
    id: `${actor.id}-${town.time.toFixed(2)}`,
    anchor: actor.id,
    name: displayName(town, actor),
    meta: formatMo(actor.revenue),
    text: clean,
    until: town.time + 4.5,
  });
  if (town.bubbles.length > 5) town.bubbles.shift();
}

export function say(town: Town, text: string) {
  const clean = ascii(text).trim().slice(0, 180);
  if (!clean) return;
  const room: TierId = town.mode === "in" && town.room ? town.room : "sprout";
  pushBubble(town, town.player, clean);
  town.messages.push({
    id: `m-${Date.now()}`,
    room,
    author: town.anonymous ? "Anonymous" : town.player.name,
    text: clean,
    ts: Date.now(),
    revenue: town.player.revenue,
    mine: true,
  });
  blip(town, 520, 0.05);
  saveTown(town);
  const roomies = town.npcs.filter((n) => n.home === room && n.lines.length);
  const reply = roomies[Math.floor(Math.random() * roomies.length)];
  if (reply && Math.random() < 0.65) {
    const line = reply.lines[reply.lineI % reply.lines.length]!;
    reply.lineI++;
    window.setTimeout(() => {
      if (!town.bubbles) return;
      pushBubble(town, reply, line);
      town.messages.push({
        id: `r-${Date.now()}`,
        room,
        author: reply.name,
        text: line,
        ts: Date.now(),
        revenue: reply.revenue,
      });
    }, 700);
  }
}

function doorSpot(b: Building): { x: number; y: number } {
  const x = (b.tx + Math.floor(b.tw / 2)) * TILE + 8;
  const y = b.door === "s" ? (b.ty + b.th) * TILE + 6 : b.ty * TILE - 6;
  return { x, y };
}

function nearestNpc(town: Town, x: number, y: number, max: number): Actor | null {
  let best: Actor | null = null;
  let bestD = max;
  const list =
    town.mode === "in" ? town.npcs.filter((n) => n.home === town.room) : town.npcs.filter((n) => n.outside);
  for (const n of list) {
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

function nearestDoor(town: Town): { b: Building; d: number; x: number; y: number } | null {
  let best: { b: Building; d: number; x: number; y: number } | null = null;
  for (const b of town.map.buildings) {
    if (!b.tier) continue;
    const s = doorSpot(b);
    const d = Math.hypot(town.player.x - s.x, town.player.y - s.y);
    if (!best || d < best.d) best = { b, d, x: s.x, y: s.y };
  }
  return best;
}

function discover(town: Town, id: string, line: string) {
  if (!town.eggs.includes(id)) town.eggs.push(id);
  town.toast = { text: line, until: town.time + 4.2 };
  blip(town, 660, 0.08);
  saveTown(town);
}

function tryEnter(town: Town, tier: TierId) {
  if (!canEnter(town.player.revenue, tier)) {
    const row = tierOf(tier === "crown" ? 1_000_000 : tier === "diamond" ? 100_000 : tier === "rocket" ? 10_000 : tier === "tree" ? 1000 : tier === "seed" ? 1 : 0);
    town.toast = { text: `Locked. Need ${row.label} in the last 30 days.`, until: town.time + 2.6 };
    town.shake = 0.25;
    blip(town, 140, 0.1);
    return;
  }
  if (town.fadeDir !== 0) return;
  town.pending = { kind: "enter", tier };
  town.fadeDir = 1;
  blip(town, 420, 0.07);
}

function applyPending(town: Town) {
  const pending = town.pending;
  town.pending = null;
  if (!pending) return;
  if (pending.kind === "exit") {
    if (town.displaced && town.room) {
      for (const n of town.npcs) {
        if (n.home === town.room) {
          n.x = n.outX;
          n.y = n.outY;
          n.petX = n.x - 12;
          n.petY = n.y + 2;
          n.path = null;
        }
      }
    }
    town.player.x = town.returnX;
    town.player.y = town.returnY;
    town.player.path = null;
    town.mode = "out";
    town.room = null;
    town.displaced = false;
    town.bubbles = [];
    town.cam.x = town.player.x - town.viewW / 2;
    town.cam.y = town.player.y - town.viewH / 2;
    return;
  }
  town.returnX = town.player.x;
  town.returnY = town.player.y;
  const group = town.npcs.filter((n) => n.home === pending.tier);
  group.forEach((n, i) => {
    n.outX = n.x;
    n.outY = n.y;
    n.slotX = 46 + (i % 4) * 62;
    n.slotY = 96 + Math.floor(i / 4) * 46;
    n.x = n.slotX;
    n.y = n.slotY;
    n.petX = n.x - 12;
    n.petY = n.y;
    n.path = null;
    n.facing = 0;
  });
  town.player.x = 150;
  town.player.y = 172;
  town.player.petX = 136;
  town.player.petY = 176;
  town.player.path = null;
  town.mode = "in";
  town.room = pending.tier;
  town.displaced = true;
  town.bubbles = [];
}

export function toggleHeart(town: Town, id: string) {
  if (town.hearted.has(id)) town.hearted.delete(id);
  else town.hearted.add(id);
  saveTown(town);
}

export function applyProfile(
  town: Town,
  patch: Partial<Pick<SaveData, "name" | "look" | "revenue" | "anonymous" | "startupName" | "blurb" | "ad" | "seen">>,
) {
  if (patch.name != null) town.player.name = patch.name.trim().slice(0, 16) || "Alex";
  if (patch.look) town.player.look = patch.look;
  if (patch.revenue != null) {
    town.player.revenue = Math.max(0, patch.revenue);
    town.player.home = tierOf(town.player.revenue).id;
  }
  if (patch.anonymous != null) town.anonymous = patch.anonymous;
  if (patch.startupName != null) town.startupName = patch.startupName.slice(0, 28);
  if (patch.blurb != null) town.blurb = patch.blurb.slice(0, 90);
  if (patch.ad != null) town.ad = patch.ad.slice(0, 18);
  if (patch.seen != null) town.seen = patch.seen;
  saveTown(town);
}

function interact(town: Town) {
  const npc = nearestNpc(town, town.player.x, town.player.y, 28);
  if (npc) {
    town.inspectId = npc.id;
    town.autoInspect = null;
    blip(town, 480, 0.04);
    return;
  }
  if (town.mode === "out") {
    for (const egg of town.map.eggs) {
      if (Math.hypot(town.player.x - egg.x, town.player.y - egg.y) <= egg.r + 8) {
        discover(town, egg.id, egg.line);
        return;
      }
    }
    const board = town.map.props.find((p) => p.kind === "billboard");
    if (board && Math.hypot(town.player.x - board.x, town.player.y - board.y) < 34) {
      town.adMode = true;
      town.chatOpen = false;
      return;
    }
    const door = nearestDoor(town);
    if (door && door.d < 30 && door.b.tier) {
      tryEnter(town, door.b.tier);
    }
  }
}

function onExitMat(town: Town): boolean {
  return town.player.y > INT_H - 22 && town.player.x > 120 && town.player.x < 180;
}

function primary(town: Town) {
  if (town.mode === "in" && onExitMat(town)) {
    if (town.fadeDir === 0) {
      town.pending = { kind: "exit" };
      town.fadeDir = 1;
    }
    return;
  }
  if (town.mode === "out") {
    const door = nearestDoor(town);
    if (door && door.d < 30 && door.b.tier) {
      tryEnter(town, door.b.tier);
      return;
    }
  }
  town.chatOpen = true;
  town.adMode = false;
}

function activateMenu(town: Town) {
  if (town.menu === "about") {
    town.menu = "main";
    town.menuIndex = 3;
    return;
  }
  if (town.menu === "settings") {
    if (town.menuIndex === 0) town.showNames = !town.showNames;
    else if (town.menuIndex === 1) town.showBubbles = !town.showBubbles;
    else if (town.menuIndex === 2) town.muted = !town.muted;
    else {
      town.menu = "main";
      town.menuIndex = 1;
    }
    saveTown(town);
    blip(town, 500, 0.04);
    return;
  }
  if (town.menu === "main") {
    if (town.menuIndex === 0) {
      town.menu = null;
      town.onRequest?.("profile");
    } else if (town.menuIndex === 1) {
      town.menu = "settings";
      town.menuIndex = 0;
    } else if (town.menuIndex === 2) {
      town.menu = null;
      town.onRequest?.("text");
    } else if (town.menuIndex === 3) {
      town.menu = "about";
    } else town.menu = null;
    blip(town, 500, 0.04);
  }
}

function menuCount(town: Town): number {
  if (town.menu === "settings") return 4;
  if (town.menu === "main") return 5;
  return 0;
}

function moveBody(x: number, y: number, dx: number, dy: number, blocked: (x: number, y: number) => boolean) {
  let nx = x + dx;
  let ny = y + dy;
  if (!blocked(nx, y)) x = nx;
  else nx = x;
  if (!blocked(x, ny)) y = ny;
  return { x, y };
}

function stepActor(town: Town, dt: number) {
  const blocked =
    town.mode === "in"
      ? (x: number, y: number) => interiorBlocked(x, y)
      : (x: number, y: number) => blockedPixel(town.map, x, y);

  const allow = town.qaKeys != null || (!town.createOpen && !town.textOpen && !town.menu && !town.inspectId && !town.chatOpen && !town.adMode && town.fadeDir === 0);
  let mx = 0;
  let my = 0;
  const keyboard =
    held(town, "KeyA") ||
    held(town, "ArrowLeft") ||
    held(town, "KeyD") ||
    held(town, "ArrowRight") ||
    held(town, "KeyW") ||
    held(town, "ArrowUp") ||
    held(town, "KeyS") ||
    held(town, "ArrowDown");
  if (allow) {
    if (held(town, "KeyA") || held(town, "ArrowLeft")) mx -= 1;
    if (held(town, "KeyD") || held(town, "ArrowRight")) mx += 1;
    if (held(town, "KeyW") || held(town, "ArrowUp")) my -= 1;
    if (held(town, "KeyS") || held(town, "ArrowDown")) my += 1;
  }
  if (keyboard && (mx !== 0 || my !== 0)) {
    const m = Math.hypot(mx, my) || 1;
    mx /= m;
    my /= m;
    town.player.path = null;
    town.dest = null;
    town.autoEnter = null;
    town.autoInspect = null;
  } else if (allow && (town.touch.x !== 0 || town.touch.y !== 0)) {
    mx = town.touch.x;
    my = town.touch.y;
    const m = Math.hypot(mx, my);
    if (m > 1) {
      mx /= m;
      my /= m;
    }
    town.player.path = null;
    town.dest = null;
  } else if (allow && town.player.path && town.player.pathI < town.player.path.length) {
    const target = town.player.path[town.player.pathI]!;
    const dx = target.x - town.player.x;
    const dy = target.y - town.player.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) town.player.pathI++;
    else {
      mx = dx / d;
      my = dy / d;
    }
  } else if (town.player.path && town.player.pathI >= town.player.path.length) {
    town.player.path = null;
    town.dest = null;
    if (town.autoEnter) {
      const tier = town.autoEnter;
      town.autoEnter = null;
      tryEnter(town, tier);
    }
    if (town.autoInspect) {
      const id = town.autoInspect;
      town.autoInspect = null;
      const npc = town.npcs.find((n) => n.id === id);
      if (npc && Math.hypot(npc.x - town.player.x, npc.y - town.player.y) < 30) town.inspectId = npc.id;
    }
  }

  const run = held(town, "ShiftLeft") || held(town, "ShiftRight");
  const speed = (run ? 128 : 86) * (mx || my ? 1 : 0);
  town.speed = Math.hypot(mx, my) > 0 ? (run ? 128 : 86) : 0;
  if (town.speed > 0 && allow) {
    const next = moveBody(town.player.x, town.player.y, mx * speed * dt, my * speed * dt, blocked);
    const moved = next.x !== town.player.x || next.y !== town.player.y;
    town.player.x = next.x;
    town.player.y = next.y;
    town.player.moving = moved;
    if (Math.abs(mx) > Math.abs(my)) town.player.facing = mx < 0 ? 2 : 3;
    else if (my < 0) town.player.facing = 1;
    else if (my > 0) town.player.facing = 0;
    if (moved) {
      town.player.frameT += dt;
      if (town.player.frameT > 0.15) {
        town.player.frame = town.player.frame ? 0 : 1;
        town.player.frameT = 0;
      }
    }
  } else {
    town.player.moving = false;
    town.speed = 0;
  }

  const back: [number, number][] = [
    [0, -1],
    [0, 1],
    [1, 0],
    [-1, 0],
  ];
  const b = back[town.player.facing] ?? [0, -1];
  const tx = town.player.x + b[0] * 13;
  const ty = town.player.y + b[1] * 11;
  const k = Math.min(1, dt * 6);
  town.player.petX += (tx - town.player.petX) * k;
  town.player.petY += (ty - town.player.petY) * k;
}

function wander(town: Town, dt: number) {
  if (town.mode === "in" && town.room) {
    for (const n of town.npcs) {
      if (n.home !== town.room) continue;
      const ox = n.slotX + Math.sin(town.time * 0.7 + n.phase) * 16;
      const oy = n.slotY + Math.cos(town.time * 0.55 + n.phase) * 8;
      if (!interiorBlocked(ox, oy)) {
        n.facing = ox < n.x ? 2 : 3;
        n.moving = Math.abs(ox - n.x) > 0.2;
        n.x = ox;
        n.y = oy;
        if (n.moving) {
          n.frameT += dt;
          if (n.frameT > 0.2) {
            n.frame = n.frame ? 0 : 1;
            n.frameT = 0;
          }
        }
      }
      n.petX += (n.x - 12 - n.petX) * Math.min(1, dt * 5);
      n.petY += (n.y + 2 - n.petY) * Math.min(1, dt * 5);
    }
    return;
  }
  for (const n of town.npcs) {
    if (!n.outside) continue;
    n.wanderT -= dt;
    if (n.wanderT <= 0) {
      n.wanderT = 1.4 + Math.random() * 3.2;
      if (Math.random() < 0.6) {
        const ang = Math.random() * Math.PI * 2;
        const dist = TILE * (2 + Math.random() * 4);
        const gx = n.x + Math.cos(ang) * dist;
        const gy = n.y + Math.sin(ang) * dist;
        n.path = findPath(town.map, n.x, n.y, gx, gy);
        n.pathI = 0;
      } else n.path = null;
    }
    if (n.path && n.pathI < n.path.length) {
      const target = n.path[n.pathI]!;
      const dx = target.x - n.x;
      const dy = target.y - n.y;
      const d = Math.hypot(dx, dy);
      if (d < 2.5) n.pathI++;
      else {
        const step = Math.min(d, 30 * dt);
        const nx = n.x + (dx / d) * step;
        const ny = n.y + (dy / d) * step;
        if (!blockedPixel(town.map, nx, ny)) {
          n.x = nx;
          n.y = ny;
          n.moving = true;
          if (Math.abs(dx) > Math.abs(dy)) n.facing = dx < 0 ? 2 : 3;
          else n.facing = dy < 0 ? 1 : 0;
          n.frameT += dt;
          if (n.frameT > 0.22) {
            n.frame = n.frame ? 0 : 1;
            n.frameT = 0;
          }
        } else n.path = null;
      }
    } else n.moving = false;
    n.petX += (n.x - 11 - n.petX) * Math.min(1, dt * 4);
    n.petY += (n.y + 1 - n.petY) * Math.min(1, dt * 4);
  }
}

function updatePrompt(town: Town) {
  if (town.mode === "in") {
    town.prompt = onExitMat(town) ? "ENTER  leave" : "ENTER talk   SPACE card   ESC menu";
    return;
  }
  const npc = nearestNpc(town, town.player.x, town.player.y, 28);
  if (npc) {
    town.prompt = `SPACE  ${npc.name.split(" ")[0]}`;
    return;
  }
  const door = nearestDoor(town);
  if (door && door.d < 30 && door.b.tier) {
    const row = tierOf(
      door.b.tier === "crown"
        ? 1_000_000
        : door.b.tier === "diamond"
          ? 100_000
          : door.b.tier === "rocket"
            ? 10_000
            : door.b.tier === "tree"
              ? 1000
              : door.b.tier === "seed"
                ? 1
                : 0,
    );
    town.prompt = canEnter(town.player.revenue, door.b.tier) ? `ENTER  ${row.sign}` : `LOCKED  ${row.label}`;
    return;
  }
  const board = town.map.props.find((p) => p.kind === "billboard");
  if (board && Math.hypot(town.player.x - board.x, town.player.y - board.y) < 34) {
    town.prompt = "SPACE  your ad";
    return;
  }
  town.prompt = "WASD   SPACE   ENTER   ESC";
}

function updateCamera(town: Town, dt: number) {
  let tx = town.player.x - town.viewW / 2;
  let ty = town.player.y - town.viewH / 2;
  if (town.mode === "out") {
    if (town.createOpen && !town.narrow) tx -= Math.min(town.viewW * 0.18, 70);
    if (town.createOpen && town.narrow) ty -= town.viewH * 0.18;
    const maxX = COLS * TILE - town.viewW;
    const maxY = ROWS * TILE - town.viewH;
    if (maxX <= 0) tx = maxX / 2;
    else tx = Math.max(0, Math.min(maxX, tx));
    if (maxY <= 0) ty = maxY / 2;
    else ty = Math.max(0, Math.min(maxY, ty));
  } else {
    tx = 0;
    ty = 0;
  }
  const k = Math.min(1, dt * 8);
  town.cam.x += (tx - town.cam.x) * k;
  town.cam.y += (ty - town.cam.y) * k;
}

export function updateTown(town: Town, dt: number) {
  const step = Math.min(dt, 0.05);
  town.time += step;
  town.shake = Math.max(0, town.shake - step);
  if (town.fadeDir === 1) {
    town.fade = Math.min(1, town.fade + step * 4.2);
    if (town.fade >= 1) {
      applyPending(town);
      town.fadeDir = -1;
    }
  } else if (town.fadeDir === -1) {
    town.fade = Math.max(0, town.fade - step * 4.2);
    if (town.fade <= 0) town.fadeDir = 0;
  }

  const uiBlock = town.createOpen || town.textOpen;
  if (!uiBlock && town.fadeDir === 0) {
    if (town.just.has("Escape")) {
      if (town.chatOpen || town.adMode) {
        town.chatOpen = false;
        town.adMode = false;
      } else if (town.inspectId) town.inspectId = null;
      else if (town.menu === "about" || town.menu === "settings") {
        town.menu = "main";
        town.menuIndex = town.menu === "main" ? 0 : 0;
      } else if (town.menu) town.menu = null;
      else {
        town.menu = "main";
        town.menuIndex = 2;
        blip(town, 440, 0.04);
      }
    } else if (town.menu) {
      const n = menuCount(town);
      if (n && (town.just.has("ArrowDown") || town.just.has("KeyS"))) town.menuIndex = (town.menuIndex + 1) % n;
      if (n && (town.just.has("ArrowUp") || town.just.has("KeyW"))) town.menuIndex = (town.menuIndex - 1 + n) % n;
      if (town.just.has("Enter") || town.just.has("Space")) activateMenu(town);
    } else if (town.inspectId && (town.just.has("Space") || town.just.has("Enter") || town.just.has("Escape"))) {
      town.inspectId = null;
    } else if (!town.chatOpen && !town.adMode) {
      if (town.just.has("Space")) interact(town);
      else if (town.just.has("Enter")) primary(town);
    }
  }
  town.just.clear();

  stepActor(town, step);
  wander(town, step);

  town.bubbles = town.bubbles.filter((b) => b.until > town.time);
  if (town.mode === "out" && town.fadeDir === 0) {
    town.chatter -= step;
    if (town.chatter <= 0) {
      town.chatter = 4.5 + Math.random() * 3.5;
      const outside = town.npcs.filter((n) => n.outside && n.lines.length);
      const near = outside.filter((n) => Math.hypot(n.x - town.player.x, n.y - town.player.y) < 170);
      const pool = near.length ? near : outside;
      const npc = pool[Math.floor(Math.random() * pool.length)];
      if (npc && !town.bubbles.some((b) => b.anchor === npc.id)) {
        const line = npc.lines[npc.lineI % npc.lines.length]!;
        npc.lineI++;
        pushBubble(town, npc, line);
      }
    }
    const duck = town.map.eggs.find((e) => e.id === "duck");
    if (duck && !town.eggs.includes("duck") && Math.hypot(town.player.x - duck.x, town.player.y - duck.y) < duck.r) {
      discover(town, duck.id, duck.line);
    }
  }
  updatePrompt(town);
  if (town.mode === "out") updateCamera(town, step);
  else {
    town.cam.x = 0;
    town.cam.y = 0;
  }
}

export function clickUI(town: Town, x: number, y: number): boolean {
  if (town.createOpen || town.textOpen) return false;
  for (const h of town.hits) {
    if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) {
      if (h.id === "inspect-close") {
        town.inspectId = null;
        return true;
      }
      if (h.id === "menu-close") {
        town.menu = "main";
        town.menuIndex = 3;
        return true;
      }
      if (h.id.startsWith("menu-")) {
        town.menuIndex = Number(h.id.slice(5));
        activateMenu(town);
        return true;
      }
    }
  }
  if (town.menu || town.inspectId) {
    town.menu = null;
    town.inspectId = null;
    return true;
  }
  return false;
}

export function clickWorld(town: Town, x: number, y: number) {
  if (town.createOpen || town.textOpen || town.menu || town.inspectId || town.fadeDir !== 0 || town.chatOpen) return;
  if (town.mode === "in") {
    town.player.path = [{ x, y }];
    town.player.pathI = 0;
    town.dest = { x, y };
    return;
  }
  const npc = town.npcs
    .filter((n) => n.outside)
    .find((n) => Math.hypot(n.x - x, n.y - y) < 16);
  if (npc) {
    const path = findPath(town.map, town.player.x, town.player.y, npc.x, npc.y);
    town.player.path = path;
    town.player.pathI = 0;
    town.dest = path ? path[path.length - 1]! : null;
    town.autoInspect = npc.id;
    town.autoEnter = null;
    return;
  }
  for (const b of town.map.buildings) {
    if (!b.tier) continue;
    const bx = b.tx * TILE;
    const by = b.ty * TILE;
    if (x >= bx && y >= by && x <= bx + b.tw * TILE && y <= by + b.th * TILE) {
      const spot = doorSpot(b);
      const path = findPath(town.map, town.player.x, town.player.y, spot.x, spot.y);
      town.player.path = path;
      town.player.pathI = 0;
      town.dest = { x: spot.x, y: spot.y };
      town.autoEnter = b.tier;
      town.autoInspect = null;
      return;
    }
  }
  const path = findPath(town.map, town.player.x, town.player.y, x, y);
  town.player.path = path;
  town.player.pathI = 0;
  town.dest = path ? { x, y } : null;
  town.autoEnter = null;
  town.autoInspect = null;
}

export { INT_W, INT_H };
