import { Container, Text, TextStyle } from 'pixi.js';
import { LoadingBar } from '../ui/LoadingBar';
import { isUsingHeight, scaled } from '../core/Utils';

/**
 * Loading screen scene with text and animated progress bar.
 *
 * @extends Container
 */
export class LoadingScreen extends Container {
	// UI Constants
	private readonly TITLE_FONT_SIZE = 48;
	private readonly SUBTITLE_FONT_SIZE = 24;
	private readonly TITLE_STROKE_THICKNESS = 4;
	private readonly SUBTITLE_STROKE_THICKNESS = 2;
	private readonly TITLE_COLOR = 0xffffff; // White
	private readonly SUBTITLE_COLOR = 0xcccccc; // Light grey
	private readonly STROKE_COLOR = 0x000000; // Black
	private readonly LOADING_BAR_WIDTH = 400;
	private readonly LOADING_BAR_HEIGHT = 60;
	private readonly LOADING_TEXT_MARGIN = 100;
	private readonly SCREEN_CENTER_FACTOR = 0.5;

	// UI Elements
	private loadingBar!: LoadingBar;
	private title!: Text;
	private subtitle!: Text;
	private boundOnResize: () => void;

	constructor() {
		super();

		this.boundOnResize = this.onResize.bind(this);
		this.buildUI();
		this.onResize();
		window.addEventListener('resize', this.boundOnResize);
	}

	private buildUI(): void {
		// Title
		this.title = new Text(
			'Loading...',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fill: this.TITLE_COLOR,
				align: 'center',
				fontWeight: 'bold',
				stroke: this.STROKE_COLOR,
			})
		);
		this.title.anchor.set(
			this.SCREEN_CENTER_FACTOR,
			this.SCREEN_CENTER_FACTOR
		);
		this.addChild(this.title);

		// Loading bar
		this.loadingBar = new LoadingBar(
			this.LOADING_BAR_WIDTH,
			this.LOADING_BAR_HEIGHT
		);
		this.addChild(this.loadingBar);

		// Subtitle
		this.subtitle = new Text(
			`Preparing your amazing ${isUsingHeight() ? '\n' : ' '}gaming experience`,
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fill: this.SUBTITLE_COLOR,
				align: 'center',
				fontWeight: 'bold',
				stroke: this.STROKE_COLOR,
			})
		);
		this.subtitle.anchor.set(
			this.SCREEN_CENTER_FACTOR,
			this.SCREEN_CENTER_FACTOR
		);
		this.addChild(this.subtitle);
	}

	private positionElements(): void {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		// Title
		this.title.x = screenWidth * this.SCREEN_CENTER_FACTOR;
		this.title.y =
			screenHeight * this.SCREEN_CENTER_FACTOR -
			scaled(this.LOADING_TEXT_MARGIN);

		// Subtitle
		this.subtitle.x = screenWidth * this.SCREEN_CENTER_FACTOR;
		this.subtitle.y =
			screenHeight * this.SCREEN_CENTER_FACTOR +
			scaled(this.LOADING_TEXT_MARGIN);
	}

	public updateProgress(progress: number): void {
		this.loadingBar.updateProgress(progress);
	}

	public onResize(): void {
		this.title.style.fontSize = scaled(this.TITLE_FONT_SIZE);
		this.title.style.strokeThickness = scaled(this.TITLE_STROKE_THICKNESS);
		this.subtitle.style.fontSize = scaled(this.SUBTITLE_FONT_SIZE);
		this.subtitle.style.strokeThickness = scaled(
			this.SUBTITLE_STROKE_THICKNESS
		);
		// Note: Loading bar will scale internally

		this.positionElements();
	}

	public destroy(): void {
		window.removeEventListener('resize', this.boundOnResize);
		this.title.destroy();
		this.subtitle.destroy();
		this.loadingBar.destroy();
		super.destroy();
	}
}
