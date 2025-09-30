import { Container, Application } from 'pixi.js';

/**
 * Abstract base class that defines the interface for all games.
 *
 * @method initialize - Makes any necessary initial loadings and setups
 * @method buildBackground - Build the background layer of the game's UI
 * @method buildForeground - Build the foreground layer of the game's UI
 * @method onResize - All UI scaling logic should go here
 * @optional addEventListeners - Add event listeners to the game, if any
 * @optional removeEventListeners - Remove event listeners from the game, if any. Automatically called on destroy
 * @method start - Start the game update cycle
 * @method update - Update the game
 * @method destroy - Called by the game scene when destroying the scene
 */
export abstract class Game {
	// Core
	protected app: Application;
	protected backgroundContainer: Container;
	protected foregroundContainer: Container;

	constructor(
		app: Application,
		backgroundContainer: Container,
		foregroundContainer: Container
	) {
		this.app = app;
		this.backgroundContainer = backgroundContainer;
		this.foregroundContainer = foregroundContainer;
	}

	// These methods are by order of the game's lifecycle
	public abstract initialize(): void;
	public abstract buildBackground(): void;
	public abstract buildForeground(): void;
	public abstract onResize(): void;
	public addEventListeners?(): void;
	public abstract start(): void;
	public abstract update(deltaTime: number): void;
	public removeEventListeners?(): void;
	public abstract destroy(): void;
}
