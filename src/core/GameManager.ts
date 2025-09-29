import { AceOfShadows } from "../games/AceOfShadows";
import { MagicWords } from "../games/MagicWords";
import { PhoenixFlame } from "../games/PhoenixFlame";
import { FPSDisplay } from "../ui/FPSDisplay";
import { Application, Container, Assets } from "pixi.js";
import { MainMenu } from "../scenes/MainMenu";
import { Loading } from "../scenes/Loading";

const GameToClassMap = {
  ACE_OF_SHADOWS: AceOfShadows,
  MAGIC_WORDS: MagicWords,
  PHOENIX_FLAME: PhoenixFlame,
} as const;

type GameType = keyof typeof GameToClassMap;

export class GameManager {
  private app: Application;
  private currentScene: Container | null = null;
  private fpsDisplay!: FPSDisplay;
  private sceneContainer!: Container;
  private loadingScene: Loading | null = null;

  constructor(app: Application) {
    this.app = app;

    // Start loading process
    this.startLoading();
  }

  private startLoading(): void {
    // Create and show loading scene
    this.loadingScene = new Loading();
    this.app.stage.addChild(this.loadingScene);

    // Start preloading assets with progress tracking
    this.preloadAssets();
  }

  private async preloadAssets(): Promise<void> {
    try {
      // Define all assets to load
      const assets = [
        // Main Menu
        "assets/hyperspace.mp4",
        "assets/softgames_logo.png",
        // Ace of Shadows
        "assets/yu-gi-oh_small.png",
        "assets/duel_disk.png",
        "assets/street.png",
        // Magic Words
        "assets/neighbourhood.jpg",
        "assets/unknown.png",
        //"assets/dialogue/magicwords.json", This fails to load
        // Add more assets here as needed
      ];

      // Load assets with progress tracking
      await Assets.load(assets, (progress) => {
        if (this.loadingScene) {
          this.loadingScene.updateProgress(progress);
        }
      });

      console.log("Assets preloaded successfully");

      // Remove loading scene and start main menu
      this.finishLoading();
    } catch (error) {
      console.error("Failed to preload assets:", error);
      // Still finish loading even if some assets fail
      this.finishLoading();
    }
  }

  private finishLoading(): void {
    // Remove loading scene
    if (this.loadingScene) {
      this.app.stage.removeChild(this.loadingScene);
      this.loadingScene.destroy();
      this.loadingScene = null;
    }

    // Create scene container - this will hold all game scenes
    this.sceneContainer = new Container();
    this.app.stage.addChild(this.sceneContainer);

    // Add FPS tracker on top of everything
    this.fpsDisplay = new FPSDisplay(this.app);
    this.app.stage.addChild(this.fpsDisplay);

    // Event listeners
    this.setEventListeners();

    // Start main menu
    this.startMainMenu();
  }

  private setEventListeners(): void {
    // Handle window resize
    window.addEventListener("resize", () => {
      this.onResize();
    });

    // Prevent context menu on right click
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private clearCurrentScene(): void {
    if (this.currentScene) {
      this.sceneContainer.removeChild(this.currentScene);
      this.currentScene.destroy();
      this.currentScene = null;
    }
  }

  public startMainMenu(): void {
    this.clearCurrentScene();
    this.currentScene = new MainMenu(this);
    this.sceneContainer.addChild(this.currentScene);
  }

  public startGame(gameToStart: GameType): void {
    this.clearCurrentScene();
    this.currentScene = new GameToClassMap[gameToStart](this);
    this.sceneContainer.addChild(this.currentScene);
  }

  public backToMainMenu(): void {
    this.startMainMenu();
  }

  public onResize(): void {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    if (this.currentScene && "onResize" in this.currentScene) {
      (this.currentScene as any).onResize();
    }
  }

  public getApp(): Application {
    return this.app;
  }
}
