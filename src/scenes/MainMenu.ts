import { Container, Text, TextStyle, Sprite, Assets } from "pixi.js";
import { GameManager } from "../core/GameManager";
import { Button } from "../ui/Button";

export class MainMenu extends Container {
  private gameManager: GameManager;
  private title!: Text;
  private buttons!: Container;
  private app: any;
  private logo!: Sprite;
  private backgroundVideo!: Sprite;

  constructor(gameManager: GameManager) {
    super();
    this.gameManager = gameManager;
    this.app = gameManager.getApp();
    this.setupBackgroundVideo();
    this.setupUI().then(() => {
      this.positionElements();
    });
  }

  private async setupBackgroundVideo(): Promise<void> {
    try {
      // Load the video texture using PixiJS Assets system (cached)
      const videoTexture = await Assets.load("assets/hyperspace.mp4");
      console.log("Video texture loaded", videoTexture);

      // Create video sprite
      this.backgroundVideo = new Sprite(videoTexture);
      this.resizeVideoToFit();

      // Add video as background (behind everything)
      this.addChildAt(this.backgroundVideo, 0);
    } catch (error) {
      console.error("Failed to load background video:", error);
    }
  }

  private resizeVideoToFit(): void {
    if (!this.backgroundVideo) return;

    const videoTexture = this.backgroundVideo.texture;
    const videoAspectRatio = videoTexture.width / videoTexture.height;
    const screenAspectRatio = this.app.screen.width / this.app.screen.height;

    if (videoAspectRatio > screenAspectRatio) {
      // Video is wider than screen - fit to height
      this.backgroundVideo.height = this.app.screen.height;
      this.backgroundVideo.width = this.app.screen.height * videoAspectRatio;
    } else {
      // Video is taller than screen - fit to width
      this.backgroundVideo.width = this.app.screen.width;
      this.backgroundVideo.height = this.app.screen.width / videoAspectRatio;
    }

    // Center the video
    this.backgroundVideo.x =
      (this.app.screen.width - this.backgroundVideo.width) / 2;
    this.backgroundVideo.y =
      (this.app.screen.height - this.backgroundVideo.height) / 2;
  }

  private async setupUI(): Promise<void> {
    const logoTexture = await Assets.load("assets/softgames_logo.png");
    this.logo = new Sprite(logoTexture);
    this.logo.anchor.set(0.5, 0.5);
    this.logo.scale.set(1.25); // Scale down the logo
    this.addChild(this.logo);

    // Create title
    this.title = new Text(
      "Game Developer\nAssignment",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 40,
        fill: 0xffffff,
        align: "center",
        fontWeight: "bold",
        stroke: 0x000000,
        strokeThickness: 4,
      })
    );
    this.title.anchor.set(0.5, 0.5);
    this.addChild(this.title);

    // Create buttons container
    this.buttons = new Container();
    this.addChild(this.buttons);

    // Create game buttons
    const games = [
      {
        name: "Ace of Shadows",
        emoji: "🃏",
        color: 0x2c3e50,
        action: () => this.gameManager.startGame("ACE_OF_SHADOWS"),
      },
      {
        name: "Magic Words",
        emoji: "🗣️",
        color: 0x8e44ad,
        action: () => this.gameManager.startGame("MAGIC_WORDS"),
      },
      {
        name: "Phoenix Flame",
        emoji: "🔥",
        color: 0xe74c3c,
        action: () => this.gameManager.startGame("PHOENIX_FLAME"),
      },
    ];

    games.forEach((game, index) => {
      const button = new Button({
        text: game.name,
        emoji: game.emoji,
        color: game.color,
        onClick: game.action,
      });
      button.y = index * 80;
      this.buttons.addChild(button);
    });

    // Create instruction text
    const instruction = new Text(
      "Select any game to start",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 16,
        fill: 0xcccccc,
        align: "center",
        fontWeight: "bold",
        stroke: 0x000000,
        strokeThickness: 4,
      })
    );
    instruction.anchor.set(0.5, 0.5);
    this.addChild(instruction);

    // Add blinking animation to instruction text
    this.app.ticker.add(() => {
      const time = Date.now() * 0.003;
      instruction.alpha = 0.6 + Math.sin(time) * 0.3;
    });
  }

  private positionElements(): void {
    const screenWidth = this.gameManager.getApp().screen.width;
    const screenHeight = this.gameManager.getApp().screen.height;

    // Position logo
    this.logo.x = screenWidth / 2;
    this.logo.y = screenHeight / 2 - 200;

    // Center title
    this.title.x = screenWidth / 2;
    this.title.y = screenHeight / 2 - 120;

    // Center buttons
    this.buttons.x = screenWidth / 2;
    this.buttons.y = screenHeight / 2 - 20;

    // Position instruction text below buttons
    const instruction = this.children[this.children.length - 1] as Text;
    instruction.x = screenWidth / 2;
    instruction.y = screenHeight / 2 + 220; // Move further down to avoid overlap
  }

  public onResize(): void {
    // Resize background video maintaining aspect ratio
    this.resizeVideoToFit();
    this.positionElements();
  }
}
