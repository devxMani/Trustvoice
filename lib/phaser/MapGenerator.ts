// lib/phaser/MapGenerator.ts
// Generates the full TrustVoice world tilemap layout procedurally.

export const MAP_COLS = 100;
export const MAP_ROWS = 80;
export const TILE_SIZE = 32;

export const MAP_WIDTH_PX = MAP_COLS * TILE_SIZE;   // 3200px
export const MAP_HEIGHT_PX = MAP_ROWS * TILE_SIZE;  // 2560px

// Tile indices
export enum Tile {
  Grass = 0,
  GrassDark = 1,
  Sand = 2,
  Water = 3,
  Flowers = 4,
  Bush = 5,
  Blank = 255,
}

export interface ZoneRect {
  name: string;
  tier: string;
  x: number;  // tile X
  y: number;  // tile Y
  w: number;  // tile width
  h: number;  // tile height
  color: number;
}

export const ZONES: ZoneRect[] = [
  { name: "Starter Village",  tier: "FREE",    x: 0,  y: 0,  w: 50, h: 40, color: 0x6abf5e },
  { name: "Growth Park",      tier: "STARTER", x: 50, y: 0,  w: 50, h: 40, color: 0x10b981 },
  { name: "Scale District",   tier: "GROWTH",  x: 0,  y: 40, w: 50, h: 40, color: 0x3b82f6 },
  { name: "Whale Lounge",     tier: "SCALE",   x: 50, y: 40, w: 50, h: 40, color: 0xf59e0b },
];

export interface BuildingDef {
  texture: string;
  tileX: number;
  tileY: number;
  widthTiles: number;
  heightTiles: number;
  zone: string;
  label?: string;
  isBuildingEntrance?: boolean;
  buildingId?: string;
}

export const BUILDINGS: BuildingDef[] = [
  // ─ Starter Village ─
  { texture: "building_starter", tileX: 4,  tileY: 4,  widthTiles: 4, heightTiles: 3, zone: "Starter Village", label: "HQ", buildingId: "starter_hq" },
  { texture: "building_starter", tileX: 14, tileY: 6,  widthTiles: 4, heightTiles: 3, zone: "Starter Village", label: "Cowork", buildingId: "starter_cowork" },
  { texture: "building_starter", tileX: 4,  tileY: 18, widthTiles: 4, heightTiles: 3, zone: "Starter Village", label: "Office", buildingId: "starter_office" },
  { texture: "building_sign",    tileX: 10, tileY: 4,  widthTiles: 2, heightTiles: 1, zone: "Starter Village", label: "$0–$1K" },
  { texture: "building_sign",    tileX: 20, tileY: 14, widthTiles: 2, heightTiles: 1, zone: "Starter Village" },

  // ─ Growth Park ─
  { texture: "building_growth", tileX: 55, tileY: 4,  widthTiles: 5, heightTiles: 3, zone: "Growth Park", label: "Hub", buildingId: "growth_hub" },
  { texture: "building_growth", tileX: 68, tileY: 10, widthTiles: 5, heightTiles: 3, zone: "Growth Park", label: "Studio", buildingId: "growth_studio" },
  { texture: "building_sign",   tileX: 62, tileY: 4,  widthTiles: 2, heightTiles: 1, zone: "Growth Park", label: "$1K–$5K" },

  // ─ Scale District ─
  { texture: "building_scale", tileX: 5,  tileY: 46, widthTiles: 6, heightTiles: 5, zone: "Scale District", label: "Tower", buildingId: "scale_tower" },
  { texture: "building_scale", tileX: 20, tileY: 50, widthTiles: 6, heightTiles: 5, zone: "Scale District", label: "Labs", buildingId: "scale_labs" },
  { texture: "building_sign",  tileX: 13, tileY: 46, widthTiles: 2, heightTiles: 1, zone: "Scale District", label: "$5K–$20K" },

  // ─ Whale Lounge ─
  { texture: "building_whale", tileX: 55, tileY: 45, widthTiles: 7, heightTiles: 6, zone: "Whale Lounge", label: "Palace", buildingId: "whale_palace" },
  { texture: "building_sign",  tileX: 64, tileY: 45, widthTiles: 2, heightTiles: 1, zone: "Whale Lounge", label: "$20K+" },
];

export interface DecorationDef {
  texture: string;
  tileX: number;
  tileY: number;
  animated?: boolean;
  animKey?: string;
}

export const DECORATIONS: DecorationDef[] = [
  // Starter Village decorations
  { texture: "tile_fountain", tileX: 22, tileY: 10 },
  { texture: "tile_tree",     tileX: 8,  tileY: 12 },
  { texture: "tile_tree",     tileX: 30, tileY: 5  },
  { texture: "tile_bench",    tileX: 18, tileY: 22 },
  { texture: "tile_lamp",     tileX: 24, tileY: 8  },
  { texture: "tile_lamp",     tileX: 24, tileY: 18 },

  // Growth Park
  { texture: "tile_tree",    tileX: 60, tileY: 20 },
  { texture: "tile_tree",    tileX: 72, tileY: 8  },
  { texture: "tile_bench",   tileX: 62, tileY: 22 },
  { texture: "tile_lamp",    tileX: 65, tileY: 15 },
  { texture: "tile_fountain", tileX: 78, tileY: 20 },

  // Scale District
  { texture: "tile_tree",  tileX: 10, tileY: 58 },
  { texture: "tile_tree",  tileX: 35, tileY: 62 },
  { texture: "tile_lamp",  tileX: 14, tileY: 62 },
  { texture: "tile_bench", tileX: 28, tileY: 60 },

  // Whale Lounge
  { texture: "tile_tree",     tileX: 58, tileY: 65 },
  { texture: "tile_tree",     tileX: 88, tileY: 58 },
  { texture: "tile_lamp",     tileX: 62, tileY: 68 },
  { texture: "tile_fountain", tileX: 82, tileY: 62 },
];

/**
 * Build the base tilemap data (a 2D array of tile indices).
 */
export function buildTilemapData(): number[][] {
  const data: number[][] = Array.from({ length: MAP_ROWS }, () =>
    new Array(MAP_COLS).fill(Tile.Grass)
  );

  // Add sand paths
  addPaths(data);

  // Add water features
  addWater(data);

  // Add flower patches
  addFlowerPatches(data);

  return data;
}

function addPaths(data: number[][]): void {
  // Main horizontal road (center)
  for (let x = 0; x < MAP_COLS; x++) {
    data[19][x] = Tile.Sand;
    data[20][x] = Tile.Sand;
    data[21][x] = Tile.Sand;
    data[39][x] = Tile.Sand;
    data[40][x] = Tile.Sand;
    data[41][x] = Tile.Sand;
    data[59][x] = Tile.Sand;
    data[60][x] = Tile.Sand;
    data[61][x] = Tile.Sand;
  }
  // Main vertical road (center)
  for (let y = 0; y < MAP_ROWS; y++) {
    data[y][24] = Tile.Sand;
    data[y][25] = Tile.Sand;
    data[y][26] = Tile.Sand;
    data[y][49] = Tile.Sand;
    data[y][50] = Tile.Sand;
    data[y][51] = Tile.Sand;
    data[y][74] = Tile.Sand;
    data[y][75] = Tile.Sand;
    data[y][76] = Tile.Sand;
  }

  // Zone dividers (subtle)
  for (let x = 0; x < MAP_COLS; x++) {
    for (let d = 0; d < 1; d++) {
      data[40 + d][x] = Tile.Sand;
    }
  }
  for (let y = 0; y < MAP_ROWS; y++) {
    data[y][50] = Tile.Sand;
  }
}

function addWater(data: number[][]): void {
  // Small ponds in each zone
  const ponds = [
    [30, 28, 4, 3], // Starter
    [80, 5,  4, 3], // Growth
    [30, 65, 4, 3], // Scale
    [85, 60, 4, 3], // Whale
  ];
  ponds.forEach(([tx, ty, tw, th]) => {
    for (let y = ty; y < ty + th; y++) {
      for (let x = tx; x < tx + tw; x++) {
        if (y >= 0 && y < MAP_ROWS && x >= 0 && x < MAP_COLS) {
          data[y][x] = Tile.Water;
        }
      }
    }
  });
}

function addFlowerPatches(data: number[][]): void {
  const patches = [
    [6,  22, 6, 5],  // Starter garden
    [55, 22, 5, 5],  // Growth garden
    [6,  58, 6, 5],  // Scale garden
    [68, 65, 5, 5],  // Whale garden
  ];
  patches.forEach(([tx, ty, tw, th]) => {
    for (let y = ty; y < ty + th; y++) {
      for (let x = tx; x < tx + tw; x++) {
        if (y >= 0 && y < MAP_ROWS && x >= 0 && x < MAP_COLS) {
          data[y][x] = Tile.Flowers;
        }
      }
    }
  });
}
