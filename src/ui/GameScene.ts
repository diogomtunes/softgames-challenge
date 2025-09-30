import { Container, Application } from 'pixi.js';
import { GameManager } from '../core/GameManager';
import { Button } from './Button';
import { Game } from '../core/Game';
import { scaled } from '../core/Utils';

/**
 * Base scene container that provides common UI elements and game management for all game scenes.
 *
 * Handles game scene creation, resizing, and destruction.
 *
 * @extends Container
 */
export class GameScene extends Container {
	// UI Constants
	private readonly BUTTON_WIDTH = 120;
	private readonly BUTTON_HEIGHT = 80;
	private readonly BUTTON_COLOR = 0xffd700; // Golden
	private readonly BUTTON_MARGIN = 1;
	private readonly BUTTON_BORDER_RADIUS = 8;
	private readonly BUTTON_FONT_SIZE = 48;
	private readonly BUTTON_X_OFFSET_FACTOR = 0.4;
	private readonly BUTTON_Y_OFFSET_FACTOR = 0.8;

	// UI Elements
	private backButton!: Button;
	protected backgroundContainer!: Container;
	protected foregroundContainer!: Container;

	// Core
	protected gameManager: GameManager;
	protected app: Application;
	protected game!: Game;

	constructor(
		gameManager: GameManager,
		GameClass: new (
			app: Application,
			backgroundContainer: Container,
			foregroundContainer: Container
		) => Game
	) {
		super();
		this.gameManager = gameManager;
		this.app = gameManager.getApp();
		this.buildUI();
		this.createGame(GameClass);
	}

	private buildUI(): void {
		// Background container
		this.backgroundContainer = new Container();
		this.addChild(this.backgroundContainer);

		// Foreground container
		this.foregroundContainer = new Container();
		this.addChild(this.foregroundContainer);

		// Back button
		this.backButton = new Button({
			emoji: '🏠',
			color: this.BUTTON_COLOR,
			width: this.BUTTON_WIDTH,
			height: this.BUTTON_HEIGHT,
			margin: this.BUTTON_MARGIN,
			borderRadius: this.BUTTON_BORDER_RADIUS,
			fontSize: this.BUTTON_FONT_SIZE,
			onClick: () => this.gameManager.backToMainMenu(),
		});
		this.addChild(this.backButton);
		this.onResize();
	}

	/**
	 * Creates a new game instance and initializes it by calling its methods in order
	 *
	 * @param GameClass - The class of the game to create
	 */
	private createGame(
		GameClass: new (
			app: Application,
			backgroundContainer: Container,
			foregroundContainer: Container
		) => Game
	): void {
		this.game = new GameClass(
			this.app,
			this.backgroundContainer,
			this.foregroundContainer
		);
		this.game.initialize();
		this.game.buildBackground();
		this.game.buildForeground();
		this.game.onResize();
		this.game.addEventListeners?.();
		this.game.start();
	}

	public onResize(): void {
		const screenWidth = this.app.screen.width;
		const scaledButtonHeight = scaled(this.BUTTON_HEIGHT);

		// Always position back button in top right corner
		this.backButton.onResize();
		this.backButton.x =
			screenWidth -
			scaled(this.BUTTON_WIDTH * this.BUTTON_X_OFFSET_FACTOR);
		this.backButton.y =
			0 + scaledButtonHeight * this.BUTTON_Y_OFFSET_FACTOR;

		// Call game's onResize method
		this.game?.onResize();
	}

	/**
	 * Removes the game instance from the ticker, as well as its event listeners, and then calls
	 * the game's destroy method, before destroying itself
	 *
	 */
	public destroy(): void {
		if (this.game) {
			this.app.ticker.remove(this.game.update, this);
			this.game.removeEventListeners?.();
			this.game.destroy();
		}
		this.backgroundContainer.destroy();
		this.foregroundContainer.destroy();
		this.backButton.destroy();
		super.destroy();
	}
}
