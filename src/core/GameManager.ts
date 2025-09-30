import { AceOfShadows } from '../games/AceOfShadows';
import { MagicWords } from '../games/MagicWords';
import { PhoenixFlame } from '../games/PhoenixFlame';
import { FPSDisplay } from '../ui/FPSDisplay';
import { Application, Container } from 'pixi.js';
import { MainMenu } from '../scenes/MainMenu';
import { LoadingScreen } from '../scenes/LoadingScreen';
import { AssetLoader } from './AssetLoader';
import { GameScene } from '../ui/GameScene';

const GameToClassMap = {
	ACE_OF_SHADOWS: AceOfShadows,
	MAGIC_WORDS: MagicWords,
	PHOENIX_FLAME: PhoenixFlame,
} as const;

type GameType = keyof typeof GameToClassMap;

/**
 * Game manager that triggers initial asset loading, handle scene transitions, and typical application lifecycle.
 *
 * Manages the flow between loading screen, main menu, and game scenes
 *
 * Also handles renderer and scene resize
 */
export class GameManager {
	// Core
	private app: Application;
	private assetLoader: AssetLoader;

	// Scene Management
	private currentScene: GameScene | Container | null = null;
	private sceneContainer!: Container;
	private loadingScene: LoadingScreen = new LoadingScreen();

	// UI Elements
	private fpsDisplay!: FPSDisplay;

	constructor(app: Application) {
		this.app = app;
		this.assetLoader = new AssetLoader(this.loadingScene);

		this.onResize();
		this.setEventListeners();
		this.startLoading();
	}

	private startLoading(): void {
		// Loading scene
		this.app.stage.addChild(this.loadingScene);

		// Trigger asset loading
		this.assetLoader
			.loadAllAssets()
			.then(() => {
				setTimeout(() => {
					this.finishLoading();
				}, 100); // 100ms to ensure the 100% progress is visible
			})
			.catch(error => {
				console.error('Failed to preload assets:', error);
				// Still finish loading even if some assets fail
				setTimeout(() => {
					this.finishLoading();
				}, 100);
			});
	}

	private finishLoading(): void {
		// Remove loading scene
		if (this.loadingScene) {
			this.app.stage.removeChild(this.loadingScene);
			this.loadingScene.destroy();
		}

		// Create scene container to hold all game scenes
		this.sceneContainer = new Container();
		this.app.stage.addChild(this.sceneContainer);

		// Add FPS tracker last so it's always on top
		this.fpsDisplay = new FPSDisplay(this.app);
		this.app.stage.addChild(this.fpsDisplay);

		this.startMainMenu();
	}

	private setEventListeners(): void {
		window.addEventListener('resize', () => {
			this.onResize();
		});
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
		const GameClass = GameToClassMap[gameToStart];
		this.currentScene = new GameScene(this, GameClass);
		this.sceneContainer.addChild(this.currentScene);
	}

	public backToMainMenu(): void {
		this.startMainMenu();
	}

	public onResize(): void {
		this.app.renderer.resize(window.innerWidth, window.innerHeight);
		if (this.currentScene && 'onResize' in this.currentScene) {
			this.currentScene.onResize();
		}
	}

	public getApp(): Application {
		return this.app;
	}
}
