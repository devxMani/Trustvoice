import { ascii, drawText, textWidth, wrapText } from "./font";
import { HAIR_COLORS, SHIRT_COLORS, SKIN_COLORS, TIERS, TIER_THEME, tierOf } from "./content";
import { cellAt, INT_H, INT_W, PATH, WATER, WHEAT } from "./map";
import type { Actor, Building, Look, Prop, TierId, Town } from "./types";
import { COLS, ROWS, TILE } from "./types";

const INK = "#2a2418";
const CREAM = "#fbfcfe";

function hash(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w, h);
}

let groundCache: HTMLCanvasElement | null = null;

function ensureGround(town: Town): HTMLCanvasElement {
  if (groundCache) return groundCache;
  const c = document.createElement("canvas");
  c.width = COLS * TILE;
  c.height = ROWS * TILE;
  const g = c.getContext("2d");
  if (!g) return c;
  g.imageSmoothingEnabled = false;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const cell = cellAt(town.map, tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (cell === WATER) drawWaterTile(g, x, y, tx, ty);
      else if (cell === WHEAT) drawWheatTile(g, x, y, tx, ty);
      else {
        drawGrassTile(g, x, y, tx, ty);
        if (cell === PATH) drawPathTile(g, x, y, tx, ty, town);
      }
    }
  }
  for (const f of town.map.flowers) drawFlower(g, f.x, f.y, f.hue);
  groundCache = c;
  return c;
}

function drawGrassTile(ctx: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number) {
  const h = hash(tx, ty);
  rect(ctx, x, y, 16, 16, (h & 3) === 0 ? "#7dcc52" : "#6fc248");
  rect(ctx, x + (h % 11), y + ((h >> 3) % 11), 2, 1, "#5eae38");
  rect(ctx, x + ((h >> 8) % 13), y + ((h >> 12) % 12), 1, 2, "#8ed85c");
  if ((h & 15) === 0) {
    rect(ctx, x + 7, y + 8, 1, 3, "#4c982e");
    rect(ctx, x + 6, y + 9, 1, 2, "#4c982e");
    rect(ctx, x + 8, y + 9, 1, 2, "#4c982e");
  }
}

function drawPathTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  town: Town,
) {
  rect(ctx, x, y, 16, 16, "#e6c78a");
  const h = hash(tx + 9, ty + 3);
  rect(ctx, x + (h % 12), y + ((h >> 4) % 12), 2, 1, "#d2b06e");
  rect(ctx, x + ((h >> 8) % 10), y + ((h >> 11) % 10), 1, 1, "#f3ddb0");
  const edge = (nx: number, ny: number) => cellAt(town.map, nx, ny) !== PATH && cellAt(town.map, nx, ny) !== WATER;
  if (edge(tx, ty - 1)) rect(ctx, x, y, 16, 1, "#c9a86a");
  if (edge(tx, ty + 1)) rect(ctx, x, y + 15, 16, 1, "#c9a86a");
  if (edge(tx - 1, ty)) rect(ctx, x, y, 1, 16, "#c9a86a");
  if (edge(tx + 1, ty)) rect(ctx, x + 15, y, 1, 16, "#c9a86a");
}

function drawWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number) {
  rect(ctx, x, y, 16, 16, "#67c0e8");
  rect(ctx, x, y + ((ty + tx) % 3) * 4, 16, 2, "#8fd4f2");
  rect(ctx, x, y + 10, 16, 2, "#4eacd6");
  const h = hash(tx, ty);
  if ((h & 3) === 0) rect(ctx, x + (h % 10), y + 4, 3, 1, "#e7f7ff");
}

function drawWheatTile(ctx: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number) {
  rect(ctx, x, y, 16, 16, "#6aaa40");
  for (let i = 0; i < 5; i++) {
    const h = hash(tx * 3 + i, ty * 5);
    const sx = x + 1 + ((h >> (i % 4)) % 13);
    rect(ctx, sx, y + 2, 1, 12, i % 2 ? "#d8c45a" : "#c4983a");
    rect(ctx, sx, y + 2, 2, 2, "#e6d48a");
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, hue: number) {
  const colors = ["#e15a4a", "#f4f4f8", "#f0c84a"];
  rect(ctx, x + 1, y + 2, 1, 3, "#3d8a32");
  rect(ctx, x, y, 3, 2, colors[hue] ?? colors[0]!);
  rect(ctx, x + 1, y + 1, 1, 1, "#f7f4ec");
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  footX: number,
  footY: number,
  look: Look,
  facing: 0 | 1 | 2 | 3,
  frame: number,
  bob = 0,
) {
  const hair = HAIR_COLORS[look.hairColor % HAIR_COLORS.length] ?? "#3a2418";
  const skin = SKIN_COLORS[look.skin % SKIN_COLORS.length] ?? "#f3c7a2";
  const shirt = SHIRT_COLORS[look.shirt % SHIRT_COLORS.length] ?? "#3a6ec4";
  const left = Math.round(footX - 8);
  const top = Math.round(footY - 21 + bob);
  const flip = facing === 3;
  const back = facing === 1;
  const px = (lx: number, ly: number, w: number, h: number, color: string) => {
    const dx = flip ? 15 - lx - (w - 1) : lx;
    rect(ctx, left + dx, top + ly, w, h, color);
  };

  const leg = frame ? 1 : 0;
  px(5, 17 + (leg ? 0 : 1), 2, 3, "#2a3140");
  px(9, 17 + (leg ? 1 : 0), 2, 3, "#2a3140");
  px(5, 20, 2, 1, "#1a1a1a");
  px(9, 20, 2, 1, "#1a1a1a");

  px(4, 10, 8, 7, shirt);
  px(3, 11, 1, 4, shirt);
  px(12, 11, 1, 4, shirt);
  px(4, 16, 8, 1, "#1e2430");

  if (back) {
    px(4, 2, 8, 8, hair);
    if (look.hair === 1) {
      px(3, 4, 1, 8, hair);
      px(12, 4, 1, 8, hair);
    }
    if (look.hair === 3) {
      px(3, 0, 2, 3, hair);
      px(7, -1, 2, 3, hair);
      px(11, 0, 2, 3, hair);
    }
    if (look.hair === 4) px(6, -2, 4, 3, hair);
    px(6, 9, 4, 2, skin);
  } else {
    px(4, 4, 8, 6, skin);
    px(5, 6, 1, 1, "#2a2418");
    px(9, 6, 1, 1, "#2a2418");
    px(6, 8, 3, 1, "#e08a78");
    if (look.hair === 2) {
      px(5, 2, 6, 3, hair);
    } else if (look.hair === 3) {
      px(4, 1, 8, 4, hair);
      px(3, 0, 2, 3, hair);
      px(7, -1, 2, 3, hair);
      px(11, 0, 2, 3, hair);
    } else if (look.hair === 4) {
      px(4, 2, 8, 4, hair);
      px(6, -2, 4, 4, hair);
    } else if (look.hair === 1) {
      px(3, 2, 10, 5, hair);
      px(3, 6, 2, 6, hair);
      px(11, 6, 2, 6, hair);
    } else if (look.hair === 5) {
      px(3, 2, 10, 4, hair);
      px(11, 5, 2, 4, hair);
    } else {
      px(4, 1, 8, 5, hair);
      px(4, 5, 2, 2, hair);
      px(10, 5, 2, 2, hair);
    }
    px(6, 9, 4, 1, skin);
  }
}

export function drawPet(ctx: CanvasRenderingContext2D, x: number, y: number, tier: TierId, time: number) {
  const left = Math.round(x - 5);
  const top = Math.round(y - 12 + Math.sin(time * 6 + x) * 0.5);
  if (tier === "sprout") {
    rect(ctx, left + 2, top + 6, 6, 4, "#c47a3a");
    rect(ctx, left + 3, top + 5, 4, 1, "#a8642c");
    rect(ctx, left + 4, top + 2, 1, 4, "#3d8a32");
    rect(ctx, left + 2, top + 1, 3, 2, "#6ec84a");
    rect(ctx, left + 5, top + 2, 3, 2, "#8ed85c");
  } else if (tier === "seed") {
    rect(ctx, left + 2, top + 7, 6, 4, "#c47a3a");
    rect(ctx, left + 4, top + 3, 1, 4, "#3d8a32");
    rect(ctx, left + 1, top + 2, 4, 3, "#5cb83e");
    rect(ctx, left + 5, top + 1, 4, 3, "#8ed85c");
    rect(ctx, left + 3, top + 4, 3, 2, "#3d8a32");
  } else if (tier === "tree") {
    rect(ctx, left + 4, top + 7, 2, 4, "#8a5a32");
    rect(ctx, left + 1, top + 3, 8, 5, "#3d8a32");
    rect(ctx, left + 2, top + 1, 6, 3, "#5cb83e");
    rect(ctx, left + 3, top + 2, 2, 2, "#b6ec8a");
  } else if (tier === "rocket") {
    const flame = Math.floor(time * 10) % 2;
    rect(ctx, left + 3, top + 2, 4, 7, "#f4f4f8");
    rect(ctx, left + 2, top + 4, 1, 3, "#e15a4a");
    rect(ctx, left + 7, top + 4, 1, 3, "#e15a4a");
    rect(ctx, left + 4, top + 1, 2, 2, "#3a6ec4");
    rect(ctx, left + 4, top + 3, 2, 2, "#7eb6f0");
    rect(ctx, left + 4, top + 9, 2, 2 + flame, flame ? "#f0c84a" : "#e07a32");
  } else if (tier === "diamond") {
    rect(ctx, left + 4, top + 1, 2, 2, "#e7f7ff");
    rect(ctx, left + 2, top + 3, 6, 2, "#7ed0e8");
    rect(ctx, left + 1, top + 5, 8, 2, "#3aa0c8");
    rect(ctx, left + 3, top + 7, 4, 2, "#7ed0e8");
    rect(ctx, left + 4, top + 9, 2, 2, "#e7f7ff");
  } else {
    rect(ctx, left + 1, top + 5, 8, 3, "#e2b340");
    rect(ctx, left + 1, top + 2, 2, 4, "#e2b340");
    rect(ctx, left + 4, top + 1, 2, 5, "#f0d060");
    rect(ctx, left + 7, top + 2, 2, 4, "#e2b340");
    rect(ctx, left + 2, top + 6, 1, 1, "#e15a4a");
    rect(ctx, left + 5, top + 6, 1, 1, "#3a6ec4");
    rect(ctx, left + 7, top + 6, 1, 1, "#3aaa68");
  }
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "rgba(20, 40, 16, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function pane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  head: boolean,
  hair: string,
  skin: string,
  time: number,
  phase: number,
) {
  rect(ctx, x, y, w, h, "#c9b07a");
  rect(ctx, x + 1, y + 1, w - 2, h - 2, "#f6d56e");
  rect(ctx, x + (w >> 1), y + 1, 1, h - 2, "#e2c15a");
  rect(ctx, x + 1, y + (h >> 1), w - 2, 1, "#e2c15a");
  if (!head) return;
  const bob = Math.sin(time * 2.2 + phase) > 0 ? 0 : 1;
  const hx = x + Math.max(1, (w >> 1) - 3);
  const hy = y + 2 + bob;
  rect(ctx, hx, hy, 6, 3, hair);
  rect(ctx, hx, hy + 2, 6, 3, skin);
  rect(ctx, hx + 1, hy + 3, 1, 1, INK);
  rect(ctx, hx + 4, hy + 3, 1, 1, INK);
}

function roofBands(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, colors: string[]) {
  const bh = 4;
  colors.forEach((c, i) => rect(ctx, x, y + i * bh, w, bh, c));
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, gold = false) {
  rect(ctx, x, y, 14, 16, gold ? "#f0d78a" : "#e4eaf3");
  rect(ctx, x + 1, y + 1, 12, 14, gold ? "#c4922a" : "#c5d0e0");
  rect(ctx, x + 3, y + 3, 8, 6, gold ? "#f7e7b0" : "#f6d56e");
  rect(ctx, x + 10, y + 9, 2, 2, "#3aaa68");
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, time: number) {
  const x = b.tx * TILE;
  const y = b.ty * TILE;
  const w = b.tw * TILE;
  const h = b.th * TILE;
  if (b.kind === "office") {
    roofBands(ctx, x, y, w, ["#1f4e96", "#3a74c4", "#2a62b0", "#4e8ad6", "#2f5ea8"]);
    rect(ctx, x + w - 52, y + 4, 40, 14, "#1b2744");
    for (let i = 0; i < 4; i++) rect(ctx, x + w - 48 + i * 9, y + 6, 7, 10, "#2c4068");
    rect(ctx, x, y + 20, w, h - 20, "#f4f6fb");
    rect(ctx, x, y + 20, w, 3, "#3a6ec4");
    rect(ctx, x, y + 48, w, 3, "#3a6ec4");
    pane(ctx, x + 8, y + 28, 18, 14, false, "", "", time, 0);
    pane(ctx, x + 30, y + 28, 18, 14, true, "#f4f4f8", "#f3c7a2", time, 1);
    pane(ctx, x + 52, y + 28, 18, 14, false, "", "", time, 2);
    pane(ctx, x + w - 28, y + 28, 18, 14, true, "#3a2418", "#e0aa78", time, 2.4);
    pane(ctx, x + 8, y + 56, 22, 16, true, "#e07a32", "#f3c7a2", time, 0.6);
    pane(ctx, x + w - 36, y + 56, 22, 16, false, "", "", time, 1.2);
    drawDoor(ctx, x + (w >> 1) - 7, y + h - 18);
  } else if (b.kind === "shop") {
    roofBands(ctx, x, y, w, ["#8fd0cc", "#3d9a96", "#c9efec", "#2f7e7c"]);
    rect(ctx, x, y + 16, w, h - 16, "#f7f4ec");
    rect(ctx, x, y + 16, w, 3, "#3aaa68");
    for (let i = 0; i < 7; i++) rect(ctx, x + 4 + i * 16, y + 19, 8, 5, i % 2 ? "#f7f4ec" : "#3aaa68");
    drawDoor(ctx, x + (w >> 1) - 7, y + 26);
    pane(ctx, x + 8, y + 44, 28, 16, true, "#ead89a", "#f3c7a2", time, 0.2);
    pane(ctx, x + w - 40, y + 44, 24, 16, false, "", "", time, 1);
  } else if (b.kind === "cottage") {
    rect(ctx, x + 16, y, w - 32, 8, "#a84438");
    rect(ctx, x + 8, y + 6, w - 16, 8, "#c45a48");
    rect(ctx, x, y + 12, w, 10, "#d87060");
    rect(ctx, x + 8, y + 20, w - 16, h - 20, "#f3e6d4");
    rect(ctx, x + w - 28, y - 6, 8, 16, "#8a4038");
    rect(ctx, x + w - 30, y - 8, 12, 4, "#5c6573");
    pane(ctx, x + 12, y + 32, 16, 14, true, "#5ea84a", "#f7dcc8", time, 1);
    pane(ctx, x + w - 30, y + 32, 16, 14, false, "", "", time, 2);
    drawDoor(ctx, x + (w >> 1) - 7, y + h - 18);
    const smokeT = (time * 0.35) % 1;
    rect(ctx, x + w - 26 + Math.sin(time) * 2, y - 10 - smokeT * 12, 3, 2, "rgba(240,240,240,0.8)");
  } else if (b.kind === "house") {
    rect(ctx, x + 10, y, w - 20, 8, "#5a48b0");
    rect(ctx, x + 4, y + 6, w - 8, 8, "#6d5bd0");
    rect(ctx, x, y + 12, w, 8, "#8878e0");
    rect(ctx, x + 4, y + 18, w - 8, h - 18, "#f7f7fb");
    pane(ctx, x + 10, y + 28, 16, 12, false, "", "", time, 0);
    pane(ctx, x + w - 28, y + 28, 16, 12, true, "#ead89a", "#e0aa78", time, 1.4);
    pane(ctx, x + 10, y + 48, 18, 14, true, "#3a2418", "#c68642", time, 0.4);
    rect(ctx, x + (w >> 1) - 6, y + h - 14, 12, 12, "#d7deea");
    rect(ctx, x + (w >> 1) - 8, y + h - 6, 18, 8, "#c9b48a");
  } else if (b.kind === "diamond") {
    roofBands(ctx, x, y, w, ["#d7f4ff", "#7ec8ea", "#3aa0c8", "#b9e7f8"]);
    rect(ctx, x, y + 16, w, h - 16, "#f5fbff");
    rect(ctx, x, y + 16, w, 3, "#2a90b8");
    rect(ctx, x + (w >> 1) - 6, y + 22, 12, 8, "#7ed0e8");
    rect(ctx, x + (w >> 1) - 3, y + 20, 6, 4, "#e7f7ff");
    pane(ctx, x + 10, y + 36, 24, 16, true, "#6d5bd0", "#f3c7a2", time, 0.8);
    pane(ctx, x + w - 36, y + 36, 24, 16, true, "#1c1c1c", "#e0aa78", time, 1.6);
    drawDoor(ctx, x + (w >> 1) - 7, y + h - 18);
  } else if (b.kind === "crown") {
    roofBands(ctx, x, y, w, ["#a67c1a", "#e2b340", "#f0d060", "#c4922a"]);
    rect(ctx, x, y + 16, w, h - 16, "#fbf6ea");
    rect(ctx, x, y + 16, w, 4, "#e2b340");
    rect(ctx, x + 8, y + 24, 6, h - 40, "#f0e2b8");
    rect(ctx, x + w - 14, y + 24, 6, h - 40, "#f0e2b8");
    rect(ctx, x + (w >> 1) - 10, y + 28, 20, 10, "#e2b340");
    rect(ctx, x + (w >> 1) - 4, y + 24, 3, 6, "#f0d060");
    rect(ctx, x + (w >> 1) + 2, y + 26, 3, 4, "#f0d060");
    pane(ctx, x + 22, y + 40, 22, 16, true, "#ead89a", "#c68642", time, 0.3);
    pane(ctx, x + w - 46, y + 40, 22, 16, true, "#1c1c1c", "#8d5524", time, 1.1);
    drawDoor(ctx, x + (w >> 1) - 7, y + 16, true);
    rect(ctx, x + (w >> 1) - 16, y + h - 10, 32, 8, "#a32020");
  } else {
    rect(ctx, x + 4, y, w - 8, 10, "#8fd08a");
    rect(ctx, x + 10, y + 4, w - 20, 6, "#5cb85a");
    rect(ctx, x + 2, y + 10, 4, h - 14, "#c4a06a");
    rect(ctx, x + w - 6, y + 10, 4, h - 14, "#c4a06a");
    rect(ctx, x + 2, y + h - 8, 4, 8, "#c4a06a");
    rect(ctx, x + w - 6, y + h - 8, 4, 8, "#c4a06a");
    rect(ctx, x + 8, y + h - 6, w - 16, 4, "#e6c78a");
  }
}

function miniHead(ctx: CanvasRenderingContext2D, x: number, y: number, hair: string, skin: string) {
  rect(ctx, x, y, 6, 3, hair);
  rect(ctx, x, y + 3, 6, 3, skin);
  rect(ctx, x + 1, y + 4, 1, 1, INK);
  rect(ctx, x + 4, y + 4, 1, 1, INK);
}

function drawSign(ctx: CanvasRenderingContext2D, b: Building, town: Town) {
  if (!b.tier) return;
  const tier = TIERS.find((t) => t.id === b.tier)!;
  const label = tier.sign;
  const count = town.npcs.filter((n) => n.home === b.tier).length;
  const tw = textWidth(label);
  const w = 16 + tw + 28;
  const x = b.tx * TILE + (b.tw * TILE) / 2 - w / 2;
  const y = b.ty * TILE - 16;
  rect(ctx, x - 1, y - 1, w + 2, 14, INK);
  rect(ctx, x, y, w, 12, "#fff8ea");
  drawPet(ctx, x + 8, y + 12, b.tier, town.time);
  drawText(ctx, label, x + 14, y + 3, INK, 1);
  const hx = x + 16 + tw;
  miniHead(ctx, hx, y + 3, "#f4f4f8", "#f3c7a2");
  miniHead(ctx, hx + 7, y + 3, "#3a2418", "#e0aa78");
  drawText(ctx, `+${count}`, hx + 14, y + 3, INK, 1);
}

function drawProp(ctx: CanvasRenderingContext2D, p: Prop, time: number, ad: string) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  if (p.kind === "bush") {
    const r = 8 + (p.variant % 3);
    const greens = ["#3d8a32", "#4e9a38", "#2f7428"];
    const c = greens[p.variant % 3]!;
    for (let yy = -r; yy <= r; yy++) {
      for (let xx = -r; xx <= r; xx++) {
        if (xx * xx + yy * yy <= r * r) rect(ctx, x + xx, y - r + yy + 2, 1, 1, c);
      }
    }
    rect(ctx, x - 2, y - r, 3, 2, "#b6ec8a");
  } else if (p.kind === "tree") {
    rect(ctx, x - 2, y - 6, 4, 8, "#8a5a32");
    const r = 11;
    for (let yy = -r; yy <= r; yy++) {
      for (let xx = -r; xx <= r; xx++) {
        if (xx * xx + yy * yy <= r * r) rect(ctx, x + xx, y - 16 + yy, 1, 1, (xx + yy) % 7 === 0 ? "#2f7428" : "#3d8a32");
      }
    }
    rect(ctx, x - 3, y - 22, 4, 3, "#8ed85c");
  } else if (p.kind === "lamp") {
    rect(ctx, x, y - 18, 2, 18, "#2a2418");
    rect(ctx, x - 3, y - 22, 8, 5, "#f0c84a");
    rect(ctx, x - 2, y - 21, 6, 2, "#fff1a8");
    rect(ctx, x - 1, y, 4, 2, "#2a2418");
  } else if (p.kind === "fountain") {
    const r = 14;
    for (let yy = -r; yy <= r; yy++) {
      for (let xx = -r; xx <= r; xx++) {
        const d = xx * xx + yy * yy;
        if (d <= r * r && d >= (r - 3) * (r - 3)) rect(ctx, x + xx, y + yy, 1, 1, "#d7dbe2");
        else if (d < (r - 3) * (r - 3)) rect(ctx, x + xx, y + yy, 1, 1, "#7ec8ea");
      }
    }
    const jet = 8 + Math.sin(time * 5) * 2;
    rect(ctx, x, y - jet, 2, jet, "#e7f7ff");
    rect(ctx, x - 2, y - 2, 6, 2, "#f4fbff");
  } else if (p.kind === "bench") {
    rect(ctx, x - 8, y - 6, 16, 4, "#c47a3a");
    rect(ctx, x - 8, y - 2, 2, 4, "#8a5a32");
    rect(ctx, x + 6, y - 2, 2, 4, "#8a5a32");
    rect(ctx, x - 7, y - 8, 14, 2, "#d09050");
  } else if (p.kind === "billboard") {
    rect(ctx, x - 6, y - 8, 3, 16, "#8a5a32");
    rect(ctx, x + 16, y - 8, 3, 16, "#8a5a32");
    rect(ctx, x - 16, y - 28, 46, 22, "#2f5ea8");
    rect(ctx, x - 14, y - 26, 42, 18, "#f7f4ec");
    rect(ctx, x - 10, y - 22, 8, 8, "#2f5ea8");
    rect(ctx, x - 8, y - 18, 4, 2, "#f7f4ec");
    rect(ctx, x - 7, y - 20, 2, 6, "#f7f4ec");
    const msg = (ad || "YOUR AD").slice(0, 8).toUpperCase();
    drawText(ctx, msg, x + 2, y - 20, INK, 1);
  }
}

function drawBlimp(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const by = y + Math.sin(time * 0.8) * 2;
  ctx.fillStyle = "rgba(20,40,16,0.18)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 18, 16, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  rect(ctx, x, by, 28, 12, "#f7f7fb");
  rect(ctx, x + 2, by + 2, 24, 8, "#ffffff");
  rect(ctx, x, by + 5, 28, 2, "#3a6ec4");
  rect(ctx, x + 6, by + 3, 6, 6, "#2f5ea8");
  rect(ctx, x + 8, by + 5, 2, 2, "#f7f4ec");
  rect(ctx, x + 11, by + 12, 1, 4, "#5c6573");
  rect(ctx, x + 16, by + 12, 1, 4, "#5c6573");
  rect(ctx, x + 10, by + 16, 8, 3, "#c47a3a");
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string,
  meta: string,
  text: string,
  camX: number,
  camY: number,
  viewW: number,
) {
  const body = wrapText(ascii(text), 22).slice(0, 3);
  const head = ascii(`${name} ${meta}`).slice(0, 24);
  const lines = [head, ...body];
  const widest = Math.max(...lines.map((l) => textWidth(l)));
  const w = widest + 8;
  const h = lines.length * 8 + 4;
  let bx = Math.round(x - w / 2);
  const by = Math.round(y - 28 - h);
  const minX = camX + 2;
  const maxX = camX + viewW - w - 2;
  if (bx < minX) bx = minX;
  if (bx > maxX) bx = maxX;
  rect(ctx, bx - 1, by - 1, w + 2, h + 2, "#111214");
  rect(ctx, bx, by, w, h, "#1c1c1e");
  lines.forEach((line, i) => drawText(ctx, line, bx + 4, by + 3 + i * 8, i === 0 ? "#ffffff" : "#f2f2f4", 1));
  const tip = Math.round(x);
  rect(ctx, tip - 1, by + h, 2, 2, "#1c1c1e");
  rect(ctx, tip, by + h + 2, 1, 2, "#1c1c1e");
}

function frameOf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  rect(ctx, x - 3, y - 3, w + 6, h + 6, "#1e3f78");
  rect(ctx, x - 2, y - 2, w + 4, h + 4, "#2f5ea8");
  rect(ctx, x, y, w, h, CREAM);
}

function triangle(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x, y, 2, 7, INK);
  rect(ctx, x + 2, y + 1, 2, 5, INK);
  rect(ctx, x + 4, y + 2, 2, 3, INK);
}

function drawMenu(ctx: CanvasRenderingContext2D, town: Town) {
  if (!town.menu) return;
  if (town.menu === "about") {
    const lines = [
      "FOUNDER TOWN",
      "",
      "Rooms open from your",
      "last 30 days of revenue.",
      "",
      "WASD    walk",
      "SPACE   startups",
      "ENTER   go inside",
      "ESC     close this",
      "",
      "A tree pet is $1K-$10K.",
      "A rocket is $10K-$100K.",
      "",
      "Five eggs hide on",
      "the map. Go look.",
    ];
    const w = 168;
    const h = lines.length * 8 + 14;
    const x = Math.floor((town.viewW - w) / 2);
    const y = Math.max(8, Math.floor((town.viewH - h) / 2));
    frameOf(ctx, x, y, w, h);
    lines.forEach((line, i) => drawText(ctx, line, x + 8, y + 8 + i * 8, i === 0 ? INK : "#4a5568", 1));
    town.hits.push({ id: "menu-close", x, y, w, h });
    return;
  }
  const items =
    town.menu === "settings"
      ? [
          `NAMES    ${town.showNames ? "ON" : "OFF"}`,
          `BUBBLES  ${town.showBubbles ? "ON" : "OFF"}`,
          `SOUND    ${town.muted ? "OFF" : "ON"}`,
          "BACK",
        ]
      : ["MY PROFILE", "SETTINGS", "TEXT MODE", "ABOUT", "CLOSE"];
  const w = 158;
  const h = 28 + items.length * 18;
  const x = Math.floor((town.viewW - w) / 2);
  const y = Math.max(8, Math.floor((town.viewH - h) / 2));
  frameOf(ctx, x, y, w, h);
  if (town.menu === "main") {
    drawCharacter(ctx, x + w - 16, y + 24, town.player.look, 0, 0, 0);
  }
  items.forEach((label, i) => {
    const iy = y + 18 + i * 18;
    const on = i === town.menuIndex;
    if (on) triangle(ctx, x + 8, iy);
    drawText(ctx, label, x + 20, iy, on ? INK : "#5c6573", 1);
    town.hits.push({ id: `menu-${i}`, x, y: iy - 2, w, h: 16 });
  });
}

function drawInspect(ctx: CanvasRenderingContext2D, town: Town) {
  if (!town.inspectId) return;
  const npc = town.npcs.find((n) => n.id === town.inspectId);
  if (!npc) return;
  const lines = [npc.name.toUpperCase(), formatSafe(npc.revenue), ""];
  for (const s of npc.startups) {
    lines.push(s.name.toUpperCase().slice(0, 18));
    lines.push(s.mrr + " / MO");
    for (const part of wrapText(ascii(s.blurb), 22)) lines.push(part);
    lines.push("");
  }
  lines.push("SPACE TO CLOSE");
  const w = 160;
  const h = 12 + lines.length * 8;
  const x = Math.floor((town.viewW - w) / 2);
  const y = Math.max(6, Math.floor((town.viewH - h) / 2));
  frameOf(ctx, x, y, w, h);
  drawPet(ctx, x + w - 12, y + 16, tierOf(npc.revenue).id, town.time);
  lines.forEach((line, i) => drawText(ctx, line, x + 8, y + 6 + i * 8, i === 0 ? INK : "#3d4654", 1));
  town.hits.push({ id: "inspect-close", x, y, w, h });
}

function formatSafe(n: number): string {
  return tierOf(n).id === "seed" ? "<$1K / MO" : `${tierOf(n).sign}`;
}

function drawToast(ctx: CanvasRenderingContext2D, town: Town) {
  if (!town.toast || town.toast.until < town.time) return;
  const lines = wrapText(ascii(town.toast.text), 28);
  const w = Math.max(...lines.map((l) => textWidth(l))) + 12;
  const h = lines.length * 8 + 8;
  const x = Math.floor((town.viewW - w) / 2);
  const y = 8;
  frameOf(ctx, x, y, w, h);
  lines.forEach((line, i) => drawText(ctx, line, x + 6, y + 4 + i * 8, INK, 1));
}

function drawPrompt(ctx: CanvasRenderingContext2D, town: Town) {
  if (town.menu || town.inspectId || !town.prompt) return;
  const w = textWidth(town.prompt) + 10;
  const x = Math.floor((town.viewW - w) / 2);
  const y = town.viewH - 14 - town.hudLift;
  rect(ctx, x, y, w, 11, "rgba(16,20,16,0.78)");
  drawText(ctx, ascii(town.prompt), x + 5, y + 2, "#f7f4ec", 1);
}

function drawActor(ctx: CanvasRenderingContext2D, a: Actor, time: number, showNames: boolean) {
  drawShadow(ctx, a.petX, a.petY);
  drawPet(ctx, a.petX, a.petY, tierOf(a.revenue).id, time + a.phase);
  drawShadow(ctx, a.x, a.y);
  if (a.id === "you") {
    rect(ctx, a.x - 4, a.y + 1, 8, 2, "#f0c84a");
  }
  const bob = a.moving ? 0 : Math.sin(time * 3 + a.phase) > 0.85 ? -1 : 0;
  drawCharacter(ctx, a.x, a.y, a.look, a.facing, a.moving ? a.frame : 0, bob);
  if (showNames) {
    const label = a.name.split(" ")[0] ?? a.name;
    const tw = textWidth(label);
    drawText(ctx, label, a.x - tw / 2 + 1, a.y - 25, "rgba(20,30,16,0.45)");
    drawText(ctx, label, a.x - tw / 2, a.y - 26, "#fbfcfe");
  }
}

export function drawTown(ctx: CanvasRenderingContext2D, town: Town) {
  const { viewW, viewH } = town;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, viewW, viewH);
  town.hits = [];
  const shake = town.shake > 0 ? Math.sin(town.time * 40) * 2 : 0;
  const camX = Math.round(town.cam.x + shake);
  const camY = Math.round(town.cam.y);

  if (town.mode === "in" && town.room) {
    drawInterior(ctx, town);
  } else {
    const ground = ensureGround(town);
    ctx.drawImage(ground, -camX, -camY);
    shimmerWater(ctx, town, camX, camY);
    drawDuck(ctx, 30 * TILE + 6, 7 * TILE + 4, camX, camY);
    drawGold(ctx, 34 * TILE - 2, 4 * TILE + 2, camX, camY, town.time);
    const sprites: { y: number; draw: () => void }[] = [];
    for (const p of town.map.props) {
      if (p.kind === "blimp") continue;
      sprites.push({
        y: p.y,
        draw: () => drawProp(ctx, p, town.time, town.ad),
      });
    }
    for (const b of town.map.buildings) {
      sprites.push({
        y: (b.ty + b.th) * TILE,
        draw: () => drawBuilding(ctx, b, town.time),
      });
    }
    const actors = [town.player, ...town.npcs.filter((n) => n.outside)];
    for (const a of actors) {
      if (town.createOpen && a.id === "you" && false) continue;
      sprites.push({
        y: a.y,
        draw: () => drawActor(ctx, a, town.time, town.showNames && !(town.anonymous && a.id === "you")),
      });
    }
    sprites.sort((a, b) => a.y - b.y);
    ctx.save();
    ctx.translate(-camX, -camY);
    for (const s of sprites) s.draw();
    if (town.dest && town.player.path) {
      rect(ctx, town.dest.x - 2, town.dest.y - 2, 4, 4, town.time % 0.4 < 0.2 ? "#fff8ea" : "#e2b340");
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-camX, -camY);
    for (const b of town.map.buildings) drawSign(ctx, b, town);
    const blimp = town.map.props.find((p) => p.kind === "blimp");
    if (blimp) drawBlimp(ctx, blimp.x - 10, blimp.y - 20, town.time);
    if (town.showBubbles) {
      for (const bubble of town.bubbles) {
        const anchor =
          bubble.anchor === "you" ? town.player : town.npcs.find((n) => n.id === bubble.anchor);
        const ax = anchor?.x ?? bubbleAnchorFallback(town, bubble.anchor);
        const ay = anchor?.y ?? 0;
        if (!anchor) continue;
        drawBubble(ctx, ax, ay, bubble.name, bubble.meta, bubble.text, camX, camY, viewW);
      }
    }
    ctx.restore();
  }

  if (town.fade > 0) {
    ctx.fillStyle = `rgba(10, 16, 12, ${town.fade})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }
  drawPrompt(ctx, town);
  drawToast(ctx, town);
  if (town.menu) {
    ctx.fillStyle = "rgba(10, 16, 20, 0.28)";
    ctx.fillRect(0, 0, viewW, viewH);
    drawMenu(ctx, town);
  }
  if (town.inspectId) {
    ctx.fillStyle = "rgba(10, 16, 20, 0.28)";
    ctx.fillRect(0, 0, viewW, viewH);
    drawInspect(ctx, town);
  }
}

function bubbleAnchorFallback(_town: Town, _id: string): number {
  return 0;
}

function shimmerWater(ctx: CanvasRenderingContext2D, town: Town, camX: number, camY: number) {
  const x0 = Math.max(0, Math.floor(camX / TILE));
  const y0 = Math.max(0, Math.floor(camY / TILE));
  const x1 = Math.min(COLS, Math.ceil((camX + town.viewW) / TILE));
  const y1 = Math.min(ROWS, Math.ceil((camY + town.viewH) / TILE));
  const shift = Math.floor(town.time * 3) % 8;
  for (let ty = y0; ty < y1; ty++) {
    for (let tx = x0; tx < x1; tx++) {
      if (cellAt(town.map, tx, ty) !== WATER) continue;
      if (((tx * 5 + ty * 3 + shift) & 7) !== 0) continue;
      rect(ctx, tx * TILE - camX + ((tx * 3) % 10), ty * TILE - camY + 4, 3, 1, "rgba(255,255,255,0.7)");
    }
  }
}

function drawDuck(ctx: CanvasRenderingContext2D, x: number, y: number, camX: number, camY: number) {
  const dx = x - camX;
  const dy = y - camY;
  rect(ctx, dx, dy, 8, 4, "#f0c84a");
  rect(ctx, dx + 6, dy + 1, 3, 2, "#e07a32");
  rect(ctx, dx + 1, dy, 1, 1, INK);
}

function drawGold(ctx: CanvasRenderingContext2D, x: number, y: number, camX: number, camY: number, time: number) {
  const dx = x - camX;
  const dy = y - camY;
  const c = Math.sin(time * 5) > 0 ? "#ffe56a" : "#f0c84a";
  rect(ctx, dx, dy, 1, 10, "#6aaa40");
  rect(ctx, dx - 1, dy, 3, 3, c);
}

function drawInterior(ctx: CanvasRenderingContext2D, town: Town) {
  const room = town.room!;
  const theme = TIER_THEME[room];
  const ox = Math.floor((town.viewW - INT_W) / 2);
  const oy = Math.floor((town.viewH - INT_H) / 2);
  rect(ctx, 0, 0, town.viewW, town.viewH, "#102016");
  ctx.save();
  ctx.translate(ox, oy);
  rect(ctx, 0, 0, INT_W, INT_H, theme.wall);
  for (let y = 52; y < INT_H; y += 8) {
    rect(ctx, 0, y, INT_W, 8, y % 16 === 4 ? theme.floor : theme.floor2);
  }
  rect(ctx, 0, 0, INT_W, 50, theme.wall);
  rect(ctx, 0, 48, INT_W, 4, theme.trim);
  pane(ctx, 24, 14, 36, 26, true, "#f4f4f8", "#f3c7a2", town.time, 0.2);
  pane(ctx, INT_W - 60, 14, 36, 26, true, "#3a2418", "#e0aa78", town.time, 1.3);
  const sign = TIERS.find((t) => t.id === room)!.sign;
  const sw = textWidth(sign) + 16;
  rect(ctx, (INT_W - sw) / 2, 16, sw, 14, theme.trim);
  drawText(ctx, sign, (INT_W - sw) / 2 + 8, 20, CREAM, 1);
  rect(ctx, 118, 150, 64, 28, theme.rug);
  rect(ctx, 140, 118, 28, 16, "#c47a3a");
  rect(ctx, 136, 114, 36, 6, "#d09050");
  rect(ctx, 132, INT_H - 16, 36, 10, "#3aaa68");
  drawText(ctx, "EXIT", 136, INT_H - 14, CREAM, 1);

  const inside = town.npcs.filter((n) => n.home === room);
  const sprites: { y: number; draw: () => void }[] = [];
  inside.forEach((n, i) => {
    const ax = n.x;
    const ay = n.y;
    sprites.push({
      y: ay,
      draw: () => drawActor(ctx, { ...n, x: ax, y: ay }, town.time, town.showNames),
    });
    void i;
  });
  sprites.push({
    y: town.player.y,
    draw: () => drawActor(ctx, town.player, town.time, false),
  });
  sprites.sort((a, b) => a.y - b.y);
  for (const s of sprites) s.draw();

  if (town.showBubbles) {
    for (const bubble of town.bubbles) {
      const anchor = bubble.anchor === "you" ? town.player : inside.find((n) => n.id === bubble.anchor);
      if (!anchor) continue;
      drawBubble(ctx, anchor.x, anchor.y, bubble.name, bubble.meta, bubble.text, -ox, -oy, town.viewW);
    }
  }
  ctx.restore();

  const tier = TIERS.find((t) => t.id === room)!;
  const foot = `${tier.label} room  ·  what happens here stays here`;
  if (textWidth(foot) < town.viewW - 8) {
    drawText(ctx, foot, 8, 8, "#f7f4ec", 1);
  }
}

export function resetGroundCache() {
  groundCache = null;
}
