// lib/phaser/scenes/WorldScene.ts
// Main game world: tilemap, player, other players, pets, proximity detection

import * as Phaser from "phaser";
import {
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  MAP_WIDTH_PX,
  MAP_HEIGHT_PX,
  BUILDINGS,
  DECORATIONS,
  ZONES,
  buildTilemapData,
  Tile,
} from "../MapGenerator";
import { createCharacterAnimations } from "../AssetLoader";
import { canAccessZone } from "../../tiers";
import type { Tier } from "@prisma/client";

// Types for multiplayer sync (sent via LiveKit data channel)
export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  isMoving: boolean;
  tier: Tier;
  characterSkin: string;
  characterOutfit: string;
  petType: string;
  avatar?: string;
}

interface LocalPlayer {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  pet: Phaser.GameObjects.Sprite;
  nameTag: Phaser.GameObjects.Text;
  chatBubble?: Phaser.GameObjects.Container;
  chatTimer?: Phaser.Time.TimerEvent;
}

const PROXIMITY_DISTANCE = 80;  // pixels
const VOICE_DISTANCE = 200;     // pixels — max spatial audio range
const MOVE_SPEED = 160;         // pixels per second

export class WorldScene extends Phaser.Scene {
  // Local player data (injected from React)
  private localPlayerData!: PlayerState;

  // Cursors + WASD
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  // Local player
  private localPlayer!: LocalPlayer;
  private lastDirection: "up" | "down" | "left" | "right" = "down";

  // Remote players
  private remotePlayers: Map<string, LocalPlayer & { data: PlayerState }> =
    new Map();

  // Target for click-to-move
  private moveTarget?: { x: number; y: number };

  // Tilemap
  private groundLayer!: Phaser.GameObjects.Group;
  private decorLayer!: Phaser.GameObjects.Group;
  private buildingGroup!: Phaser.GameObjects.Group;

  // Zone overlays (for locked zones)
  private zoneOverlays: Map<string, Phaser.GameObjects.Rectangle> = new Map();

  // Proximity ring
  private proximityRing!: Phaser.GameObjects.Image;
  private nearbyPlayerId?: string;

  // Event callbacks (connected to React)
  public onProximity?: (playerId: string | null) => void;
  public onPositionUpdate?: (x: number, y: number, direction: string) => void;
  public onBuildingEnter?: (buildingId: string) => void;
  public onChatBubble?: (text: string) => void;

  constructor() {
    super({ key: "WorldScene" });
  }

  // Called by React to inject player data before scene starts
  setPlayerData(data: PlayerState): void {
    this.localPlayerData = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#78cb6e");

    // Build the tilemap
    this.buildTilemap();

    // Place buildings
    this.buildBuildings();

    // Place decorations
    this.buildDecorations();

    // Zone locked overlays
    this.buildZoneOverlays();

    // Create local player
    this.createLocalPlayer();

    // Input
    this.setupInput();

    // Camera
    this.cameras.main.startFollow(this.localPlayer.container, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5); // Closer zoom for pixel art clarity
    this.cameras.main.setBounds(0, 0, MAP_WIDTH_PX, MAP_HEIGHT_PX);

    // Proximity ring
    this.proximityRing = this.add
      .image(0, 0, "ui_proximity_ring")
      .setVisible(false)
      .setDepth(10);

    // Minimap (tiny camera in corner)
    // this.createMinimap();
  }

  // ─── Tilemap ───────────────────────────────────────────────────────────────

  private buildTilemap(): void {
    this.groundLayer = this.add.group();
    const tileData = buildTilemapData();

    const tileTextures = [
      "tile_grass",
      "tile_grass_dark",
      "tile_sand",
      "tile_water_0",
      "tile_flowers",
      "tile_bush",
    ];

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileIdx = tileData[row][col];
        const texKey =
          tileIdx === Tile.Water
            ? "tile_water_0"
            : tileTextures[tileIdx] ?? "tile_grass";

        const tile = this.add.image(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          texKey
        );
        tile.setDepth(0);
        this.groundLayer.add(tile);
      }
    }

    // Animate water tiles
    this.time.addEvent({
      delay: 300,
      loop: true,
      callback: this.animateWater,
      callbackScope: this,
      args: [tileData],
    });

    // Click-to-move
    this.input.on("pointerdown", (ptr: Phaser.Input.Pointer) => {
      if (!ptr.rightButtonDown()) {
        this.moveTarget = {
          x: ptr.worldX,
          y: ptr.worldY,
        };
      }
    });
  }

  private waterFrame = 0;
  private animateWater(_tileData: number[][]): void {
    this.waterFrame = (this.waterFrame + 1) % 4;
    // Updating all water tiles dynamically would be expensive;
    // in production use a tilemap + animated tiles instead.
  }

  // ─── Buildings ─────────────────────────────────────────────────────────────

  private buildBuildings(): void {
    this.buildingGroup = this.add.group();

    BUILDINGS.forEach((b) => {
      const px = b.tileX * TILE_SIZE;
      const py = b.tileY * TILE_SIZE;
      const img = this.add.image(px, py, b.texture).setOrigin(0, 1);
      img.setDepth(5);
      this.buildingGroup.add(img);

      // Clickable building entrance
      if (b.buildingId) {
        img.setInteractive({ cursor: "pointer" });
        img.on("pointerdown", () => {
          const dist = Phaser.Math.Distance.Between(
            this.localPlayer.container.x,
            this.localPlayer.container.y,
            px + (b.widthTiles * TILE_SIZE) / 2,
            py - (b.heightTiles * TILE_SIZE) / 2
          );
          if (dist < 120 && b.buildingId) {
            this.onBuildingEnter?.(b.buildingId);
          }
        });
      }

      // Zone label on signs
      if (b.label && b.texture === "building_sign") {
        this.add
          .text(px + 32, py - 16, b.label, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "5px",
            color: "#2d1a00",
          })
          .setOrigin(0.5)
          .setDepth(6);
      }
    });
  }

  // ─── Decorations ───────────────────────────────────────────────────────────

  private buildDecorations(): void {
    this.decorLayer = this.add.group();
    DECORATIONS.forEach((d) => {
      const px = d.tileX * TILE_SIZE;
      const py = d.tileY * TILE_SIZE;
      const img = this.add.image(px, py, d.texture).setOrigin(0, 1);
      img.setDepth(3);
      this.decorLayer.add(img);
    });
  }

  // ─── Zone Overlays ─────────────────────────────────────────────────────────

  private buildZoneOverlays(): void {
    // Overlays are created per zone; toggled based on player tier
    ZONES.forEach((zone) => {
      const overlay = this.add.rectangle(
        zone.x * TILE_SIZE + (zone.w * TILE_SIZE) / 2,
        zone.y * TILE_SIZE + (zone.h * TILE_SIZE) / 2,
        zone.w * TILE_SIZE,
        zone.h * TILE_SIZE,
        0x000000,
        0
      );
      overlay.setDepth(50);
      overlay.setVisible(false);
      this.zoneOverlays.set(zone.tier, overlay);

      // Lock icon text
      const lockText = this.add
        .text(
          zone.x * TILE_SIZE + (zone.w * TILE_SIZE) / 2,
          zone.y * TILE_SIZE + (zone.h * TILE_SIZE) / 2,
          `🔒 ${zone.name}`,
          {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "14px",
            color: "#ffffff",
            backgroundColor: "#00000088",
            padding: { x: 12, y: 8 },
          }
        )
        .setOrigin(0.5)
        .setDepth(51)
        .setVisible(false);

      this.zoneOverlays.set(`${zone.tier}_label`, lockText as unknown as Phaser.GameObjects.Rectangle);
    });
  }

  public updatePlayerTier(tier: Tier): void {
    const tierOrder: Tier[] = ["FREE", "STARTER", "GROWTH", "SCALE"];
    const playerRank = tierOrder.indexOf(tier);

    ZONES.forEach((zone, i) => {
      const zoneRank = i; // zones are ordered same as tiers
      const isLocked = playerRank < zoneRank;
      const overlay = this.zoneOverlays.get(zone.tier);
      const label = this.zoneOverlays.get(`${zone.tier}_label`);
      if (overlay) {
        overlay.setVisible(isLocked);
        overlay.setFillStyle(0x000000, isLocked ? 0.5 : 0);
      }
      if (label) {
        label.setVisible(isLocked);
      }
    });

    if (this.localPlayerData) {
      this.localPlayerData.tier = tier;
    }

    // Auto-evolve companion pet according to tier!
    const tierPets: Record<Tier, string> = {
      FREE: "plant",
      STARTER: "robot",
      GROWTH: "rocket",
      SCALE: "crown",
    };
    const newPet = tierPets[tier];
    if (newPet && this.localPlayer?.pet && this.textures.exists(`pet_${newPet}`)) {
      this.localPlayer.pet.setTexture(`pet_${newPet}`);
      this.localPlayer.pet.play(`pet_${newPet}_bounce`);
    }
  }

  // ─── Local Player ──────────────────────────────────────────────────────────

  private createLocalPlayer(): void {
    const data = this.localPlayerData ?? {
      id: "local",
      name: "You",
      x: 800,
      y: 640,
      tier: "FREE" as Tier,
      characterSkin: "0",
      characterOutfit: "0",
      petType: "plant",
      direction: "down",
      isMoving: false,
    };

    const charKey = `char_${data.characterSkin ?? 0}_${data.characterOutfit ?? 0}_0`;
    // Ensure animations exist for this character
    createCharacterAnimations(this, charKey);

    const sprite = this.add.sprite(0, 0, charKey).setDepth(10);

    const pet = this.add
      .sprite(-16, 8, `pet_${data.petType ?? "plant"}`)
      .setDepth(10);
    pet.play(`pet_${data.petType ?? "plant"}_bounce`);

    const nameTag = this.add
      .text(0, -36, data.name ?? "You", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#ffffff",
        backgroundColor: "#00000099",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(11);

    const container = this.add.container(data.x ?? 800, data.y ?? 640, [
      sprite,
      pet,
      nameTag,
    ]);
    container.setDepth(10);

    sprite.play(`${charKey}_idle_down`);

    this.localPlayer = { container, sprite, pet, nameTag };

    // Update player tier overlays
    if (data.tier) {
      this.updatePlayerTier(data.tier);
    }

    // Listen for customization updates
    if (typeof window !== "undefined") {
      window.addEventListener("trustvoice-customization-updated", ((e: CustomEvent) => {
        if (e.detail) {
          this.updateLocalCustomization(
            e.detail.characterSkin,
            e.detail.characterOutfit,
            e.detail.petType
          );
        }
      }) as EventListener);
    }
  }

  public updateLocalCustomization(skin: string, outfit: string, petType: string): void {
    if (!this.localPlayer) return;
    if (this.localPlayerData) {
      this.localPlayerData.characterSkin = skin;
      this.localPlayerData.characterOutfit = outfit;
      this.localPlayerData.petType = petType;
    }

    const charKey = `char_${skin}_${outfit}_0`;
    createCharacterAnimations(this, charKey);
    this.localPlayer.sprite.setTexture(charKey);
    this.localPlayer.sprite.play(`${charKey}_idle_${this.lastDirection}`);

    if (this.textures.exists(`pet_${petType}`)) {
      this.localPlayer.pet.setTexture(`pet_${petType}`);
      this.localPlayer.pet.play(`pet_${petType}_bounce`);
    }
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Space → talk to nearby player
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on(
      "down",
      () => {
        if (this.nearbyPlayerId) {
          this.onProximity?.(this.nearbyPlayerId);
        }
      }
    );
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  private positionUpdateTimer = 0;
  private readonly POSITION_UPDATE_INTERVAL = 50; // ms

  update(time: number, delta: number): void {
    this.handleMovement(delta);
    this.checkProximity();
    this.updateProximityRing();

    // Throttle position broadcasts
    this.positionUpdateTimer += delta;
    if (this.positionUpdateTimer >= this.POSITION_UPDATE_INTERVAL) {
      this.positionUpdateTimer = 0;
      const c = this.localPlayer.container;
      this.onPositionUpdate?.(c.x, c.y, this.lastDirection);
    }
  }

  private handleMovement(delta: number): void {
    const speed = (MOVE_SPEED * delta) / 1000;
    let vx = 0;
    let vy = 0;

    const left =
      this.cursors.left.isDown ||
      this.wasd.left.isDown;
    const right =
      this.cursors.right.isDown ||
      this.wasd.right.isDown;
    const up =
      this.cursors.up.isDown ||
      this.wasd.up.isDown;
    const down =
      this.cursors.down.isDown ||
      this.wasd.down.isDown;

    if (left) { vx = -speed; this.lastDirection = "left"; }
    if (right) { vx = speed;  this.lastDirection = "right"; }
    if (up)    { vy = -speed; this.lastDirection = "up"; }
    if (down)  { vy = speed;  this.lastDirection = "down"; }

    const isMovingKeyboard = left || right || up || down;

    // Click-to-move
    if (!isMovingKeyboard && this.moveTarget) {
      const c = this.localPlayer.container;
      const dx = this.moveTarget.x - c.x;
      const dy = this.moveTarget.y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 4) {
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;

        // Update direction for click-to-move
        if (Math.abs(dx) > Math.abs(dy)) {
          this.lastDirection = dx > 0 ? "right" : "left";
        } else {
          this.lastDirection = dy > 0 ? "down" : "up";
        }
      } else {
        this.moveTarget = undefined;
      }
    }

    const isMoving = vx !== 0 || vy !== 0;

    const c = this.localPlayer.container;
    const newX = Phaser.Math.Clamp(c.x + vx, 16, MAP_WIDTH_PX - 16);
    const newY = Phaser.Math.Clamp(c.y + vy, 16, MAP_HEIGHT_PX - 16);
    c.setPosition(newX, newY);

    // Animations
    const charKey = `char_${this.localPlayerData?.characterSkin ?? 0}_${this.localPlayerData?.characterOutfit ?? 0}_0`;
    if (isMoving) {
      const animKey = `${charKey}_walk_${this.lastDirection}`;
      if (this.localPlayer.sprite.anims.currentAnim?.key !== animKey) {
        this.localPlayer.sprite.play(animKey, true);
      }
    } else {
      const idleKey = `${charKey}_idle_${this.lastDirection}`;
      if (this.localPlayer.sprite.anims.currentAnim?.key !== idleKey) {
        this.localPlayer.sprite.play(idleKey, true);
      }
    }

    // Pet follows with slight lag
    this.localPlayer.pet.x = Phaser.Math.Linear(
      this.localPlayer.pet.x,
      -16 - Math.sign(vx) * 8,
      0.15
    );
  }

  // ─── Proximity Detection ───────────────────────────────────────────────────

  private checkProximity(): void {
    const lx = this.localPlayer.container.x;
    const ly = this.localPlayer.container.y;
    let closestId: string | undefined;
    let closestDist = PROXIMITY_DISTANCE;

    this.remotePlayers.forEach((rp, id) => {
      const dist = Phaser.Math.Distance.Between(
        lx, ly, rp.container.x, rp.container.y
      );

      if (dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    });

    if (closestId !== this.nearbyPlayerId) {
      this.nearbyPlayerId = closestId;
      this.onProximity?.(closestId ?? null);
    }
  }

  private updateProximityRing(): void {
    if (this.nearbyPlayerId) {
      this.proximityRing.setVisible(true);
      this.proximityRing.setPosition(
        this.localPlayer.container.x,
        this.localPlayer.container.y
      );
      // Pulse effect
      const scale = 1 + Math.sin(this.time.now * 0.004) * 0.1;
      this.proximityRing.setScale(scale);
    } else {
      this.proximityRing.setVisible(false);
    }
  }

  // ─── Remote Players ────────────────────────────────────────────────────────

  public addOrUpdateRemotePlayer(data: PlayerState): void {
    if (this.remotePlayers.has(data.id)) {
      // Update existing
      const rp = this.remotePlayers.get(data.id)!;
      rp.data = data;

      // Smooth interpolation
      const c = rp.container;
      c.x = Phaser.Math.Linear(c.x, data.x, 0.2);
      c.y = Phaser.Math.Linear(c.y, data.y, 0.2);

      // Animation
      const charKey = `char_0_0_0`; // simplified — use full key in production
      const animKey = data.isMoving
        ? `${charKey}_walk_${data.direction}`
        : `${charKey}_idle_${data.direction}`;
      if (rp.sprite.anims.currentAnim?.key !== animKey) {
        rp.sprite.play(animKey, true);
      }
    } else {
      // Create new remote player
      this.createRemotePlayer(data);
    }
  }

  private createRemotePlayer(data: PlayerState): void {
    const charKey = "char_0_0_0"; // simplified
    if (!this.anims.exists(`${charKey}_idle_down`)) {
      createCharacterAnimations(this, charKey);
    }

    const sprite = this.add.sprite(0, 0, charKey).setDepth(10);
    sprite.play(`${charKey}_idle_down`);

    const pet = this.add
      .sprite(-16, 8, `pet_${data.petType ?? "plant"}`)
      .setDepth(10);
    pet.play(`pet_${data.petType ?? "plant"}_bounce`);

    // Revenue badge
    const badge = this.add
      .text(0, -50, `${this.getTierEmoji(data.tier)} ${data.name}`, {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#ffffff",
        backgroundColor: "#00000099",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(11);

    const nameTag = badge;

    const container = this.add.container(data.x, data.y, [
      sprite,
      pet,
      nameTag,
    ]);
    container.setDepth(10);

    // Clickable for profile card
    sprite.setInteractive();
    sprite.on("pointerdown", () => {
      this.game.events.emit("player-click", data);
    });
    sprite.on("pointerover", () => {
      sprite.setTint(0xccddff);
    });
    sprite.on("pointerout", () => {
      sprite.clearTint();
    });

    this.remotePlayers.set(data.id, {
      container,
      sprite,
      pet,
      nameTag,
      data,
    });
  }

  public removeRemotePlayer(id: string): void {
    const rp = this.remotePlayers.get(id);
    if (rp) {
      rp.container.destroy();
      this.remotePlayers.delete(id);
    }
  }

  public showChatBubble(playerId: string, text: string): void {
    const isLocal = playerId === this.localPlayerData?.id;
    const player = isLocal
      ? this.localPlayer
      : this.remotePlayers.get(playerId);

    if (!player) return;

    // Clear old bubble
    if (player.chatBubble) {
      player.chatBubble.destroy();
      player.chatTimer?.destroy();
    }

    const playerName = isLocal ? (this.localPlayerData?.name || "Marc Lou") : (player as any).data?.name || "Founder";
    const playerTier = isLocal ? (this.localPlayerData?.tier || "SCALE") : (player as any).data?.tier || "FREE";
    const tierRevText = playerTier === "SCALE" ? "$205K/mo 💎" : playerTier === "GROWTH" ? "$15K/mo 🚀" : playerTier === "STARTER" ? "$3.2K/mo 🤖" : "$400/mo 🌱";

    // Header label: e.g. "Marc Lou $205K/mo 💎"
    const headerText = this.add
      .text(0, -90, `${playerName} ${tierRevText}`, {
        fontFamily: "monospace",
        fontSize: "8px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    // Body speech text
    const bodyText = this.add
      .text(0, -76, text, {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#ffffff",
        wordWrap: { width: 140 },
        maxLines: 4,
        align: "center",
      })
      .setOrigin(0.5);

    const bgWidth = Math.max(headerText.width, bodyText.width) + 16;
    const bgHeight = headerText.height + bodyText.height + 14;
    const bgY = -83;

    // Dark sleek bubble background matching Marc Lou's screenshot
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x161a24, 0.95);
    bgGraphics.lineStyle(1.5, 0x3d4758, 0.9);
    bgGraphics.fillRoundedRect(-bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 6);
    bgGraphics.strokeRoundedRect(-bgWidth / 2, bgY - bgHeight / 2, bgWidth, bgHeight, 6);

    // Downward speech indicator arrow
    bgGraphics.fillStyle(0x161a24, 0.95);
    bgGraphics.fillTriangle(-5, bgY + bgHeight / 2, 5, bgY + bgHeight / 2, 0, bgY + bgHeight / 2 + 5);

    const bubbleContainer = this.add.container(0, 0, [bgGraphics, headerText, bodyText]);
    bubbleContainer.setDepth(50);
    player.container.add(bubbleContainer);
    player.chatBubble = bubbleContainer;

    player.chatTimer = this.time.delayedCall(5000, () => {
      bubbleContainer.destroy();
      player.chatBubble = undefined;
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  public getPlayerPosition(): { x: number; y: number } {
    return {
      x: this.localPlayer.container.x,
      y: this.localPlayer.container.y,
    };
  }

  public getSpatialVolume(remotePlayerId: string): number {
    const rp = this.remotePlayers.get(remotePlayerId);
    if (!rp) return 0;
    const dist = Phaser.Math.Distance.Between(
      this.localPlayer.container.x,
      this.localPlayer.container.y,
      rp.container.x,
      rp.container.y
    );
    if (dist >= VOICE_DISTANCE) return 0;
    return Math.pow(1 - dist / VOICE_DISTANCE, 2);
  }

  private getTierEmoji(tier: Tier): string {
    const emojis: Record<Tier, string> = {
      FREE: "🌱",
      STARTER: "🤖",
      GROWTH: "🚀",
      SCALE: "👑",
    };
    return emojis[tier] ?? "🌱";
  }

  // Touch controls (called externally by React touch buttons)
  public startMove(dir: "up" | "down" | "left" | "right"): void {
    if (!this.input.keyboard) return;
    const keys = { up: this.wasd.up, down: this.wasd.down, left: this.wasd.left, right: this.wasd.right };
    // Simulate key hold — we'd need a different approach for production
    // but for now emit internal events
    this.game.events.emit("touch-move", dir);
  }

  public stopMove(): void {
    this.game.events.emit("touch-stop");
  }
}
