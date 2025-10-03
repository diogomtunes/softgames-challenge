import { Sprite, Assets, Container } from 'pixi.js';
import { Button } from '../ui/Button';
import { Game } from '../core/Game';
import { scaled, resizeToFit } from '../core/Utils';
import { sound } from '@pixi/sound';

class Card extends Sprite {
	// Position tracking
	initialX: number = 0;
	targetX: number = 0;
	initialY: number = 0;
	targetY: number = 0;

	// Animation state
	moveTimeElapsed: number = 0;
	initialRotation: number = 0;
	targetRotation: number = 0;

	constructor(texture: any) {
		super(texture);
		this.anchor.set(0.5, 0.5);
	}
}

/**
 * Yu-Gi-Oh! themed card dealing with duel disks holding the card stacks.
 *
 * Features 144 card sprites that automatically deal from a central pile to alternating top and bottom stacks,
 * with smooth animations, rotation effects, and a "Hurry up!" speed boost button.
 */
export class AceOfShadows extends Game {
	// UI Constants
	private readonly DUEL_DISK_SCALE = 0.3;
	private readonly CARD_SCALE_INITIAL = 0.2;
	private readonly CARD_SCALE_RESIZE = 0.25;
	private readonly DUEL_DISK_Y_OFFSET = 150;
	private readonly HURRY_UP_BUTTON_OFFSET = 150;
	private readonly CARD_PILE_RADIUS = 30;
	private readonly CARD_STACK_OFFSET = 0.05;

	// UI Elements
	private hurryUpButton: Button | null = null;
	private background!: Sprite;
	private topDuelDisk!: Sprite;
	private bottomDuelDisk!: Sprite;
	private topCardHolder!: Sprite;
	private bottomCardHolder!: Sprite;
	private cardContainer!: Container;

	// Card Management
	private cards: Card[] = [];
	private topStack: Card[] = [];
	private bottomStack: Card[] = [];
	private mainStack: Card[] = [];
	private movingCards: Card[] = [];
	private moveCooldown: number = 0;
	private moveInterval: number = 1000; // 1 second
	private animationDuration: number = 2000; // 2 seconds
	private currentTarget: 'top' | 'bottom' = 'top';

	// Speed boost properties
	private readonly boostedMoveInterval: number = 10;
	private readonly boostedAnimationDuration: number = 200;

	// End positions for card deck holders
	private topEndPosition = { x: 0, y: 0 };
	private bottomEndPosition: { x: number; y: number } = { x: 0, y: 0 };
	private originalCardCenter = { x: 0, y: 0 };

	public initialize(): void {
		// Nothing to do here
	}

	public buildBackground(): void {
		this.background = new Sprite(Assets.get('assets/sprites/street.jpg'));
		this.backgroundContainer.addChild(this.background);
	}

	public buildForeground(): void {
		this.createDuelDisks();
		this.createCards();

		// Hurry up button
		this.hurryUpButton = new Button({
			text: 'Hurry up!',
			color: 0xff6b35, // Orange
			width: 100,
			height: 60,
			fontSize: 16,
			borderRadius: 8,
			onClick: () => this.toggleSpeedBoost(),
		});
		this.foregroundContainer.addChild(this.hurryUpButton);
	}

	public start(): void {
		this.app.ticker.add(this.update, this);
	}

	/**
	 * Deals the top card according to the specified interval.
	 * Also updates currently moving cards
	 * @param deltaTime - The time since the last update.
	 */
	public update(_deltaTime: number): void {
		// Tick down the move cooldown
		this.moveCooldown -= this.app.ticker.deltaMS;

		// Check if it's time to move the next card
		if (this.moveCooldown <= 0 && this.mainStack.length > 0) {
			this.dealTopCard();
			this.moveCooldown = this.moveInterval;
		}

		// Update moving cards
		for (let i = this.movingCards.length - 1; i >= 0; i--) {
			const card = this.movingCards[i];

			card.moveTimeElapsed += this.app.ticker.deltaMS;
			const progress = Math.min(
				card.moveTimeElapsed / this.animationDuration,
				1
			);

			// Ease out animation
			const easeProgress = 1 - Math.pow(1 - progress, 3);

			// Move card
			card.x =
				card.initialX + (card.targetX - card.initialX) * easeProgress;
			card.y =
				card.initialY + (card.targetY - card.initialY) * easeProgress;

			// Rotate card
			card.rotation =
				card.initialRotation +
				(card.targetRotation - card.initialRotation) * easeProgress;

			if (progress >= 1) {
				card.x = card.targetX;
				card.y = card.targetY;
				card.rotation = card.targetRotation;

				// Remove from moving cards array
				this.movingCards.splice(i, 1);
			}
		}
	}

	public onResize(): void {
		resizeToFit(
			this.background,
			this.app.screen.width,
			this.app.screen.height
		);

		// Duel disks
		if (this.topDuelDisk && this.bottomDuelDisk) {
			this.topDuelDisk.scale.set(1);
			this.topDuelDisk.x = this.app.screen.width * 0.5;
			this.topDuelDisk.y = scaled(this.DUEL_DISK_Y_OFFSET);
			this.topDuelDisk.scale.set(scaled(this.DUEL_DISK_SCALE));

			this.bottomDuelDisk.x = this.app.screen.width * 0.5;
			this.bottomDuelDisk.y =
				this.app.screen.height - scaled(this.DUEL_DISK_Y_OFFSET);
			this.bottomDuelDisk.scale.set(scaled(this.DUEL_DISK_SCALE));

			// Update deck end positions after repositioning and rescaling duel disks
			this.updateEndPositions();
		}

		// Card holders
		if (this.topCardHolder && this.bottomCardHolder) {
			this.topCardHolder.x = this.app.screen.width * 0.5;
			this.topCardHolder.y = scaled(this.DUEL_DISK_Y_OFFSET);
			this.topCardHolder.scale.set(scaled(this.DUEL_DISK_SCALE));

			this.bottomCardHolder.x = this.app.screen.width * 0.5;
			this.bottomCardHolder.y =
				this.app.screen.height - scaled(this.DUEL_DISK_Y_OFFSET);
			this.bottomCardHolder.scale.set(scaled(this.DUEL_DISK_SCALE));
		}

		// Cards
		this.updateCardScales();
		this.updateCardPositions();

		// Hurry up button
		if (this.hurryUpButton && this.hurryUpButton.parent) {
			this.hurryUpButton.x =
				this.app.screen.width * 0.5 +
				scaled(this.HURRY_UP_BUTTON_OFFSET);
			this.hurryUpButton.y = this.app.screen.height * 0.5;
		}
	}

	public destroy(): void {
		this.cards.forEach(card => {
			card.destroy();
		});
		this.cards = [];
		this.topStack = [];
		this.bottomStack = [];
		this.mainStack = [];
		this.movingCards = [];

		if (this.topDuelDisk) this.topDuelDisk.destroy();
		if (this.bottomDuelDisk) this.bottomDuelDisk.destroy();
		if (this.topCardHolder) this.topCardHolder.destroy();
		if (this.bottomCardHolder) this.bottomCardHolder.destroy();
		if (this.cardContainer) this.cardContainer.destroy();
		this.background.destroy();
	}

	private createDuelDisks(): void {
		// Top duel disk
		this.topDuelDisk = new Sprite(
			Assets.get('assets/sprites/duel_disk.png')
		);
		this.topDuelDisk.anchor.set(0.5, 0.5);
		this.topDuelDisk.x = this.app.screen.width * 0.5;
		this.topDuelDisk.y = scaled(this.DUEL_DISK_Y_OFFSET);
		this.topDuelDisk.rotation = Math.PI;
		this.foregroundContainer.addChild(this.topDuelDisk);

		// Bottom duel disk
		this.bottomDuelDisk = new Sprite(
			Assets.get('assets/sprites/duel_disk.png')
		);
		this.bottomDuelDisk.anchor.set(0.5, 0.5);
		this.bottomDuelDisk.x = this.app.screen.width * 0.5;
		this.foregroundContainer.addChild(this.bottomDuelDisk);

		// Card containers in-between layers so that the cards can slot into the card holders
		this.cardContainer = new Container();
		this.foregroundContainer.addChild(this.cardContainer);

		// Second layer - duel disk card holders
		// Top
		this.topCardHolder = new Sprite(
			Assets.get('assets/sprites/duel_disk_card_holder.png')
		);
		this.topCardHolder.anchor.set(0.5, 0.5);
		this.topCardHolder.x = this.app.screen.width * 0.5;
		this.topCardHolder.y = scaled(this.DUEL_DISK_Y_OFFSET);
		this.topCardHolder.rotation = Math.PI;
		this.topCardHolder.scale.set(scaled(this.DUEL_DISK_SCALE));
		this.foregroundContainer.addChild(this.topCardHolder);

		// Bottom
		this.bottomCardHolder = new Sprite(
			Assets.get('assets/sprites/duel_disk_card_holder.png')
		);
		this.bottomCardHolder.anchor.set(0.5, 0.5);
		this.bottomCardHolder.x = this.app.screen.width * 0.5;
		this.bottomCardHolder.y =
			this.app.screen.height - scaled(this.DUEL_DISK_Y_OFFSET);
		this.bottomCardHolder.scale.set(scaled(this.DUEL_DISK_SCALE));
		this.foregroundContainer.addChild(this.bottomCardHolder);
	}

	private updateEndPositions(): void {
		const offsetX = this.topDuelDisk.width * 0.2;
		const offsetY = this.topDuelDisk.height * 0.21;

		// Top duel disk end position
		this.topEndPosition.x = this.topDuelDisk.x + offsetX;
		this.topEndPosition.y = this.topDuelDisk.y + offsetY;

		// Bottom duel disk end position (flip the Y offset since it's rotated)
		this.bottomEndPosition.x = this.bottomDuelDisk.x - offsetX;
		this.bottomEndPosition.y = this.bottomDuelDisk.y - offsetY;
	}

	private updateCardScales(): void {
		const cardScale = scaled(this.CARD_SCALE_RESIZE);
		this.cards.forEach(card => {
			card.scale.set(cardScale);
		});
	}

	private updateCardPositions(): void {
		const centerX = this.app.screen.width * 0.5;
		const centerY = this.app.screen.height * 0.5;

		// Update main stack cards (cards that haven't been dealt yet)
		this.mainStack.forEach(card => {
			// Calculate the offset from the original center position
			const offsetX = card.x - this.originalCardCenter.x;
			const offsetY = card.y - this.originalCardCenter.y;

			// Apply the same offset to the new center
			const newX = centerX + offsetX;
			const newY = centerY + offsetY;

			card.x = newX;
			card.y = newY;
		});

		this.originalCardCenter.x = centerX;
		this.originalCardCenter.y = centerY;

		// Top stack
		this.topStack.forEach((card, index) => {
			if (this.topEndPosition) {
				const stackX =
					this.topEndPosition.x +
					index * scaled(this.CARD_STACK_OFFSET) * -1;
				const stackY =
					this.topEndPosition.y +
					index * scaled(this.CARD_STACK_OFFSET) * -1;

				card.x = stackX;
				card.y = stackY;
				card.targetX = stackX;
				card.targetY = stackY;
				card.targetRotation = Math.PI * 1.5;
				card.rotation = Math.PI * 1.5;
			}
		});

		// Bottom stack
		this.bottomStack.forEach((card, index) => {
			if (this.bottomEndPosition) {
				const stackX =
					this.bottomEndPosition.x +
					index * scaled(this.CARD_STACK_OFFSET) * 1;
				const stackY =
					this.bottomEndPosition.y +
					index * scaled(this.CARD_STACK_OFFSET) * 1;

				card.x = stackX;
				card.y = stackY;
				card.targetX = stackX;
				card.targetY = stackY;
				card.targetRotation = Math.PI * 0.5;
				card.rotation = Math.PI * 0.5;
			}
		});
	}

	private toggleSpeedBoost(): void {
		// Apply speed boost and delete the button
		this.moveInterval = this.boostedMoveInterval;
		this.animationDuration = this.boostedAnimationDuration;
		this.moveCooldown = this.moveInterval;

		// Remove the button from the foreground container
		if (this.hurryUpButton && this.hurryUpButton.parent) {
			this.hurryUpButton.parent.removeChild(this.hurryUpButton);
			this.hurryUpButton.destroy();
			this.hurryUpButton = null;
		}
	}

	private createCards(): void {
		const centerX = this.app.screen.width * 0.5;
		const centerY = this.app.screen.height * 0.5;

		// Store the original center position for later resize calculations
		this.originalCardCenter.x = centerX;
		this.originalCardCenter.y = centerY;

		const cardScale = scaled(this.CARD_SCALE_INITIAL);

		for (let i = 0; i < 144; i++) {
			const card = new Card(
				Assets.get('assets/sprites/yu-gi-oh_small.png')
			);
			card.scale.set(cardScale);

			// Random position within a circular area (like cards randomly piled)
			const maxRadius = scaled(this.CARD_PILE_RADIUS);
			const randomRadius = Math.random() * maxRadius;
			const randomAngle = Math.random() * Math.PI * 2;

			const x = centerX + Math.cos(randomAngle) * randomRadius;
			const y = centerY + Math.sin(randomAngle) * randomRadius;

			card.x = x;
			card.y = y;
			card.rotation = Math.random() * Math.PI * 2;

			// Initialize card properties
			card.initialX = card.x;
			card.initialY = card.y;
			card.targetX = card.x;
			card.targetY = card.y;
			card.moveTimeElapsed = 0;
			card.initialRotation = card.rotation;
			card.targetRotation = card.rotation;

			this.cards.push(card);
			this.mainStack.push(card);
			this.cardContainer.addChild(card);
		}
	}

	private dealTopCard(): void {
		if (this.mainStack.length === 0) return;

		const topCard = this.mainStack.pop();
		if (!topCard) return;

		// Hide button if only 2 cards left
		if (
			this.mainStack.length <= 2 &&
			this.hurryUpButton &&
			this.hurryUpButton.parent
		) {
			this.hurryUpButton.visible = false;
		}

		const targetStack =
			this.currentTarget === 'top' ? this.topStack : this.bottomStack;
		const endPosition =
			this.currentTarget === 'top'
				? this.topEndPosition
				: this.bottomEndPosition;

		// Add a small offset to give illusion of deck size
		const isTopTarget = this.currentTarget === 'top';
		const stackX =
			endPosition.x +
			targetStack.length *
				scaled(this.CARD_STACK_OFFSET) *
				(isTopTarget ? -1 : 1);
		const stackY =
			endPosition.y +
			targetStack.length *
				scaled(this.CARD_STACK_OFFSET) *
				(isTopTarget ? 1 : -1);

		// Toggle target stack for next card
		this.currentTarget = this.currentTarget === 'top' ? 'bottom' : 'top';

		// Calculate trajectory
		topCard.targetX = stackX;
		topCard.targetY = stackY;
		topCard.moveTimeElapsed = 0;

		// Calculate target rotation
		const targetRotation = isTopTarget ? Math.PI * 1.5 : Math.PI * 0.5; // Top stack: 180 degrees, Bottom stack: 0 degrees
		const currentRotation = topCard.rotation;

		const direction = Math.random() > 0.5 ? 1 : -1; // Randomly choose (1 for clockwise, -1 for counter-clockwise)

		const rotationDiff = targetRotation - currentRotation;
		let rotationAmount;

		if (direction > 0) {
			rotationAmount =
				rotationDiff >= 0 ? rotationDiff : rotationDiff + Math.PI * 2;
		} else {
			rotationAmount =
				rotationDiff <= 0 ? rotationDiff : rotationDiff - Math.PI * 2;
		}
		topCard.targetRotation = currentRotation + rotationAmount;

		// Store initial values for the animation
		topCard.initialX = topCard.x;
		topCard.initialY = topCard.y;
		topCard.initialRotation = topCard.rotation;

		targetStack.push(topCard);
		this.movingCards.push(topCard);

		// Move card to top of display list so it appears on top of other cards in the stack
		this.cardContainer.setChildIndex(
			topCard,
			this.cardContainer.children.length - 1
		);

		const randomSound = `deal_${Math.floor(Math.random() * 2) + 1}`;
		const volume = Math.random() * 0.05 + 0.1;
		sound.volume(randomSound, volume);
		sound.play(randomSound);
	}
}
