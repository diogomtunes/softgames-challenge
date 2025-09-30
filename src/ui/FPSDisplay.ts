import { Application, Text, Container, Graphics } from 'pixi.js';
import { scaled } from '../core/Utils';

/**
 * UI component that displays the current frames per second (FPS) of the PIXI application.
 *
 * @extends Container
 */
export class FPSDisplay extends Container {
	// UI Constants
	private readonly FPS_WIDTH = 128;
	private readonly FPS_HEIGHT = 32;
	private readonly FPS_BACKGROUND_COLOR = '#cccccc'; // Grey
	private readonly FPS_TEXT_COLOR = 0x000000; // Black
	private readonly FPS_FONT_SIZE = 20;

	// UI Elements
	private fpsText!: Text;
	private background!: Graphics;

	// Core
	private app: Application;

	constructor(app: Application) {
		super();
		this.app = app;
		this.buildUI();
		this.onResize();
		this.app.ticker.add(() =>
			this.update(this.app.ticker.deltaTime, this.app.ticker.FPS)
		);
	}

	private buildUI(): void {
		// Background rectangle
		this.background = new Graphics();
		this.addChild(this.background);

		// Text
		this.fpsText = new Text('FPS: 0', {
			fontFamily: 'Arial, sans-serif',
			fill: this.FPS_TEXT_COLOR,
			fontWeight: 'bold',
		});
		this.fpsText.anchor.set(0.5, 0.5);
		const width = scaled(this.FPS_WIDTH);
		const height = scaled(this.FPS_HEIGHT);
		this.fpsText.x = width * 0.5;
		this.fpsText.y = height * 0.5;
		this.addChild(this.fpsText);
	}

	public onResize(): void {
		// Get scaled dimensions
		const width = scaled(this.FPS_WIDTH);
		const height = scaled(this.FPS_HEIGHT);

		// Background
		this.background.clear();
		this.background.beginFill(this.FPS_BACKGROUND_COLOR, 1);
		this.background.drawRect(0, 0, width, height);
		this.background.endFill();

		// Text
		this.fpsText.style.fontSize = scaled(this.FPS_FONT_SIZE);
		this.fpsText.x = width * 0.5;
		this.fpsText.y = height * 0.5;
	}

	public update(_deltaTime: number, rawFPS: number): void {
		const fps = Math.round(rawFPS);
		this.fpsText.text = `FPS: ${fps}`;
	}
}
