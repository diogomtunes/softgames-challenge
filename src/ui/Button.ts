import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { scaled } from '../core/Utils';
import { sound } from '@pixi/sound';

export interface ButtonOptions {
	text?: string;
	emoji?: string;
	color: number;
	width?: number;
	height?: number;
	margin?: number;
	borderRadius?: number;
	fontSize?: number;
	onClick: () => void;
}

/**
 * Interactive button component with hover effects and text/emoji support
 *
 * @extends Container
 */
export class Button extends Container {
	// UI Constants
	private readonly STROKE_THICKNESS = 2;

	// UI Elements
	private background: Graphics;
	private textElement?: Text;
	private emojiElement?: Text;
	private rightEmojiElement?: Text;

	// Properties
	private color: number;
	private originalWidth: number;
	private originalHeight: number;
	private originalMargin: number;
	private originalBorderRadius: number;
	private originalFontSize: number;
	private resizeHandler: (() => void) | null = null;

	constructor(options: ButtonOptions) {
		super();

		this.color = options.color;
		this.originalWidth = options.width || 400;
		this.originalHeight = options.height || 100;
		this.originalMargin = options.margin || 48;
		this.originalBorderRadius = options.borderRadius || 8;
		this.originalFontSize = options.fontSize || 28;
		this.eventMode = 'static'; // Required for pointer events

		// Background
		this.background = new Graphics();
		this.drawBackground(this.color);
		this.addChild(this.background);

		// Text
		if (options.text) {
			this.textElement = new Text(
				options.text,
				new TextStyle({
					fontFamily: 'Arial, sans-serif',
					fill: 0xffffff,
					align: 'center',
					fontWeight: 'bold',
					stroke: 0x000000,
				})
			);
			this.textElement.anchor.set(0.5, 0.5);
			this.addChild(this.textElement);
		}

		// Emoji
		if (options.emoji) {
			this.emojiElement = new Text(
				options.emoji,
				new TextStyle({
					fontFamily: 'Arial, sans-serif',
					align: 'center',
				})
			);
			this.emojiElement.anchor.set(0.5, 0.5);
			this.addChild(this.emojiElement);
		}

		this.addEventListeners(options);
		this.onResize();
	}

	public addEventListeners(options: ButtonOptions): void {
		// On hover - brighten the color and enlarge
		this.on('pointerover', () => {
			sound.play('button_hover', { volume: 0.1 });
			const r = Math.min(((this.color >> 16) & 0xff) + 0x33, 0xff);
			const g = Math.min(((this.color >> 8) & 0xff) + 0x33, 0xff);
			const b = Math.min((this.color & 0xff) + 0x33, 0xff);
			const lighterColor = (r << 16) | (g << 8) | b;

			this.drawBackground(lighterColor);
			this.scale.set(1.05);
		});

		this.on('pointerout', () => {
			this.drawBackground(this.color);
			this.scale.set(1);
		});

		// Shrink when clicking
		this.on('pointerdown', () => {
			this.scale.set(0.95);
		});

		this.on('pointerup', () => {
			this.scale.set(1.05);
			sound.play('button_click', { volume: 0.1 });
			options.onClick();
		});

		// Store the resize handler as a bound method so we can remove it later
		this.resizeHandler = () => {
			this.onResize();
		};
		window.addEventListener('resize', this.resizeHandler);
	}

	public removeEventListeners(): void {
		this.off('pointerover');
		this.off('pointerout');
		this.off('pointerdown');
		this.off('pointerup');
		if (this.resizeHandler) {
			window.removeEventListener('resize', this.resizeHandler);
			this.resizeHandler = null;
		}
	}

	private positionElements(): void {
		// Get scaled dimensions
		const scaledWidth = scaled(this.originalWidth);
		const scaledMargin = scaled(this.originalMargin);

		// If both text and emoji, position them and create a second emoji for the right side
		// If not, position the text or emoji in the center
		if (this.textElement && this.emojiElement) {
			const marginOffset = scaledWidth * 0.5 - scaledMargin;

			// Create right side emoji if it doesn't exist
			if (!this.rightEmojiElement) {
				this.rightEmojiElement = new Text(
					this.emojiElement.text,
					this.emojiElement.style
				);
				this.rightEmojiElement.anchor.set(0.5, 0.5);
				this.addChild(this.rightEmojiElement);
			}

			// Position the emojis and text
			this.emojiElement.x = -marginOffset;
			this.emojiElement.y = 0;
			this.rightEmojiElement.x = marginOffset;
			this.rightEmojiElement.y = 0;
			this.textElement.x = 0;
			this.textElement.y = 0;
		} else if (this.textElement) {
			this.textElement.x = 0;
			this.textElement.y = 0;
		} else if (this.emojiElement) {
			this.emojiElement.x = 0;
			this.emojiElement.y = 0;
		}
	}

	private drawBackground(fillColor: number): void {
		// Get scaled dimensions
		const scaledWidth = scaled(this.originalWidth);
		const scaledHeight = scaled(this.originalHeight);
		const scaledBorderRadius = scaled(this.originalBorderRadius);

		// Draw
		this.background.clear();
		this.background.lineStyle(scaled(this.STROKE_THICKNESS), 0xffffff);
		this.background.beginFill(fillColor);
		this.background.drawRoundedRect(
			-scaledWidth * 0.5,
			-scaledHeight * 0.5,
			scaledWidth,
			scaledHeight,
			scaledBorderRadius
		);
		this.background.endFill();
	}

	public onResize(): void {
		// Text
		if (this.textElement) {
			this.textElement.style.fontSize = scaled(this.originalFontSize);
			this.textElement.style.strokeThickness = scaled(
				this.STROKE_THICKNESS
			);
		}

		// Emoji
		if (this.emojiElement) {
			const emojiSize = this.textElement
				? scaled(this.originalFontSize * 1.5)
				: scaled(this.originalFontSize);
			this.emojiElement.style.fontSize = emojiSize;
		}

		// Right emoji
		if (this.rightEmojiElement) {
			const emojiSize = this.textElement
				? scaled(this.originalFontSize * 1.5)
				: scaled(this.originalFontSize);
			this.rightEmojiElement.style.fontSize = emojiSize;
		}

		this.drawBackground(this.color);
		this.positionElements();
	}

	public destroy(): void {
		this.removeEventListeners();
		if (this.textElement) {
			this.textElement.destroy();
		}
		if (this.emojiElement) {
			this.emojiElement.destroy();
		}
		if (this.rightEmojiElement) {
			this.rightEmojiElement.destroy();
		}
		this.background.destroy();
		super.destroy();
	}
}
