import type { Building, Egg, Prop, WorldMap } from "./types";
import { COLS, ROWS, TILE } from "./types";

const GRASS = 0;
const PATH = 1;
const WATER = 2;
const WHEAT = 3;

function idx(x: number, y: number): number {
  return y * COLS + x;
}

function inb(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS;
}

function fill(cells: Uint8Array, x: number, y: number, w: number, h: number, v: number) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (inb(xx, yy)) cells[idx(xx, yy)] = v;
    }
  }
}

function solidRect(solid: Uint8Array, x: number, y: number, w: number, h: number, door: { x: number; y: number } | null) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (!inb(xx, yy)) continue;
      if (door && xx === door.x && yy === door.y) continue;
      solid[idx(xx, yy)] = 1;
    }
  }
}

export function buildMap(): WorldMap {
  const cells = new Uint8Array(COLS * ROWS);
  const solid = new Uint8Array(COLS * ROWS);
  cells.fill(GRASS);

  fill(cells, 18, 1, 14, 6, WATER);
  fill(cells, 34, 0, 6, 8, WHEAT);
  fill(cells, 36, 16, 6, 6, WHEAT);
  fill(solid, 18, 1, 14, 6, 1);
  fill(solid, 34, 0, 6, 8, 1);
  fill(solid, 36, 16, 6, 6, 1);

  fill(cells, 0, 13, 52, 3, PATH);
  fill(cells, 12, 6, 3, 16, PATH);
  fill(cells, 8, 11, 18, 8, PATH);
  fill(cells, 42, 13, 10, 3, PATH);
  fill(cells, 8, 16, 4, 6, PATH);
  fill(cells, 44, 10, 3, 4, PATH);

  const buildings: Building[] = [
    { id: "house", kind: "house", tier: null, tx: 1, ty: 1, tw: 7, th: 5, door: "s" },
    { id: "gazebo", kind: "gazebo", tier: "sprout", tx: 16, ty: 7, tw: 5, th: 4, door: "s" },
    { id: "cottage", kind: "cottage", tier: "tree", tx: 1, ty: 7, tw: 8, th: 6, door: "s" },
    { id: "office", kind: "office", tier: "rocket", tx: 24, ty: 7, tw: 10, th: 6, door: "s" },
    { id: "shop", kind: "shop", tier: "seed", tx: 23, ty: 16, tw: 9, th: 5, door: "n" },
    { id: "diamond", kind: "diamond", tier: "diamond", tx: 42, ty: 7, tw: 10, th: 6, door: "s" },
    { id: "crown", kind: "crown", tier: "crown", tx: 4, ty: 22, tw: 12, th: 7, door: "n" },
  ];

  for (const b of buildings) {
    const door =
      b.door === "s"
        ? { x: b.tx + Math.floor(b.tw / 2), y: b.ty + b.th - 1 }
        : { x: b.tx + Math.floor(b.tw / 2), y: b.ty };
    solidRect(solid, b.tx, b.ty, b.tw, b.th, b.kind === "gazebo" ? null : door);
    if (b.kind === "gazebo") {
      for (const [cx, cy] of [
        [b.tx, b.ty],
        [b.tx + b.tw - 1, b.ty],
        [b.tx, b.ty + b.th - 1],
        [b.tx + b.tw - 1, b.ty + b.th - 1],
      ]) {
        if (inb(cx, cy)) solid[idx(cx, cy)] = 1;
      }
    } else {
      cells[idx(door.x, door.y)] = PATH;
      solid[idx(door.x, door.y)] = 0;
      const fy = b.door === "s" ? door.y + 1 : door.y - 1;
      if (inb(door.x, fy)) {
        cells[idx(door.x, fy)] = PATH;
        solid[idx(door.x, fy)] = 0;
      }
    }
  }

  const props: Prop[] = [
    { kind: "billboard", x: 10 * TILE + 8, y: 4 * TILE, variant: 0 },
    { kind: "blimp", x: 4 * TILE, y: 6 * TILE + 6, variant: 0 },
    { kind: "fountain", x: 15 * TILE, y: 12 * TILE + 10, variant: 0 },
    { kind: "bench", x: 33 * TILE, y: 12 * TILE, variant: 0 },
    { kind: "bench", x: 21 * TILE, y: 18 * TILE + 8, variant: 1 },
    { kind: "lamp", x: 10 * TILE, y: 14 * TILE, variant: 0 },
    { kind: "lamp", x: 22 * TILE, y: 15 * TILE, variant: 1 },
    { kind: "lamp", x: 34 * TILE, y: 15 * TILE, variant: 0 },
    { kind: "lamp", x: 8 * TILE, y: 18 * TILE, variant: 1 },
    { kind: "lamp", x: 46 * TILE, y: 14 * TILE, variant: 0 },
    { kind: "tree", x: 12 * TILE, y: 3 * TILE, variant: 0 },
    { kind: "tree", x: 33 * TILE, y: 10 * TILE, variant: 1 },
    { kind: "tree", x: 20 * TILE, y: 20 * TILE, variant: 0 },
    { kind: "bush", x: 17 * TILE, y: 1 * TILE, variant: 0 },
    { kind: "bush", x: 31 * TILE, y: 2 * TILE, variant: 1 },
    { kind: "bush", x: 18 * TILE, y: 6 * TILE, variant: 2 },
    { kind: "bush", x: 30 * TILE, y: 6 * TILE, variant: 0 },
    { kind: "bush", x: 9 * TILE, y: 10 * TILE, variant: 1 },
    { kind: "bush", x: 36 * TILE, y: 12 * TILE, variant: 2 },
    { kind: "bush", x: 2 * TILE, y: 18 * TILE, variant: 0 },
    { kind: "bush", x: 48 * TILE, y: 18 * TILE, variant: 1 },
    { kind: "bush", x: 18 * TILE, y: 24 * TILE, variant: 2 },
    { kind: "tree", x: 24 * TILE, y: 26 * TILE, variant: 1 },
    { kind: "lamp", x: 16 * TILE, y: 21 * TILE, variant: 0 },
  ];

  for (const p of props) {
    if (p.kind === "blimp" || p.kind === "bench") continue;
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    if (p.kind === "fountain") {
      solidRect(solid, tx - 1, ty - 1, 2, 2, null);
    } else if (inb(tx, ty) && cells[idx(tx, ty)] !== PATH) {
      solid[idx(tx, ty)] = 1;
    } else if (inb(tx, ty) && (p.kind === "tree" || p.kind === "lamp" || p.kind === "billboard")) {
      solid[idx(tx, ty)] = 1;
    }
  }

  const flowers: { x: number; y: number; hue: number }[] = [];
  const beds = [
    [2, 17, 7, 3],
    [17, 2, 3, 2],
    [31, 3, 2, 2],
    [38, 14, 3, 2],
    [1, 20, 3, 2],
  ];
  let n = 0;
  for (const [x, y, w, h] of beds) {
    for (let yy = y; yy < y + h!; yy++) {
      for (let xx = x; xx < x + w!; xx++) {
        if (!inb(xx, yy) || cells[idx(xx, yy)] !== GRASS) continue;
        flowers.push({
          x: xx * TILE + 3 + ((n * 3) % 8),
          y: yy * TILE + 4 + ((n * 5) % 7),
          hue: n % 3,
        });
        if (n % 2 === 0) {
          flowers.push({
            x: xx * TILE + 9,
            y: yy * TILE + 10,
            hue: (n + 1) % 3,
          });
        }
        n++;
      }
    }
  }

  const eggs: Egg[] = [
    {
      id: "blimp",
      x: 4 * TILE + 10,
      y: 6 * TILE + 10,
      r: 28,
      auto: false,
      line: "The airship only lifts for founders who already shipped.",
    },
    {
      id: "fountain",
      x: 15 * TILE,
      y: 14 * TILE + 4,
      r: 22,
      auto: false,
      line: "You tossed a coin. It does not count as MRR.",
    },
    {
      id: "duck",
      x: 30 * TILE + 6,
      y: 7 * TILE + 4,
      r: 20,
      auto: true,
      line: "A rubber duck in the reeds. Senior engineer energy.",
    },
    {
      id: "wheat",
      x: 34 * TILE - 2,
      y: 4 * TILE + 6,
      r: 22,
      auto: false,
      line: "One golden stalk. Imaginary ARR +$1.",
    },
    {
      id: "plaque",
      x: 4 * TILE + 8,
      y: 6 * TILE,
      r: 16,
      auto: false,
      line: "Plaque: what happens in these rooms stays in these rooms.",
    },
  ];

  return {
    cells,
    solid,
    buildings,
    props,
    flowers,
    eggs,
    spawn: { x: 16 * TILE + 8, y: 15 * TILE + 8 },
  };
}

export function tileSolid(map: WorldMap, tx: number, ty: number): boolean {
  if (!inb(tx, ty)) return true;
  return map.solid[idx(tx, ty)] === 1;
}

export function cellAt(map: WorldMap, tx: number, ty: number): number {
  if (!inb(tx, ty)) return GRASS;
  return map.cells[idx(tx, ty)]!;
}

export function blockedPixel(map: WorldMap, x: number, y: number): boolean {
  const points: [number, number][] = [
    [x - 5, y - 2],
    [x + 4, y - 2],
    [x - 5, y + 3],
    [x + 4, y + 3],
  ];
  for (const [px, py] of points) {
    if (tileSolid(map, Math.floor(px / TILE), Math.floor(py / TILE))) return true;
  }
  return false;
}

function nearestOpen(map: WorldMap, gx: number, gy: number): { x: number; y: number } | null {
  if (!tileSolid(map, gx, gy)) return { x: gx, y: gy };
  for (let r = 1; r <= 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = gx + dx;
        const y = gy + dy;
        if (!tileSolid(map, x, y)) return { x, y };
      }
    }
  }
  return null;
}

export function findPath(
  map: WorldMap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { x: number; y: number }[] | null {
  const sx = Math.floor(x0 / TILE);
  const sy = Math.floor(y0 / TILE);
  const goal = nearestOpen(map, Math.floor(x1 / TILE), Math.floor(y1 / TILE));
  if (!goal) return null;
  const gx = goal.x;
  const gy = goal.y;
  if (sx === gx && sy === gy) return [{ x: (gx + 0.5) * TILE, y: (gy + 0.75) * TILE }];

  const key = (x: number, y: number) => y * COLS + x;
  const open: { x: number; y: number; f: number }[] = [{ x: sx, y: sy, f: 0 }];
  const came = new Map<number, number>();
  const gScore = new Map<number, number>([[key(sx, sy), 0]]);
  const closed = new Set<number>();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  let guard = 0;
  while (open.length && guard++ < 2500) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift()!;
    const ck = key(cur.x, cur.y);
    if (closed.has(ck)) continue;
    if (cur.x === gx && cur.y === gy) {
      const tiles: { x: number; y: number }[] = [];
      let k = ck;
      let cx = cur.x;
      let cy = cur.y;
      tiles.push({ x: cx, y: cy });
      while (came.has(k)) {
        const prev = came.get(k)!;
        cy = Math.floor(prev / COLS);
        cx = prev % COLS;
        k = prev;
        tiles.push({ x: cx, y: cy });
      }
      tiles.reverse();
      return tiles.map((t) => ({ x: (t.x + 0.5) * TILE, y: (t.y + 0.72) * TILE }));
    }
    closed.add(ck);
    const g = gScore.get(ck) ?? 0;
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (tileSolid(map, nx, ny) && !(nx === gx && ny === gy)) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      const ng = g + 1;
      if (ng < (gScore.get(nk) ?? 1e9)) {
        gScore.set(nk, ng);
        came.set(nk, ck);
        const h = Math.abs(nx - gx) + Math.abs(ny - gy);
        open.push({ x: nx, y: ny, f: ng + h });
      }
    }
  }
  return null;
}

export function snapWalkable(map: WorldMap, x: number, y: number): { x: number; y: number } {
  if (!blockedPixel(map, x, y)) return { x, y };
  for (let r = 8; r <= TILE * 6; r += 8) {
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      const px = x + Math.cos(ang) * r;
      const py = y + Math.sin(ang) * r;
      if (!blockedPixel(map, px, py)) return { x: px, y: py };
    }
  }
  return { x: map.spawn.x, y: map.spawn.y };
}

export const INT_W = 300;
export const INT_H = 210;

export function interiorBlocked(x: number, y: number): boolean {
  if (x < 22 || x > INT_W - 22) return true;
  if (y < 58) return true;
  if (y > INT_H - 14) {
    if (x > 124 && x < 176) return false;
    return true;
  }
  if (x > 132 && x < 176 && y > 108 && y < 136) return true;
  return false;
}

export { GRASS, PATH, WATER, WHEAT };
