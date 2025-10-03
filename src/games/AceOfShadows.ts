import { Sprite, Assets, Container } from 'pixi.js';
import { Button } from '../ui/Button';
import { Game } from '../core/Game';
import { scaled, resizeToFit } from '../core/Utils';
import { sound } from '@pixi/sound';

interface VideoFadeAnimation {
	isActive: boolean;
	duration: number;
	fadeTimeElapsed: number;
	isFadeIn: boolean;
}

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

	// Flip state
	flipTimeElapsed: number = 0;
	textureChanged: boolean = false;

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
	private winButton: Button | null = null;
	private background!: Sprite;
	private topDuelDisk!: Sprite;
	private bottomDuelDisk!: Sprite;
	private topCardHolder!: Sprite;
	private bottomCardHolder!: Sprite;
	private cardContainer!: Container;
	private victoryVideoElement: HTMLVideoElement | null = null;

	// Card Management
	private cards: Card[] = [];
	private topStack: Card[] = [];
	private bottomStack: Card[] = [];
	private mainStack: Card[] = [];
	private movingCards: Card[] = [];
	private flippingCards: Card[] = [];
	private cardHolderPositions: { x: number; y: number; rotation: number }[] =
		[
			{ x: 0, y: 0, rotation: 0 },
			{ x: 0, y: 0, rotation: 0 },
			{ x: 0, y: 0, rotation: 0 },
			{ x: 0, y: 0, rotation: 0 },
			{ x: 0, y: 0, rotation: 0 },
		];
	private cardHolderTextures: string[] = [
		'assets/sprites/exodia_right_leg.png',
		'assets/sprites/exodia_right_arm.png',
		'assets/sprites/exodia_forbidden_one.png',
		'assets/sprites/exodia_left_arm.png',
		'assets/sprites/exodia_left_leg.png',
	];
	private flippedCards = 0;
	private flippedTextures = 0;
	private moveCooldown: number = 0;
	private dealCardCooldown: number = 0;
	private flipCardCooldown: number = 500;
	private moveInterval: number = 1000; // 1 second
	private animationDuration: number = 2000; // 2 seconds
	private flipAnimationDuration: number = 500; // 0.5 seconds
	private currentTarget: 'top' | 'bottom' = 'top';

	// Win sequence properties
	private cardsInHolders: Card[] = [];
	private videoFadeAnimation: VideoFadeAnimation = {
		isActive: false,
		duration: 0,
		fadeTimeElapsed: 0,
		isFadeIn: false,
	};
	private readonly winSequenceDealCooldown: number = 200;
	private readonly winSequenceFlipCooldown: number = 250;
	private victoryVideoTimeout: ReturnType<typeof setTimeout> | null = null;

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

		// Win button (initially hidden)
		this.winButton = new Button({
			text: 'Press to win',
			color: 0x4caf50, // Green
			width: 400,
			height: 100,
			fontSize: 32,
			emoji: '😱',
			borderRadius: 8,
			onClick: () => this.startWinSequence(),
		});
		this.winButton.visible = false;
		this.foregroundContainer.addChild(this.winButton);
	}

	public start(): void {
		this.app.ticker.add(this.update, this);
		sound.play('yu-gi-oh_full_theme', { loop: true, volume: 0.2 });
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

		// Show win button when all cards are dealt
		if (
			this.mainStack.length === 0 &&
			this.winButton &&
			!this.winButton.visible
		) {
			this.winButton.visible = true;
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

		// Update flip animations for cards that are currently flipping
		for (let i = this.flippingCards.length - 1; i >= 0; i--) {
			const card = this.flippingCards[i];

			card.flipTimeElapsed += this.app.ticker.deltaMS;
			const progress = Math.min(
				card.flipTimeElapsed / this.flipAnimationDuration,
				1
			);

			// Create a 3D flip effect by scaling the width
			// At the halfway point, change the texture
			const scaleX = scaled(
				Math.abs(Math.cos(progress * Math.PI)) * this.CARD_SCALE_RESIZE
			);
			card.scale.x = scaleX;
			if (progress >= 0.5 && !card.textureChanged) {
				card.texture = Assets.get(
					this.cardHolderTextures[this.flippedTextures]
				);
				card.textureChanged = true;
				this.flippedTextures++;
			}

			// Complete the flip
			if (progress >= 1) {
				card.scale.x = scaled(
					Math.abs(Math.cos(Math.PI)) * this.CARD_SCALE_RESIZE
				);
				// Remove completed flip from the array
				this.flippingCards.splice(i, 1);
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
			this.updateCardHolderPositions();
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

		// Win button (centered)
		if (this.winButton && this.winButton.parent) {
			this.winButton.x = this.app.screen.width * 0.5;
			this.winButton.y = this.app.screen.height * 0.5;
		}
	}

	public destroy(): void {
		sound.stop('yu-gi-oh_full_theme');

		if (this.victoryVideoTimeout) {
			clearTimeout(this.victoryVideoTimeout);
		}
		this.app.ticker.remove(this.dealCardToHolders, this);
		this.app.ticker.remove(this.flipDealtCards, this);
		this.app.ticker.remove(this.updateVideoFade, this);

		this.cards.forEach(card => {
			card.destroy();
		});
		this.cards = [];
		this.topStack = [];
		this.bottomStack = [];
		this.mainStack = [];
		this.movingCards = [];
		this.flippingCards = [];
		this.cardsInHolders = [];
		this.cardHolderPositions = [];

		if (this.topDuelDisk) this.topDuelDisk.destroy();
		if (this.bottomDuelDisk) this.bottomDuelDisk.destroy();
		if (this.topCardHolder) this.topCardHolder.destroy();
		if (this.bottomCardHolder) this.bottomCardHolder.destroy();
		if (this.cardContainer) this.cardContainer.destroy();
		if (this.winButton) this.winButton.destroy();
		if (this.victoryVideoElement) {
			this.victoryVideoElement.pause();
			this.victoryVideoElement.remove();
		}
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

		// Cards in holders (win sequence)
		this.cardsInHolders.forEach((card, index) => {
			if (index < this.cardHolderPositions.length) {
				const holderPos = this.cardHolderPositions[index];
				card.x = holderPos.x;
				card.y = holderPos.y;
				card.targetX = holderPos.x;
				card.targetY = holderPos.y;
				card.targetRotation = card.rotation;
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

	private updateCardHolderPositions(): void {
		const cardHolderPositionOffsets = [
			{ x: -0.3, y: 0.18, rotation: 0.12 },
			{ x: -0.17, y: 0.25, rotation: 0.11 },
			{ x: 0.02, y: 0.27, rotation: -0.05 },
			{ x: 0.17, y: 0.25, rotation: -0.05 },
			{ x: 0.31, y: 0.22, rotation: -0.05 },
		];

		for (let i = 0; i < 5; i++) {
			const offsetX =
				this.bottomDuelDisk.width * cardHolderPositionOffsets[i].x;
			const offsetY =
				this.bottomDuelDisk.height * cardHolderPositionOffsets[i].y;
			this.cardHolderPositions[i].x = this.bottomDuelDisk.x + offsetX;
			this.cardHolderPositions[i].y = this.bottomDuelDisk.y + offsetY;
			this.cardHolderPositions[i].rotation =
				Math.PI * cardHolderPositionOffsets[i].rotation;
		}
	}

	private startWinSequence(): void {
		// Remove the win button from the foreground container
		if (this.winButton && this.winButton.parent) {
			this.winButton.parent.removeChild(this.winButton);
			this.winButton.destroy();
			this.winButton = null;
		}

		// Deal 5 cards from bottom stack to card holders at boosted speed
		this.app.ticker.add(this.dealCardToHolders, this);
	}

	private dealCardToHolders(): void {
		// Deal only 5 cards
		if (this.cardsInHolders.length >= 5) {
			this.app.ticker.remove(this.dealCardToHolders, this);
			this.app.ticker.add(this.flipDealtCards, this);
			return;
		}

		this.dealCardCooldown -= this.app.ticker.deltaMS;
		if (this.dealCardCooldown > 0) return;

		const cardToDeal = this.bottomStack.pop()!;
		const cardIndex = this.cardsInHolders.length;
		const targetPos = this.cardHolderPositions[cardIndex];

		// Set up movement
		cardToDeal.targetX = targetPos.x;
		cardToDeal.targetY = targetPos.y;
		cardToDeal.moveTimeElapsed = 0;
		cardToDeal.initialX = cardToDeal.x;
		cardToDeal.initialY = cardToDeal.y;
		cardToDeal.initialRotation = cardToDeal.rotation;
		cardToDeal.targetRotation = targetPos.rotation;

		this.cardsInHolders.push(cardToDeal);
		this.movingCards.push(cardToDeal);
		this.dealCardCooldown = this.winSequenceDealCooldown;
		this.animationDuration = this.boostedAnimationDuration;
		this.moveInterval = this.winSequenceDealCooldown - 50;

		// Move card to top of display list so it appears on come out of the top of the deck
		this.cardContainer.setChildIndex(
			cardToDeal,
			this.cardContainer.children.length - 1
		);

		const volume = Math.random() * 0.05 + 0.1;
		sound.volume('deal_2', volume);
		sound.play('deal_2');
	}

	private flipDealtCards(): void {
		// Deal only 5 cards
		if (this.flippedCards >= 5) {
			this.app.ticker.remove(this.flipDealtCards, this);
			this.victoryVideoTimeout = setTimeout(() => {
				this.triggerVictoryVideo();
			}, 1000);
			return;
		}

		this.flipCardCooldown -= this.app.ticker.deltaMS;
		if (this.flipCardCooldown > 0) return;

		const cardIndex = this.flippedCards;
		const cardToFlip = this.cardsInHolders[cardIndex]!;

		// Start the flip animation
		this.flippingCards.push(cardToFlip);
		this.flipCardCooldown = this.winSequenceFlipCooldown;
		this.flippedCards++;

		// Play flip sound
		sound.volume('card_flip', 0.3);
		sound.play('card_flip');
	}

	private triggerVictoryVideo(): void {
		this.app.ticker.add(this.updateVideoFade, this);

		// Get cached video element
		this.victoryVideoElement! = Assets.get('video-exodia_obliterate');
		this.victoryVideoElement.currentTime = 0;
		this.victoryVideoElement.muted = false;
		this.victoryVideoElement.volume = 0.1;

		// Configure video for full-screen overlay
		this.victoryVideoElement.style.position = 'fixed';
		this.victoryVideoElement.style.top = '0';
		this.victoryVideoElement.style.left = '0';
		this.victoryVideoElement.style.width = '100vw';
		this.victoryVideoElement.style.height = '100vh';
		this.victoryVideoElement.style.objectFit = 'cover';
		this.victoryVideoElement.style.objectPosition = 'center center';
		this.victoryVideoElement.style.opacity = '0';

		// Add video element to the DOM
		document.body.appendChild(this.victoryVideoElement);

		// Start fade-in animation
		this.startVideoFade(true);

		// Play the video
		this.victoryVideoElement.play().catch(error => {
			console.error('Failed to play victory video:', error);
		});

		// Clean up when video ends
		this.victoryVideoElement.addEventListener('ended', () => {
			this.startVideoFade(false);
		});
	}

	private startVideoFade(isFadeIn: boolean): void {
		const fadeDuration = isFadeIn ? 1500 : 800; // 1.5s fade-in, 0.8s fade-out
		this.videoFadeAnimation = {
			isActive: true,
			duration: fadeDuration,
			fadeTimeElapsed: 0,
			isFadeIn: isFadeIn,
		};
	}

	private updateVideoFade(): void {
		if (!this.videoFadeAnimation.isActive || !this.victoryVideoElement)
			return;

		this.videoFadeAnimation.fadeTimeElapsed += this.app.ticker.deltaMS;
		const progress =
			this.videoFadeAnimation.fadeTimeElapsed /
			this.videoFadeAnimation.duration;

		let easeProgress: number;
		let opacity: number;

		if (this.videoFadeAnimation.isFadeIn) {
			// Ease out animation for fade-in
			easeProgress = 1 - Math.pow(1 - progress, 3);
			opacity = easeProgress;
			sound.volume('yu-gi-oh_full_theme', 0.2 - easeProgress * 0.2); // Fade out the music
		} else {
			// Ease in animation for fade-out
			easeProgress = Math.pow(progress, 3);
			opacity = 1 - easeProgress;
			sound.volume('yu-gi-oh_full_theme', easeProgress * 0.2); // Bring music back
		}
		this.victoryVideoElement.style.opacity = opacity.toString();

		if (progress >= 1) {
			// Animation complete
			this.videoFadeAnimation.isActive = false;

			if (!this.videoFadeAnimation.isFadeIn) {
				// Fade-out complete, cleanup
				this.cleanupVictoryVideo();
			}
		}
	}

	private cleanupVictoryVideo(): void {
		if (this.victoryVideoElement) {
			this.victoryVideoElement.pause();
			this.victoryVideoElement.remove();
			this.victoryVideoElement = null;
		}
	}
}
