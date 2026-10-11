// lib/phaser/AssetLoader.ts
// Programmatically generates all pixel-art sprites & tiles as canvas textures.
// This avoids needing external image files for the MVP.

import Phaser from "phaser";

/** Palette */
export const PALETTE = {
  // Terrain
  grassLight: 0x6abf5e,
  grassDark: 0x5a9e50,
  grassEdge: 0x4a8e40,
  sand: 0xd4b896,
  sandDark: 0xb89870,
  water: 0x4a90d9,
  waterLight: 0x6aafff,
  path: 0xc8a878,

  // Buildings
  wallBeige: 0xf0e0b0,
  wallGray: 0xa0a0b0,
  roofRed: 0xd03020,
  roofBlue: 0x2060d0,
  roofGreen: 0x30a050,
  roofTeal: 0x30c0b0,
  windowYellow: 0xffe060,
  windowBlue: 0x60a0ff,
  doorBrown: 0x804010,
  doorWood: 0xa06020,

  // UI / misc
  outline: 0x222222,
  white: 0xffffff,
  black: 0x000000,
  transparent: 0x000000,
} as const;

const TILE = 32; // Base tile size

/**
 * Generate all game textures programmatically using Phaser's Graphics API.
 * Call once inside Phaser's `preload` scene.
 */
export function generateTextures(scene: Phaser.Scene): void {
  generateTiles(scene);
  generateCharacters(scene);
  generatePets(scene);
  generateBuildings(scene);
  generateUI(scene);
}

// ─── Tiles ───────────────────────────────────────────────────────────────────

function generateTiles(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Grass tile
  g.fillStyle(PALETTE.grassLight);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(PALETTE.grassDark);
  // Add some pixel texture detail
  for (let y = 4; y < TILE; y += 8) {
    for (let x = (y % 16 === 4 ? 0 : 4); x < TILE; x += 8) {
      g.fillRect(x, y, 2, 2);
    }
  }
  g.generateTexture("tile_grass", TILE, TILE);
  g.clear();

  // Grass dark variant
  g.fillStyle(PALETTE.grassDark);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(PALETTE.grassEdge);
  for (let y = 4; y < TILE; y += 10) {
    for (let x = (y % 20 === 4 ? 0 : 5); x < TILE; x += 10) {
      g.fillRect(x, y, 2, 2);
    }
  }
  g.generateTexture("tile_grass_dark", TILE, TILE);
  g.clear();

  // Sand/path tile
  g.fillStyle(PALETTE.sand);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(PALETTE.sandDark);
  for (let y = 6; y < TILE; y += 10) {
    for (let x = (y % 20 === 6 ? 0 : 5); x < TILE; x += 12) {
      g.fillRect(x, y, 3, 1);
    }
  }
  g.generateTexture("tile_sand", TILE, TILE);
  g.clear();

  // Water tile (animated: multiple frames)
  for (let frame = 0; frame < 4; frame++) {
    g.fillStyle(PALETTE.water);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(PALETTE.waterLight);
    const offset = frame * 4;
    for (let y = 4; y < TILE; y += 8) {
      g.fillRect((offset + y * 2) % TILE, y, 8, 2);
    }
    g.generateTexture(`tile_water_${frame}`, TILE, TILE);
    g.clear();
  }

  // Flower tile
  g.fillStyle(PALETTE.grassLight);
  g.fillRect(0, 0, TILE, TILE);
  // Red flowers
  [[4, 8], [16, 20], [24, 6], [10, 26]].forEach(([x, y]) => {
    g.fillStyle(0xff4444);
    g.fillRect(x, y, 4, 4);
    g.fillStyle(0xffff44);
    g.fillRect(x + 1, y + 1, 2, 2);
  });
  // White flowers
  [[20, 14], [8, 22], [28, 24]].forEach(([x, y]) => {
    g.fillStyle(0xffffff);
    g.fillRect(x, y, 4, 4);
    g.fillStyle(0xffff44);
    g.fillRect(x + 1, y + 1, 2, 2);
  });
  g.generateTexture("tile_flowers", TILE, TILE);
  g.clear();

  // Bush
  g.fillStyle(PALETTE.grassLight);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0x2a6020);
  g.fillCircle(TILE / 2, TILE / 2 + 4, 12);
  g.fillStyle(0x3a8030);
  g.fillCircle(TILE / 2 - 6, TILE / 2, 8);
  g.fillCircle(TILE / 2 + 6, TILE / 2, 8);
  g.fillStyle(0x50a040);
  g.fillCircle(TILE / 2, TILE / 2 - 4, 7);
  g.generateTexture("tile_bush", TILE, TILE);
  g.clear();

  // Tree
  g.fillStyle(PALETTE.grassLight);
  g.fillRect(0, 0, TILE * 2, TILE * 2);
  // Trunk
  g.fillStyle(0x603010);
  g.fillRect(TILE - 4, TILE + 10, 8, 16);
  // Canopy layers
  g.fillStyle(0x1a5010);
  g.fillCircle(TILE, TILE, 24);
  g.fillStyle(0x2a7020);
  g.fillCircle(TILE - 8, TILE - 8, 16);
  g.fillCircle(TILE + 8, TILE - 8, 16);
  g.fillStyle(0x40a030);
  g.fillCircle(TILE, TILE - 12, 14);
  g.generateTexture("tile_tree", TILE * 2, TILE * 2);
  g.clear();

  // Bench
  g.fillStyle(PALETTE.grassLight);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0x8b6914);
  g.fillRect(4, 14, 24, 4);  // seat
  g.fillRect(4, 18, 4, 8);   // left leg
  g.fillRect(24, 18, 4, 8);  // right leg
  g.fillRect(4, 10, 24, 3);  // back
  g.generateTexture("tile_bench", TILE, TILE);
  g.clear();

  // Lamp post
  g.fillStyle(PALETTE.grassLight);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0x404040);
  g.fillRect(14, 12, 4, 18); // pole
  g.fillRect(10, 10, 12, 6); // lamp housing
  g.fillStyle(0xffee44);
  g.fillRect(11, 11, 10, 4); // lamp light
  g.generateTexture("tile_lamp", TILE, TILE);
  g.clear();

  // Fountain base (2x2 tile)
  g.fillStyle(PALETTE.grassLight);
  g.fillRect(0, 0, TILE * 2, TILE * 2);
  g.fillStyle(0x808090);
  g.fillCircle(TILE, TILE, TILE - 4);
  g.fillStyle(PALETTE.water);
  g.fillCircle(TILE, TILE, TILE - 8);
  g.fillStyle(PALETTE.waterLight);
  g.fillCircle(TILE, TILE, 8);
  g.fillStyle(0x808090);
  g.fillRect(TILE - 3, TILE - 16, 6, 20); // center column
  g.fillRect(TILE - 8, TILE - 20, 16, 6); // top basin
  g.generateTexture("tile_fountain", TILE * 2, TILE * 2);
  g.clear();

  // Lock overlay (for tier-gated zones)
  g.fillStyle(0x000000, 0.6);
  g.fillRect(0, 0, TILE, TILE);
  // Padlock icon
  g.fillStyle(0xffa500);
  g.fillRect(10, 14, 12, 10);
  g.lineStyle(3, 0xffa500);
  g.strokeCircle(16, 14, 6);
  g.generateTexture("tile_locked", TILE, TILE);
  g.clear();

  g.destroy();
}

// ─── Characters ──────────────────────────────────────────────────────────────

function generateCharacters(scene: Phaser.Scene): void {
  const CHAR_W = 32;
  const CHAR_H = 48;
  const FRAMES = 3; // frames per direction
  const DIRS = 4;   // down, left, right, up
  const SHEET_W = CHAR_W * FRAMES;
  const SHEET_H = CHAR_H * DIRS;

  const skinColors = [0xffcc99, 0xffaa77, 0xcc8855, 0x99663c, 0x663322];
  const hairColors = [0x4a2c0a, 0xc8a832, 0xe04020, 0x1040c0, 0x20a0c0];
  const shirtColors = [0xff6633, 0x3366ff, 0x33cc66, 0xcc33cc, 0xffcc00];

  skinColors.forEach((skin, si) => {
    shirtColors.forEach((shirt, oi) => {
      hairColors.forEach((hair, hi) => {
        const key = `char_${si}_${oi}_${hi}`;
        const g = scene.make.graphics({ x: 0, y: 0, add: false });

        DIRS.toString(); // appease linter
        for (let dir = 0; dir < DIRS; dir++) {
          for (let frame = 0; frame < FRAMES; frame++) {
            const bx = frame * CHAR_W;
            const by = dir * CHAR_H;
            const walkOffset = frame === 1 ? 0 : frame === 0 ? -2 : 2;

            // Shadow
            g.fillStyle(0x000000, 0.2);
            g.fillEllipse(bx + 16, by + 46, 20, 4);

            // Body / shirt
            g.fillStyle(shirt);
            g.fillRect(bx + 8, by + 22, 16, 14);

            // Pants
            g.fillStyle(0x334466);
            g.fillRect(bx + 8, by + 34, 7, 10);
            g.fillRect(bx + 17, by + 34, 7, 10);

            // Shoes
            g.fillStyle(0x222222);
            g.fillRect(bx + 7, by + 42, 8, 4);
            g.fillRect(bx + 17, by + 42, 8, 4);

            // Arms (walk animation)
            g.fillStyle(skin);
            g.fillRect(bx + 4, by + 22 + walkOffset, 4, 10);
            g.fillRect(bx + 24, by + 22 - walkOffset, 4, 10);

            // Head
            g.fillStyle(skin);
            g.fillRect(bx + 8, by + 8, 16, 14);

            // Hair
            g.fillStyle(hair);
            g.fillRect(bx + 8, by + 6, 16, 6); // top
            if (dir !== 0) { // not facing down
              g.fillRect(bx + 6, by + 8, 3, 10); // side
              g.fillRect(bx + 23, by + 8, 3, 10);
            }

            // Eyes (based on direction)
            g.fillStyle(0x222222);
            if (dir === 0) { // down
              g.fillRect(bx + 11, by + 17, 3, 3);
              g.fillRect(bx + 18, by + 17, 3, 3);
            } else if (dir === 3) { // up (back of head — no eyes)
              // nothing
            } else { // left/right
              g.fillRect(bx + (dir === 1 ? 10 : 19), by + 17, 3, 3);
            }

            // Mouth
            if (dir === 0) {
              g.fillStyle(0xcc6644);
              g.fillRect(bx + 13, by + 19, 6, 2);
            }
          }
        }

        g.generateTexture(key, SHEET_W, SHEET_H);
        g.destroy();
      });
    });
  });

  // Create animations for the default character
  createCharacterAnimations(scene, "char_0_0_0");
}

export function createCharacterAnimations(
  scene: Phaser.Scene,
  key: string
): void {
  const FRAMES = 3;
  const dirs = ["down", "left", "right", "up"];
  dirs.forEach((dir, dirIdx) => {
    const animKey = `${key}_walk_${dir}`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: Array.from({ length: FRAMES }, (_, i) => ({
          key,
          frame: dirIdx * FRAMES + i,
        })),
        frameRate: 8,
        repeat: -1,
      });
    }

    const idleKey = `${key}_idle_${dir}`;
    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: [{ key, frame: dirIdx * FRAMES + 1 }],
        frameRate: 1,
        repeat: -1,
      });
    }
  });
}

// ─── Pets ─────────────────────────────────────────────────────────────────────

function generatePets(scene: Phaser.Scene): void {
  const pets = {
    plant: drawPlantPet,
    robot: drawRobotPet,
    rocket: drawRocketPet,
    crown: drawCrownPet,
  };

  Object.entries(pets).forEach(([name, drawFn]) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const W = 24;
    const FRAMES = 2;

    for (let f = 0; f < FRAMES; f++) {
      drawFn(g, f * W, 0, W, f);
    }

    g.generateTexture(`pet_${name}`, W * FRAMES, W);

    // Bounce animation
    scene.anims.create({
      key: `pet_${name}_bounce`,
      frames: Array.from({ length: FRAMES }, (_, i) => ({
        key: `pet_${name}`,
        frame: i,
      })),
      frameRate: 4,
      repeat: -1,
    });

    g.destroy();
  });
}

function drawPlantPet(
  g: Phaser.GameObjects.Graphics,
  bx: number,
  by: number,
  _W: number,
  frame: number
): void {
  // Pot
  g.fillStyle(0xc06030);
  g.fillRect(bx + 7, by + 14, 10, 8);
  // Soil
  g.fillStyle(0x603010);
  g.fillRect(bx + 7, by + 14, 10, 3);
  // Stem
  g.fillStyle(0x30a020);
  g.fillRect(bx + 11, by + 6, 2, 8);
  // Leaves
  g.fillStyle(0x40c030);
  g.fillRect(bx + 6, by + 8 + (frame === 0 ? 0 : -1), 5, 4);
  g.fillRect(bx + 13, by + 10 + (frame === 0 ? 0 : -1), 5, 4);
  // Flower
  g.fillStyle(0xff6090);
  g.fillRect(bx + 9, by + 2 + (frame === 0 ? 0 : -1), 6, 6);
  g.fillStyle(0xffff40);
  g.fillRect(bx + 11, by + 4 + (frame === 0 ? 0 : -1), 2, 2);
}

function drawRobotPet(
  g: Phaser.GameObjects.Graphics,
  bx: number,
  by: number,
  _W: number,
  frame: number
): void {
  const yo = frame === 0 ? 0 : -1;
  // Body
  g.fillStyle(0x8090c0);
  g.fillRect(bx + 6, by + 10 + yo, 12, 10);
  // Head
  g.fillStyle(0xa0b0d0);
  g.fillRect(bx + 7, by + 2 + yo, 10, 9);
  // Eyes (blink on frame 1)
  g.fillStyle(0x00ffcc);
  g.fillRect(bx + 9, by + 4 + yo, 3, frame === 0 ? 3 : 1);
  g.fillRect(bx + 14, by + 4 + yo, 3, frame === 0 ? 3 : 1);
  // Antenna
  g.fillStyle(0xd0d0d0);
  g.fillRect(bx + 11, by + yo, 2, 3);
  g.fillStyle(0xff3030);
  g.fillRect(bx + 10, by - 2 + yo, 4, 3);
  // Legs
  g.fillStyle(0x607090);
  g.fillRect(bx + 7, by + 19 + yo, 4, 4);
  g.fillRect(bx + 13, by + 19 + yo, 4, 4);
}

function drawRocketPet(
  g: Phaser.GameObjects.Graphics,
  bx: number,
  by: number,
  _W: number,
  frame: number
): void {
  const yo = frame === 0 ? 0 : -2;
  // Flame
  g.fillStyle(frame === 0 ? 0xff6600 : 0xffcc00);
  g.fillRect(bx + 9, by + 20 + yo, 6, 4);
  // Body
  g.fillStyle(0xd0d0e0);
  g.fillRect(bx + 8, by + 8 + yo, 8, 14);
  // Nose cone
  g.fillStyle(0xff4444);
  g.fillRect(bx + 9, by + 2 + yo, 6, 8);
  g.fillRect(bx + 10, by + yo, 4, 4);
  g.fillRect(bx + 11, by - 2 + yo, 2, 3);
  // Window
  g.fillStyle(0x60c0ff);
  g.fillRect(bx + 10, by + 12 + yo, 4, 4);
  // Fins
  g.fillStyle(0xff4444);
  g.fillRect(bx + 5, by + 18 + yo, 3, 4);
  g.fillRect(bx + 16, by + 18 + yo, 3, 4);
}

function drawCrownPet(
  g: Phaser.GameObjects.Graphics,
  bx: number,
  by: number,
  _W: number,
  frame: number
): void {
  const yo = frame === 0 ? 0 : -1;
  // Body (diamond shape)
  g.fillStyle(0x60c0ff);
  g.fillRect(bx + 8, by + 10 + yo, 8, 8);
  g.fillRect(bx + 6, by + 12 + yo, 12, 4);
  // Crown
  g.fillStyle(0xffd700);
  g.fillRect(bx + 7, by + 4 + yo, 10, 8);
  g.fillRect(bx + 7, by + 2 + yo, 2, 4);
  g.fillRect(bx + 11, by + yo, 2, 5);
  g.fillRect(bx + 15, by + 2 + yo, 2, 4);
  // Gems
  g.fillStyle(0xff3030);
  g.fillRect(bx + 11, by + 6 + yo, 2, 2);
  g.fillStyle(0xffffff);
  g.fillRect(bx + 9, by + 7 + yo, 1, 1);
  // Sparkles
  if (frame === 1) {
    g.fillStyle(0xffffff);
    g.fillRect(bx + 3, by + 2 + yo, 2, 2);
    g.fillRect(bx + 19, by + 4 + yo, 2, 2);
  }
}

// ─── Buildings ───────────────────────────────────────────────────────────────

function generateBuildings(scene: Phaser.Scene): void {
  // Starter house (red roof)
  generateStarterHouse(scene);
  // Growth office (blue/teal)
  generateGrowthOffice(scene);
  // Scale HQ (large gray)
  generateScaleHQ(scene);
  // Whale Lounge (gold/luxury)
  generateWhalLounge(scene);
  // Sign post
  generateSign(scene);
}

function generateStarterHouse(scene: Phaser.Scene): void {
  const W = 128, H = 96;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Foundation/base
  g.fillStyle(PALETTE.wallBeige);
  g.fillRect(8, 48, 112, 48);
  // Roof
  g.fillStyle(PALETTE.roofRed);
  g.fillTriangle(0, 52, 64, 4, 128, 52);
  g.fillRect(8, 40, 112, 14);
  // Chimney
  g.fillStyle(0x808080);
  g.fillRect(88, 12, 12, 24);
  g.fillStyle(0x606060);
  g.fillRect(86, 8, 16, 6);
  // Door
  g.fillStyle(PALETTE.doorBrown);
  g.fillRect(46, 64, 20, 28);
  g.fillStyle(PALETTE.doorWood);
  g.fillRect(48, 66, 16, 26);
  g.fillStyle(0xffd700);
  g.fillRect(60, 78, 3, 3);
  // Windows
  [[18, 56], [90, 56]].forEach(([wx, wy]) => {
    g.fillStyle(PALETTE.windowYellow);
    g.fillRect(wx, wy, 24, 20);
    g.fillStyle(0x806010);
    g.fillRect(wx + 10, wy, 4, 20); // cross
    g.fillRect(wx, wy + 8, 24, 4);
  });
  // Window glow
  g.fillStyle(0xffff80, 0.3);
  g.fillRect(18, 56, 24, 20);

  g.generateTexture("building_starter", W, H);
  g.destroy();
}

function generateGrowthOffice(scene: Phaser.Scene): void {
  const W = 160, H = 112;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Base
  g.fillStyle(0xe0e8f0);
  g.fillRect(0, 32, 160, 80);
  // Roof (flat with teal stripe)
  g.fillStyle(PALETTE.roofTeal);
  g.fillRect(0, 24, 160, 16);
  // Sign board
  g.fillStyle(0x204060);
  g.fillRect(20, 8, 120, 20);
  g.fillStyle(0xffffff);
  g.fillRect(24, 12, 112, 12);
  // Storefront
  g.fillStyle(PALETTE.windowBlue);
  g.fillRect(10, 48, 60, 40);
  g.fillRect(90, 48, 60, 40);
  // Awning
  g.fillStyle(0x30a0c0);
  g.fillRect(8, 45, 64, 6);
  g.fillRect(88, 45, 64, 6);
  // Door
  g.fillStyle(PALETTE.doorBrown);
  g.fillRect(66, 72, 28, 40);
  g.fillStyle(0xd0d0d0);
  g.fillRect(68, 74, 24, 38);
  g.fillStyle(0x404040);
  g.fillRect(76, 90, 8, 3);
  // Planters
  g.fillStyle(0xc06030);
  g.fillRect(10, 86, 16, 6);
  g.fillRect(134, 86, 16, 6);
  g.fillStyle(0x30a020);
  g.fillRect(10, 80, 16, 6);
  g.fillRect(134, 80, 16, 6);

  g.generateTexture("building_growth", W, H);
  g.destroy();
}

function generateScaleHQ(scene: Phaser.Scene): void {
  const W = 192, H = 160;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Main body
  g.fillStyle(0xd8d8e8);
  g.fillRect(16, 48, 160, 112);
  // Roof
  g.fillStyle(0x3050a0);
  g.fillRect(8, 32, 176, 20);
  // Penthouse
  g.fillStyle(0xc8c8d8);
  g.fillRect(48, 8, 96, 28);
  g.fillStyle(0x2040c0);
  g.fillRect(48, 0, 96, 12);
  // Windows grid
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const wx = 24 + col * 38;
      const wy = 60 + row * 32;
      g.fillStyle(PALETTE.windowBlue);
      g.fillRect(wx, wy, 28, 20);
      g.fillStyle(0x2060a0, 0.4);
      g.fillRect(wx, wy, 14, 10);
      g.fillRect(wx + 14, wy + 10, 14, 10);
    }
  }
  // Entry
  g.fillStyle(0x204080);
  g.fillRect(72, 120, 48, 40);
  g.fillStyle(0x90c0ff);
  g.fillRect(76, 122, 16, 36);
  g.fillRect(100, 122, 16, 36);
  // Logo area
  g.fillStyle(0xffd700);
  g.fillRect(80, 16, 32, 12);

  g.generateTexture("building_scale", W, H);
  g.destroy();
}

function generateWhalLounge(scene: Phaser.Scene): void {
  const W = 224, H = 192;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Main body
  g.fillStyle(0x1a1a2e);
  g.fillRect(0, 64, 224, 128);
  // Gold accents
  g.fillStyle(0xffd700);
  g.fillRect(0, 60, 224, 8);
  g.fillRect(0, 188, 224, 4);
  // Columns
  [24, 72, 128, 176].forEach((cx) => {
    g.fillStyle(0xfff0c0);
    g.fillRect(cx, 80, 16, 100);
    g.fillStyle(0xffd700);
    g.fillRect(cx - 4, 76, 24, 8);
    g.fillRect(cx - 4, 176, 24, 8);
  });
  // Big windows
  [[40, 90], [160, 90]].forEach(([wx, wy]) => {
    g.fillStyle(0x2060c0, 0.8);
    g.fillRect(wx, wy, 48, 64);
    g.fillStyle(0x80c0ff, 0.3);
    g.fillRect(wx, wy, 24, 32);
    g.fillRect(wx + 24, wy + 32, 24, 32);
  });
  // Grand entrance
  g.fillStyle(0xffd700);
  g.fillRect(88, 128, 48, 64);
  g.fillStyle(0x1a1a2e);
  g.fillRect(92, 132, 20, 60);
  g.fillRect(116, 132, 20, 60);
  // Crown motif on top
  g.fillStyle(0xffd700);
  g.fillRect(88, 48, 48, 16);
  g.fillRect(88, 36, 6, 14);
  g.fillRect(103, 28, 8, 22);
  g.fillRect(118, 28, 8, 22);
  g.fillRect(130, 36, 6, 14);
  // Stars
  [30, 80, 140, 190].forEach((sx) => {
    g.fillStyle(0xffffff);
    g.fillRect(sx, 8, 4, 4);
    g.fillRect(sx + 2, 6, 0, 0);
  });

  g.generateTexture("building_whale", W, H);
  g.destroy();
}

function generateSign(scene: Phaser.Scene): void {
  const W = 64, H = 48;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Post
  g.fillStyle(0x806030);
  g.fillRect(28, 24, 8, 24);
  // Sign board
  g.fillStyle(0xd4a050);
  g.fillRect(4, 4, 56, 24);
  g.fillStyle(0x80501c);
  g.lineStyle(2, 0x80501c);
  g.strokeRect(4, 4, 56, 24);

  g.generateTexture("building_sign", W, H);
  g.destroy();
}

// ─── UI Elements ──────────────────────────────────────────────────────────────

function generateUI(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Chat bubble
  g.fillStyle(0xffffff);
  g.fillRoundedRect(0, 0, 160, 48, 8);
  g.fillStyle(0xffffff);
  g.fillTriangle(16, 48, 32, 48, 24, 56);
  g.lineStyle(2, 0xcccccc);
  g.strokeRoundedRect(0, 0, 160, 48, 8);
  g.generateTexture("ui_chat_bubble", 160, 60);
  g.clear();

  // Name tag background
  g.fillStyle(0x000000, 0.7);
  g.fillRoundedRect(0, 0, 120, 20, 4);
  g.generateTexture("ui_nametag", 120, 20);
  g.clear();

  // Proximity indicator (pulsing ring)
  g.lineStyle(3, 0x00ffcc, 0.8);
  g.strokeCircle(40, 40, 36);
  g.generateTexture("ui_proximity_ring", 80, 80);
  g.clear();

  // Zone border (warning strip)
  for (let x = 0; x < 8; x++) {
    g.fillStyle(x % 2 === 0 ? 0xffcc00 : 0x000000);
    g.fillRect(x * 4, 0, 4, 8);
  }
  g.generateTexture("ui_zone_border", 32, 8);
  g.clear();

  g.destroy();
}
