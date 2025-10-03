import { Container, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import { GameManager } from '../core/GameManager';
import { Button } from '../ui/Button';
import { scaled, resizeToFit } from '../core/Utils';
import { sound } from '@pixi/sound';

/**
 * Main menu scene with game selection buttons, animated background video, and blinking instruction text.
 *
 * @extends Container
 */
export class MainMenu extends Container {
	// UI Constants
	private readonly TITLE_FONT_SIZE = 48;
	private readonly SUBTITLE_FONT_SIZE = 20;
	private readonly INSTRUCTION_FONT_SIZE = 24;
	private readonly TITLE_STROKE_THICKNESS = 4;
	private readonly SUBTITLE_STROKE_THICKNESS = 2;
	private readonly INSTRUCTION_STROKE_THICKNESS = 4;
	private readonly TITLE_COLOR = 0xffffff; // White
	private readonly SUBTITLE_COLOR = 0xaaaaaa; // Grey
	private readonly INSTRUCTION_COLOR = 0xcccccc; // Light grey
	private readonly STROKE_COLOR = 0x000000; // Black
	private readonly LOGO_SCALE = 1.5;
	private readonly BUTTON_SPACING = 120;
	private readonly INSTRUCTION_BOTTOM_OFFSET = 110;
	private readonly LOGO_Y_POSITION = 0.15;
	private readonly TITLE_Y_POSITION = 0.3;
	private readonly SUBTITLE_Y_POSITION = 0.4;
	private readonly ANIMATION_SPEED = 0.003;
	private readonly ANIMATION_ALPHA_BASE = 0.6;
	private readonly ANIMATION_ALPHA_RANGE = 0.3;
	private readonly ACE_OF_SHADOWS_COLOR = 0x1a232b; // Dark blue-grey
	private readonly MAGIC_WORDS_COLOR = 0xb39ddb; // Light purple
	private readonly PHOENIX_FLAME_COLOR = 0xb8860b; // Dark goldenrod

	// UI Elements
	private title!: Text;
	private subtitle!: Text;
	private buttons!: Container;
	private logo!: Sprite;
	private backgroundVideo!: Sprite;

	// Core
	private gameManager: GameManager;
	private app: any;

	constructor(gameManager: GameManager) {
		super();
		this.gameManager = gameManager;
		this.app = gameManager.getApp();

		this.setupBackgroundVideo();
		this.buildUI();
		this.onResize();
	}

	private setupBackgroundVideo(): void {
		const videoTexture = Assets.get('background-video-texture-space');
		this.backgroundVideo = new Sprite(videoTexture);
		this.addChildAt(this.backgroundVideo, 0);
		sound.play('space_loop', { loop: true, volume: 0.2, speed: 0.8 });
	}

	private buildUI(): void {
		// Softgames logo
		const logoTexture = Assets.get('assets/sprites/softgames_logo.png');
		this.logo = new Sprite(logoTexture);
		this.logo.anchor.set(0.5, 0.5);
		this.addChild(this.logo);

		// Title
		this.title = new Text(
			'Game Developer\nAssignment',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fill: this.TITLE_COLOR,
				align: 'center',
				fontWeight: 'bold',
				stroke: this.STROKE_COLOR,
				strokeThickness: scaled(this.TITLE_STROKE_THICKNESS),
			})
		);
		this.title.anchor.set(0.5, 0.5);
		this.addChild(this.title);

		// Subtitle
		this.subtitle = new Text(
			'Made by Diogo Antunes',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fill: this.SUBTITLE_COLOR,
				align: 'center',
				fontWeight: 'normal',
				stroke: this.STROKE_COLOR,
				strokeThickness: scaled(this.SUBTITLE_STROKE_THICKNESS),
			})
		);
		this.subtitle.anchor.set(0.5, 0.5);
		this.addChild(this.subtitle);

		// Buttons
		this.buttons = new Container();
		this.addChild(this.buttons);
		const games = [
			{
				name: 'Ace of Shadows',
				emoji: '🃏',
				color: this.ACE_OF_SHADOWS_COLOR,
				action: () => this.gameManager.startGame('ACE_OF_SHADOWS'),
			},
			{
				name: 'Magic Words',
				emoji: '🗣️',
				color: this.MAGIC_WORDS_COLOR,
				action: () => this.gameManager.startGame('MAGIC_WORDS'),
			},
			{
				name: 'Phoenix Flame',
				emoji: '🔥',
				color: this.PHOENIX_FLAME_COLOR,
				action: () => this.gameManager.startGame('PHOENIX_FLAME'),
			},
		];

		games.forEach((game, index) => {
			const button = new Button({
				text: game.name,
				emoji: game.emoji,
				color: game.color,
				onClick: game.action || (() => {}),
			});
			button.y = index * scaled(this.BUTTON_SPACING);
			this.buttons.addChild(button);
		});

		// Blinking text
		const instruction = new Text(
			'Select any game to start',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fill: this.INSTRUCTION_COLOR,
				align: 'center',
				fontWeight: 'bold',
				stroke: this.STROKE_COLOR,
				strokeThickness: scaled(this.INSTRUCTION_STROKE_THICKNESS),
			})
		);
		instruction.anchor.set(0.5, 0.5);
		this.addChild(instruction);

		// Blinking animation
		this.app.ticker.add(() => {
			const time = Date.now() * this.ANIMATION_SPEED;
			instruction.alpha =
				this.ANIMATION_ALPHA_BASE +
				Math.sin(time) * this.ANIMATION_ALPHA_RANGE;
		});
	}

	private positionElements(): void {
		const screenWidth = this.gameManager.getApp().screen.width;
		const screenHeight = this.gameManager.getApp().screen.height;

		// Logo
		this.logo.scale.set(scaled(this.LOGO_SCALE));
		this.logo.x = screenWidth * 0.5;
		this.logo.y = screenHeight * this.LOGO_Y_POSITION;

		// Title
		this.title.style.fontSize = scaled(this.TITLE_FONT_SIZE);
		this.title.x = screenWidth * 0.5;
		this.title.y = screenHeight * this.TITLE_Y_POSITION;

		// Subtitle
		this.subtitle.style.fontSize = scaled(this.SUBTITLE_FONT_SIZE);
		this.subtitle.x = screenWidth * 0.5;
		this.subtitle.y = screenHeight * this.SUBTITLE_Y_POSITION;

		// Buttons
		this.buttons.x = screenWidth * 0.5;
		this.buttons.y = screenHeight * 0.5;
		this.buttons.children.forEach((button, index) => {
			button.y = index * scaled(this.BUTTON_SPACING);
		});

		// Instruction text
		const instruction = this.children[this.children.length - 1] as Text;
		instruction.style.fontSize = scaled(this.INSTRUCTION_FONT_SIZE);
		instruction.x = screenWidth * 0.5;
		instruction.y = screenHeight - scaled(this.INSTRUCTION_BOTTOM_OFFSET);
	}

	public onResize(): void {
		resizeToFit(
			this.backgroundVideo,
			this.app.screen.width,
			this.app.screen.height
		);
		this.positionElements();
	}

	public destroy(): void {
		sound.stop('space_loop');
		this.title.destroy();
		this.subtitle.destroy();
		this.buttons.destroy();
		this.logo.destroy();
		this.backgroundVideo.destroy();
		super.destroy();
	}
}
