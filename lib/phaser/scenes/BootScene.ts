// lib/phaser/scenes/BootScene.ts
// First scene: generates all assets, shows loading screen

import * as Phaser from "phaser";
import { generateTextures } from "../AssetLoader";

export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private progress = 0;

  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Background
    this.cameras.main.setBackgroundColor("#1a2035");

    // Loading text
    this.loadingText = this.add
      .text(cx, cy - 40, "🎮 TrustVoice", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "20px",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    const subText = this.add
      .text(cx, cy - 10, "Loading world...", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    // Loading bar background
    this.add.rectangle(cx, cy + 30, 300, 16, 0x333355);

    // Progress bar
    this.loadingBar = this.add.graphics();

    this.load.on("progress", (value: number) => {
      this.progress = value;
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x4a90d9);
      this.loadingBar.fillRect(cx - 148, cy + 22, 296 * value, 12);
    });

    this.load.on("complete", () => {
      subText.setText("Generating world...");
    });

    // Generate programmatic assets
    this.load.on("complete", () => {
      generateTextures(this);
    });
  }

  create(): void {
    // Small delay for the generation to complete
    this.time.delayedCall(200, () => {
      this.scene.start("WorldScene");
    });
  }
}
