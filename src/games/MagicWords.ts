import {
	Container,
	Text,
	TextStyle,
	Sprite,
	Texture,
	Graphics,
	Application,
	Assets,
	HTMLText,
} from 'pixi.js';
import { sound } from '@pixi/sound';
import { Game } from '../core/Game';
import {
	textToHtmlWithEmojis,
	scaled,
	isMobileDevice,
	resizeToFit,
} from '../core/Utils';

interface DialogueData {
	dialogue: Array<{
		name: string;
		text: string;
	}>;
	emojies: Array<{
		name: string;
		url: string;
	}>;
	avatars: Array<{
		name: string;
		url: string;
		position: string;
	}>;
}

/**
 * Interactive dialogue system game with character portraits, emoji support, and animated UI elements.
 *
 * Features a visual novel-style interface with character avatars, dialogue text with inline emoji images,
 * smooth fade-in animations, and click-to-advance functionality.
 *
 * @extends Game
 */
export class MagicWords extends Game {
	// UI Constants
	private readonly CHARACTER_PORTRAIT_SCALE = 2;
	private readonly CHARACTER_NAME_FONT_SIZE = 64;
	private readonly DIALOGUE_FONT_SIZE = 40;
	private readonly CONTINUE_INDICATOR_FONT_SIZE = 48;
	private readonly COMPLETION_FONT_SIZE = 48;
	private readonly TEXT_MARGIN = 50;
	private readonly TEXT_TOP_MARGIN = 16;
	private readonly DIALOGUE_TOP_MARGIN = 120;
	private readonly CONTINUE_INDICATOR_MARGIN = 30;
	private readonly ANIMATION_MOVEMENT = 10;

	// UI Elements
	private background!: Sprite;
	private darkOverlay!: Graphics;
	private dialogueBanner!: Graphics;
	private characterPortrait!: Sprite;
	private characterNameText!: Text;
	private dialogueTextContainer!: HTMLText;
	private completionText!: Text;
	private continueIndicator!: Text;
	private dialogueData!: DialogueData;
	private currentDialogueIndex: number = 0;

	// Dialogue and animation state
	private timeout: ReturnType<typeof setTimeout> | null = null;
	private overlayAnimationTime: number = 0;
	private dialogueBannerAnimationTime: number = 0;
	private darkOverlayAlpha: number = 0;
	private dialogueBannerAlpha: number = 0;

	// Data
	private emojiBase64Map: Map<string, string> = new Map();
	private avatarMap: Map<string, Texture> = new Map();

	constructor(
		app: Application,
		backgroundContainer: Container,
		foregroundContainer: Container
	) {
		super(app, backgroundContainer, foregroundContainer);
	}

	public initialize(): void {
		this.loadDialogueData();
	}

	public buildBackground(): void {
		// Background
		this.background = new Sprite(
			Assets.get('assets/sprites/neighbourhood.jpg')
		);
		this.backgroundContainer.addChild(this.background);

		// Dark overlay
		this.darkOverlay = new Graphics();
		this.backgroundContainer.addChild(this.darkOverlay);
	}

	public buildForeground(): void {
		//
	}

	public update(_deltaTime: number): void {
		if (!this.continueIndicator) return;
		// Animate the continue indicator up and down
		const time = Date.now() * 0.003;
		const movement = Math.sin(time) * scaled(this.ANIMATION_MOVEMENT);
		this.continueIndicator.y =
			this.app.screen.height -
			scaled(this.CONTINUE_INDICATOR_MARGIN) +
			movement;

		// Sync blinking with movement: opaque at top, transparent at bottom
		// Convert movement range (-5 to +5) to alpha range (1.0 to 0.6)
		const normalizedMovement = (movement + 5) / 10; // 0 to 1
		this.continueIndicator.alpha = 0.6 + 0.4 * normalizedMovement;
	}

	public start(): void {
		// Start animation sequence after 1 second
		this.timeout = setTimeout(() => {
			this.app.ticker.add(this.animateDarkening, this);
			this.createDialogueUI();
		}, 1000);
		this.app.ticker.add(this.update, this);
		sound.play('street_ambience', { loop: true, volume: 0.5 });
	}

	private animateDarkening = (): void => {
		this.overlayAnimationTime += this.app.ticker.deltaMS;
		const progress = Math.min(this.overlayAnimationTime / 500, 1); // 0.5 seconds

		// Darken the overlay
		this.darkOverlay.clear();
		this.darkOverlayAlpha = progress * 0.3; // 30% opacity max
		this.darkOverlay.beginFill(0x000000, this.darkOverlayAlpha);
		this.darkOverlay.drawRect(
			0,
			0,
			this.app.screen.width,
			this.app.screen.height
		);
		this.darkOverlay.endFill();

		if (progress >= 1) {
			this.app.ticker.remove(this.animateDarkening, this);
		}
	};

	private createDialogueUI(): void {
		// Create grey banner covering bottom 40% of the page (initially transparent)
		this.dialogueBanner = new Graphics();
		this.foregroundContainer.addChild(this.dialogueBanner);

		// Start banner fade-in animation
		this.dialogueBannerAnimationTime = 0;
		this.app.ticker.add(this.animateBannerFadeIn, this);

		// Create character portrait (initially hidden)
		this.characterPortrait = new Sprite();
		this.characterPortrait.anchor.set(0.5, 1);
		this.characterPortrait.x = this.app.screen.width * 0.5;
		this.characterPortrait.y = this.app.screen.height * 0.6;
		this.characterPortrait.scale.set(scaled(this.CHARACTER_PORTRAIT_SCALE)); // Larger scale
		this.characterPortrait.visible = false;
		this.foregroundContainer.addChild(this.characterPortrait);

		// Create character name text
		this.characterNameText = new Text(
			'',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fontSize: scaled(this.CHARACTER_NAME_FONT_SIZE),
				fill: 0xffffff,
				align: 'left',
				fontWeight: 'bold',
			})
		);
		this.characterNameText.x = scaled(this.TEXT_MARGIN);
		this.characterNameText.y =
			this.app.screen.height * 0.6 + scaled(this.TEXT_TOP_MARGIN);
		this.foregroundContainer.addChild(this.characterNameText);

		// Create continue indicator
		this.continueIndicator = new Text(
			'▼',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fontSize: scaled(this.CONTINUE_INDICATOR_FONT_SIZE),
				fill: 0xffffff,
			})
		);
		this.continueIndicator.anchor.set(1, 1);
		this.continueIndicator.x =
			this.app.screen.width - scaled(this.CONTINUE_INDICATOR_MARGIN);
		this.continueIndicator.y =
			this.app.screen.height - scaled(this.CONTINUE_INDICATOR_MARGIN);
		this.continueIndicator.visible = false; // Hidden initially
		this.foregroundContainer.addChild(this.continueIndicator);
	}

	private animateBannerFadeIn = (): void => {
		this.dialogueBannerAnimationTime += this.app.ticker.deltaMS;
		const progress = Math.min(this.dialogueBannerAnimationTime / 500, 1); // 0.5 seconds

		// Fade in the banner
		this.dialogueBanner.clear();
		this.dialogueBannerAlpha = progress * 0.9;
		this.dialogueBanner.beginFill(0x404040, this.dialogueBannerAlpha);
		this.dialogueBanner.drawRect(
			0,
			this.app.screen.height * 0.6,
			this.app.screen.width,
			this.app.screen.height * 0.4
		);
		this.dialogueBanner.endFill();

		if (progress >= 1) {
			// Animation complete, start the first dialogue
			this.app.ticker.remove(this.animateBannerFadeIn, this);
			// Show the continue indicator now that dialogue is starting
			this.continueIndicator.visible = true;
			this.showCurrentDialogue();
		}
	};

	private advanceDialogue = (): void => {
		sound.play('dialogue_next');

		if (this.isDialogueComplete()) {
			// Hide completion text and restart dialogue index
			this.completionText.visible = false;
			this.currentDialogueIndex = 0;
			this.showCurrentDialogue();

			// Make dialogue text container visible again
			this.dialogueTextContainer.visible = true;
		} else {
			this.currentDialogueIndex++;
			this.showCurrentDialogue();
		}
	};

	private loadDialogueData(): void {
		// Get the preloaded dialogue data from cache (using the first dialogue file)
		this.dialogueData = Assets.cache.get('dialogue-data-magicwords');
		this.emojiBase64Map = Assets.cache.get('emoji-base64');
		this.avatarMap = Assets.cache.get('avatar-textures');
	}

	private isDialogueComplete(): boolean {
		return this.currentDialogueIndex >= this.dialogueData.dialogue.length;
	}

	private showCurrentDialogue(): void {
		if (this.isDialogueComplete()) {
			this.showDialogueComplete();
			return;
		}

		const dialogueEntry =
			this.dialogueData.dialogue[this.currentDialogueIndex];

		// Show character name
		this.characterNameText.text = dialogueEntry.name;

		// Show character portrait
		this.showCharacterPortrait(dialogueEntry.name);

		// Show dialogue text with emojis
		this.showDialogueText(dialogueEntry.text);
	}

	private showCharacterPortrait(characterName: string): void {
		const avatarTexture = this.avatarMap.get(characterName);

		if (avatarTexture) {
			// Use the character's specific portrait
			this.characterPortrait.texture = avatarTexture;
			this.characterPortrait.visible = true;
		} else {
			// Use unknown.png for characters without portraits
			const unknownTexture = Assets.get('assets/sprites/unknown.png');
			if (unknownTexture) {
				this.characterPortrait.texture = unknownTexture;
				this.characterPortrait.visible = true;
			} else {
				// If unknown.png is not available, hide the portrait
				this.characterPortrait.visible = false;
				return;
			}
		}

		// Position based on character position from dialogue data
		this.positionCharacterPortrait(characterName);
	}

	private positionCharacterPortrait(characterName: string): void {
		const avatarData = this.dialogueData?.avatars.find(
			a => a.name === characterName
		);
		if (avatarData?.position === 'left') {
			this.characterPortrait.x = this.app.screen.width * 0.2; // Left side
		} else {
			this.characterPortrait.x = this.app.screen.width * 0.8; // Right side
		}
	}

	/**
	 * Renders dialogue text with inline emoji images using HTMLText.
	 *
	 * Replaces {emoji} tags with img tags
	 *
	 * @param text - The dialogue text containing {emoji} tags
	 */
	private showDialogueText(text: string): void {
		const fontSize = scaled(this.DIALOGUE_FONT_SIZE);
		// Replace {emoji} tags with <img> tags using the emojiMap
		const html = textToHtmlWithEmojis(text, this.emojiBase64Map, fontSize);

		// Create container if it doesn't exist
		if (!this.dialogueTextContainer) {
			this.dialogueTextContainer = new HTMLText(html, {
				fontFamily: 'Arial, sans-serif',
				fontSize: fontSize,
				fill: '#ffffff',
				wordWrap: true,
				align: 'left',
				whiteSpace: 'normal',
			});
			this.foregroundContainer.addChild(this.dialogueTextContainer);
		}

		// Update container
		this.dialogueTextContainer.x = scaled(this.TEXT_MARGIN);
		this.dialogueTextContainer.y =
			this.app.screen.height * 0.6 + scaled(this.DIALOGUE_TOP_MARGIN);
		this.dialogueTextContainer.text = html;
		this.dialogueTextContainer.style.fontSize = fontSize;
		this.dialogueTextContainer.style.wordWrapWidth =
			this.app.screen.width - scaled(this.TEXT_MARGIN) * 2;
	}

	private showDialogueComplete(): void {
		this.characterPortrait.visible = false;
		this.characterNameText.text = '';

		// Hide dialogue text container (don't destroy it, we'll reuse it)
		if (this.dialogueTextContainer) {
			this.dialogueTextContainer.visible = false;
		}

		// Create completion message if it doesn't exist, otherwise just show it
		if (!this.completionText) {
			this.completionText = new Text(
				`Dialogue Complete!\n${isMobileDevice() ? 'Tap' : 'Click'} to restart`,
				new TextStyle({
					fontFamily: 'Arial, sans-serif',
					fontSize: scaled(this.COMPLETION_FONT_SIZE),
					fill: 0xffffff,
					align: 'center',
					fontWeight: 'bold',
				})
			);
			this.completionText.anchor.set(0.5, 0.5);
			this.foregroundContainer.addChild(this.completionText);
		}
		this.completionText.x = this.app.screen.width * 0.5;
		this.completionText.y =
			this.app.screen.height * 0.6 + this.app.screen.height * 0.4 * 0.5;
		this.completionText.visible = true;
	}

	private resizeBackgroundToFit(): void {
		resizeToFit(
			this.background,
			this.app.screen.width,
			this.app.screen.height
		);
	}

	public onResize(): void {
		// Resize background to fit screen while maintaining aspect ratio
		this.resizeBackgroundToFit();

		// Update dark overlay
		this.darkOverlay.clear();
		this.darkOverlay.beginFill(0x000000, this.darkOverlayAlpha);
		this.darkOverlay.drawRect(
			0,
			0,
			this.app.screen.width,
			this.app.screen.height
		);
		this.darkOverlay.endFill();

		// Update dialogue banner
		if (this.dialogueBanner) {
			this.dialogueBanner.clear();
			this.dialogueBanner.beginFill(0x404040, this.dialogueBannerAlpha);
			this.dialogueBanner.drawRect(
				0,
				this.app.screen.height * 0.6,
				this.app.screen.width,
				this.app.screen.height * 0.4
			);
			this.dialogueBanner.endFill();
		}

		// Reposition and resize character portrait
		if (this.characterPortrait && this.characterPortrait.visible) {
			// Update scale
			this.characterPortrait.scale.set(
				scaled(this.CHARACTER_PORTRAIT_SCALE)
			);

			// Recalculate position based on current dialogue
			if (
				this.dialogueData &&
				this.currentDialogueIndex < this.dialogueData.dialogue.length
			) {
				const currentDialogue =
					this.dialogueData.dialogue[this.currentDialogueIndex];
				this.positionCharacterPortrait(currentDialogue.name);
			}
			this.characterPortrait.y = this.app.screen.height * 0.6;
		}

		// Reposition and resize character name text
		if (this.characterNameText) {
			this.characterNameText.style.fontSize = scaled(
				this.CHARACTER_NAME_FONT_SIZE
			);
			this.characterNameText.x = scaled(this.TEXT_MARGIN);
			this.characterNameText.y =
				this.app.screen.height * 0.6 + scaled(this.TEXT_TOP_MARGIN);
		}

		// Reposition dialogue text container and update its properties
		if (this.dialogueTextContainer) {
			// Update font size and word wrap width
			this.dialogueTextContainer.style.fontSize = scaled(
				this.DIALOGUE_FONT_SIZE
			);
			this.dialogueTextContainer.style.wordWrapWidth =
				this.app.screen.width - scaled(this.TEXT_MARGIN) * 2;
			this.dialogueTextContainer.x = scaled(this.TEXT_MARGIN);
			this.dialogueTextContainer.y =
				this.app.screen.height * 0.6 + scaled(this.DIALOGUE_TOP_MARGIN); // Match initial positioning
		}

		// Reposition and resize completion text
		if (this.completionText) {
			this.completionText.style.fontSize = scaled(
				this.COMPLETION_FONT_SIZE
			);
			this.completionText.x = this.app.screen.width * 0.5;
			this.completionText.y =
				this.app.screen.height * 0.6 +
				this.app.screen.height * 0.4 * 0.5;
		}

		// Reposition and resize continue indicator
		if (this.continueIndicator) {
			this.continueIndicator.style.fontSize = scaled(
				this.CONTINUE_INDICATOR_FONT_SIZE
			);
			this.continueIndicator.x =
				this.app.screen.width - scaled(this.CONTINUE_INDICATOR_MARGIN);
			this.continueIndicator.y =
				this.app.screen.height - scaled(this.CONTINUE_INDICATOR_MARGIN);
		}
	}

	public addEventListeners(): void {
		this.foregroundContainer.eventMode = 'static';
		this.foregroundContainer.on('pointerdown', this.advanceDialogue);
	}

	public removeEventListeners(): void {
		if (this.foregroundContainer) {
			this.foregroundContainer.off('pointerdown', this.advanceDialogue);
		}
	}

	public destroy(): void {
		sound.stop('street_ambience');
		// Prevent bug when exiting back to main menu
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		// Remove ticker callbacks
		this.app.ticker.remove(this.animateDarkening, this);
		this.app.ticker.remove(this.animateBannerFadeIn, this);
		this.app.ticker.remove(this.update, this);

		// Destroy all sprites and graphics
		this.background?.destroy();
		this.darkOverlay?.destroy();
		this.dialogueBanner?.destroy();
		this.characterPortrait?.destroy();
		this.characterNameText?.destroy();
		this.dialogueTextContainer?.destroy();
		this.completionText?.destroy();
		this.continueIndicator?.destroy();
	}
}
