import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { scaled } from '../core/Utils';

/**
 * Animated loading bar component with progress text.
 *
 * @extends Container
 */
export class LoadingBar extends Container {
	// UI Constants
	private readonly FILL_COLOR = 0x00ff00; // Green
	private readonly BACKGROUND_COLOR = 0x333333; // Dark grey
	private readonly BORDER_COLOR = 0xffffff; // White
	private readonly TEXT_COLOR = 0xffffff; // White
	private readonly STROKE_COLOR = 0x000000; // Black
	private readonly BORDER_THICKNESS = 2;
	private readonly FILL_MARGIN = 4;
	private readonly FONT_SIZE = 16;
	private readonly TEXT_STROKE_THICKNESS = 2;

	// UI Elements
	private background!: Graphics;
	private fill!: Graphics;
	private progressText!: Text;

	// Properties
	private originalWidth: number;
	private originalHeight: number;
	private progress: number = 0;
	private boundOnResize: () => void;

	constructor(width: number = 300, height: number = 20) {
		super();

		this.originalWidth = width;
		this.originalHeight = height;
		this.boundOnResize = this.onResize.bind(this);

		this.setupLoadingBar();
		this.onResize();
		window.addEventListener('resize', this.boundOnResize);
	}

	private setupLoadingBar(): void {
		const barWidth = scaled(this.originalWidth);
		const barHeight = scaled(this.originalHeight);

		// Position at screen center
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		this.x = (screenWidth - barWidth) * 0.5;
		this.y = (screenHeight - barHeight) * 0.5;

		// Background
		this.background = new Graphics();
		this.addChild(this.background);

		// Progress fill
		this.fill = new Graphics();
		this.addChild(this.fill);

		// Text
		this.progressText = new Text(
			'0%',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fill: this.TEXT_COLOR,
				align: 'center',
				fontWeight: 'bold',
				stroke: this.STROKE_COLOR,
			})
		);
		this.progressText.anchor.set(0.5, 0.5);
		this.addChild(this.progressText);
	}

	private updateFill(): void {
		// Get scaled dimensions
		const barWidth = scaled(this.originalWidth);
		const barHeight = scaled(this.originalHeight);

		// Fill bar according to progress
		const fillWidth = barWidth * this.progress;
		const fillMargin = scaled(this.FILL_MARGIN);
		this.fill.clear();
		this.fill.beginFill(this.FILL_COLOR);
		this.fill.drawRoundedRect(
			fillMargin,
			fillMargin,
			fillWidth - fillMargin * 2,
			barHeight - fillMargin * 2,
			barHeight * 0.5 - fillMargin
		);
		this.fill.endFill();
	}

	public updateProgress(progress: number): void {
		const clampedProgress = Math.max(0, Math.min(1, progress));
		this.progress = clampedProgress;

		// Update text
		const percentage = Math.round(clampedProgress * 100);
		this.progressText.text = `${percentage}%`;

		this.updateFill();
	}

	public onResize(): void {
		// Get scaled dimensions
		const barWidth = scaled(this.originalWidth);
		const barHeight = scaled(this.originalHeight);

		// Maintain center positioning
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		this.x = (screenWidth - barWidth) * 0.5;
		this.y = (screenHeight - barHeight) * 0.5;

		// Background
		this.background.clear();
		this.background.lineStyle(
			scaled(this.BORDER_THICKNESS),
			this.BORDER_COLOR
		);
		this.background.beginFill(this.BACKGROUND_COLOR);
		this.background.drawRoundedRect(
			0,
			0,
			barWidth,
			barHeight,
			barHeight * 0.5
		);
		this.background.endFill();

		// Fill
		this.updateFill();

		// Text
		this.progressText.style.fontSize = scaled(this.FONT_SIZE);
		this.progressText.style.strokeThickness = scaled(
			this.TEXT_STROKE_THICKNESS
		);
		this.progressText.x = barWidth * 0.5;
		this.progressText.y = barHeight * 0.5;
	}

	public destroy(): void {
		window.removeEventListener('resize', this.boundOnResize);
		super.destroy();
	}
}
