import {
  Container,
  Application,
  Assets,
  Text,
  TextStyle,
  // ParticleContainer,
} from "pixi.js";
import { Emitter } from "@pixi/particle-emitter";
import { GameManager } from "../core/GameManager";
import { Button } from "../ui/Button";

export class PhoenixFlame extends Container {
  private gameManager: GameManager;
  // private particleContainer!: ParticleContainer;
  private particleContainer!: Container;
  private backButton!: Button;
  private title!: Text;
  private particleCountText!: Text;
  private normalEmitter: Emitter | null = null;
  private intenseEmitter: Emitter | null = null;
  private app: Application;
  private boundPointerMove: (event: PointerEvent) => void;
  private boundPointerDown: (event: PointerEvent) => void;
  private boundPointerUp: (event: PointerEvent) => void;

  constructor(gameManager: GameManager) {
    super();
    this.gameManager = gameManager;
    this.app = gameManager.getApp();

    // Bind event handlers
    this.boundPointerMove = (event: PointerEvent) => this.onPointerMove(event);
    this.boundPointerDown = (event: PointerEvent) => this.onPointerDown(event);
    this.boundPointerUp = (event: PointerEvent) => this.onPointerUp(event);

    this.setupUI();
    this.loadParticleTextures();
    window.addEventListener("pointermove", this.boundPointerMove);
    window.addEventListener("pointerdown", this.boundPointerDown);
    window.addEventListener("pointerup", this.boundPointerUp);
  }

  private setupUI(): void {
    // Create particle container with all dynamic properties enabled
    // this.particleContainer = new ParticleContainer(
    //   2000,
    //   {
    //     vertices: true,
    //     position: true,
    //     rotation: true,
    //     uvs: true,
    //     tint: true,
    //     alpha: true,
    //     scale: true,
    //   },
    //   undefined,
    //   true
    // );
    // this.particleContainer.roundPixels = false;

    // Use regular container for particle emitters (better compatibility)
    this.particleContainer = new Container();
    this.addChild(this.particleContainer);

    // Create back button in top right corner
    this.backButton = new Button({
      emoji: "🏠",
      color: 0xffd700, // Golden color
      width: 60,
      height: 40,
      fontSize: 20,
      borderRadius: 8,
      onClick: () => this.gameManager.backToMainMenu(),
    });

    // Position in top right corner
    this.backButton.x = this.app.screen.width - 100;
    this.backButton.y = 60;
    this.addChild(this.backButton);

    // Add title
    this.title = new Text(
      "Hold the left mouse button to intensify the flame",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 24,
        fill: 0xffffff,
        align: "center",
        fontWeight: "bold",
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 2,
      })
    );
    this.title.anchor.set(0.5, 0.5);
    this.title.x = this.app.screen.width / 2;
    this.title.y = this.app.screen.height * 0.2; // 20% from the top
    this.addChild(this.title);

    // Add particle count subtitle
    this.particleCountText = new Text(
      "Particle count: 2000",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 18,
        fill: 0xffffff,
        align: "left",
        fontWeight: "normal",
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowBlur: 2,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 1,
      })
    );
    this.particleCountText.anchor.set(0, 0.5);
    this.particleCountText.x =
      this.app.screen.width / 2 - this.particleCountText.width / 2; // Offset from center to account for left alignment
    this.particleCountText.y = this.app.screen.height * 0.2 + 40; // Below the title
    this.addChild(this.particleCountText);
  }

  private async loadParticleTextures(): Promise<void> {
    try {
      // Load both emitter configurations from JSON files
      const [normalResponse, intenseResponse] = await Promise.all([
        fetch("assets/particles/flame.json"),
        fetch("assets/particles/flame_hotter.json"),
      ]);

      const normalConfig = await normalResponse.json();
      const intenseConfig = await intenseResponse.json();

      // Update positions for both configurations
      const position = {
        x: this.app.screen.width / 2,
        y: this.app.screen.height - 100,
      };

      normalConfig.pos = position;
      intenseConfig.pos = position;

      // Enforce 10 particle limit as per assignment requirements
      // Note: Only for the normal emitter, not the intense emitter
      normalConfig.maxParticles = 10;

      // Load textures for both configurations
      await this.loadTexturesForConfig(normalConfig);
      await this.loadTexturesForConfig(intenseConfig);

      // Create both emitters in the particle container
      this.normalEmitter = new Emitter(this.particleContainer, normalConfig);
      this.intenseEmitter = new Emitter(this.particleContainer, intenseConfig);

      // Start with normal emitter
      this.normalEmitter.emit = true;
      this.intenseEmitter.emit = false;

      // Update both emitters in the ticker
      this.app.ticker.add(this.updateEmitters, this);
    } catch (error) {
      console.error("Failed to load particle textures or config:", error);
    }
  }

  private async loadTexturesForConfig(config: any): Promise<void> {
    const textureRandomBehavior = config.behaviors.find(
      (b: any) => b.type === "textureRandom"
    );

    if (textureRandomBehavior && textureRandomBehavior.config.textures) {
      const texturePaths = textureRandomBehavior.config.textures;
      const loadedTextures = [];

      // Load each texture specified in the config
      for (const texturePath of texturePaths) {
        const fullPath = `assets/particles/${texturePath}`;
        const texture = await Assets.load(fullPath);
        loadedTextures.push(texture);
      }

      // Replace the string paths with loaded PIXI Texture objects
      textureRandomBehavior.config.textures = loadedTextures;
    }
  }

  private updateEmitters(): void {
    if (this.normalEmitter) {
      this.normalEmitter.update(this.app.ticker.deltaMS * 0.001);
    }
    if (this.intenseEmitter) {
      this.intenseEmitter.update(this.app.ticker.deltaMS * 0.001);
    }

    // Update particle count display
    this.updateParticleCount();
  }

  private updateParticleCount(): void {
    let particleCount = 0;

    // Get total particle count from both emitters, regardless of which is emitting
    if (this.normalEmitter) {
      particleCount += this.normalEmitter.particleCount;
    }
    if (this.intenseEmitter) {
      particleCount += this.intenseEmitter.particleCount;
    }

    // Update the display
    this.particleCountText.text = `Particle count: ${particleCount}`;
  }

  private updateEmitterPosition(newX: number, newY: number): void {
    if (this.normalEmitter) {
      this.normalEmitter.updateSpawnPos(newX, newY);
    }
    if (this.intenseEmitter) {
      this.intenseEmitter.updateSpawnPos(newX, newY);
    }
  }

  private onPointerMove(event: PointerEvent): void {
    this.updateEmitterPosition(event.x, event.y);
  }

  private onPointerDown(_event: PointerEvent): void {
    this.intensifyFlame();
  }

  private onPointerUp(_event: PointerEvent): void {
    this.normalizeFlame();
  }

  private intensifyFlame(): void {
    // Switch to intense emitter
    if (this.normalEmitter) {
      this.normalEmitter.emit = false;
    }
    if (this.intenseEmitter) {
      this.intenseEmitter.emit = true;
    }
  }

  private normalizeFlame(): void {
    // Switch back to normal emitter
    if (this.normalEmitter) {
      this.normalEmitter.emit = true;
    }
    if (this.intenseEmitter) {
      this.intenseEmitter.emit = false;
    }
  }

  public onResize(): void {
    // Reposition back button in top right corner
    this.backButton.x = this.app.screen.width - 100;
    this.backButton.y = 60;

    // Reposition title
    this.title.x = this.app.screen.width / 2;
    this.title.y = this.app.screen.height * 0.2; // 20% from the top

    // Reposition particle count text
    this.particleCountText.x = this.app.screen.width / 2 - 100; // Offset from center to account for left alignment
    this.particleCountText.y = this.app.screen.height * 0.2 + 40; // Below the title

    // Update emitter positions
    const position = {
      x: this.app.screen.width / 2,
      y: this.app.screen.height - 100,
    };

    if (this.normalEmitter) {
      this.normalEmitter.updateSpawnPos(position.x, position.y);
    }
    if (this.intenseEmitter) {
      this.intenseEmitter.updateSpawnPos(position.x, position.y);
    }
  }

  public destroy(): void {
    // Clean up emitters and ticker
    this.app.ticker.remove(this.updateEmitters, this);

    // Remove event listeners
    window.removeEventListener("pointermove", this.boundPointerMove);
    window.removeEventListener("pointerdown", this.boundPointerDown);
    window.removeEventListener("pointerup", this.boundPointerUp);

    // Destroy emitters
    if (this.normalEmitter) {
      this.normalEmitter.destroy();
      this.normalEmitter = null;
    }
    if (this.intenseEmitter) {
      this.intenseEmitter.destroy();
      this.intenseEmitter = null;
    }

    super.destroy();
  }
}
