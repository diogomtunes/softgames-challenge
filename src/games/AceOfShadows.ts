import { Container, Application, Sprite } from "pixi.js";
import { GameManager } from "../core/GameManager";
import { Button } from "../ui/Button";

interface Card {
  sprite: Sprite;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  moveStartTime: number;
  stackIndex: number;
  targetRotation: number;
}

export class AceOfShadows extends Container {
  private gameManager: GameManager;
  private backButton!: Button;
  private hurryUpButton!: Button;
  private app: Application;
  private background!: Sprite;
  private topDuelDisk!: Sprite;
  private bottomDuelDisk!: Sprite;
  private cards: Card[] = [];
  private topStack: Card[] = [];
  private bottomStack: Card[] = [];
  private mainStack: Card[] = [];
  private lastMoveTime: number = 0;
  private moveInterval: number = 1000; // 1 second
  private animationDuration: number = 2000; // 2 seconds
  private currentTarget: "top" | "bottom" = "top";

  // Speed boost properties
  private originalMoveInterval: number = 1000;
  private originalAnimationDuration: number = 2000;

  private duelDiskYBorderOffset = 150;
  private baseScreenWidth = 1920; // Reference screen width for scaling
  private baseScreenHeight = 1080; // Reference screen height for scaling

  // End positions for card deck holders (adjustable)
  private topEndPosition = { x: 0, y: 0 };
  private bottomEndPosition = { x: 0, y: 0 };

  constructor(gameManager: GameManager) {
    super();
    this.gameManager = gameManager;
    this.app = gameManager.getApp();
    this.setupBackground();
    this.setupUI();
    this.createCards();
    this.startCardDealing();
  }

  private getResponsiveScale(): number {
    // Calculate scale based on screen size relative to base dimensions
    const scaleX = this.app.screen.width / this.baseScreenWidth;
    const scaleY = this.app.screen.height / this.baseScreenHeight;
    // Use the smaller scale to ensure the duel disk fits on screen
    return Math.min(scaleX, scaleY) * 0.3; // Base scale of 0.3
  }

  private setupBackground(): void {
    // Create background sprite
    this.background = Sprite.from("assets/street.png");
    this.background.width = this.app.screen.width;
    this.background.height = this.app.screen.height;
    this.addChild(this.background);

    // Create top duel disk (rotated 180 degrees to face opponent)
    this.topDuelDisk = Sprite.from("assets/duel_disk.png");
    this.topDuelDisk.anchor.set(0.5, 0.5);
    this.topDuelDisk.x = this.app.screen.width / 2;
    this.topDuelDisk.y = this.duelDiskYBorderOffset; // Position at top
    this.topDuelDisk.scale.set(this.getResponsiveScale()); // Responsive scale
    this.topDuelDisk.rotation = Math.PI; // Rotate 180 degrees
    this.addChild(this.topDuelDisk);

    // Create bottom duel disk
    this.bottomDuelDisk = Sprite.from("assets/duel_disk.png");
    this.bottomDuelDisk.anchor.set(0.5, 0.5);
    this.bottomDuelDisk.x = this.app.screen.width / 2;
    this.bottomDuelDisk.y = this.app.screen.height - this.duelDiskYBorderOffset; // Position at bottom
    this.bottomDuelDisk.scale.set(this.getResponsiveScale()); // Responsive scale
    this.addChild(this.bottomDuelDisk);

    // Calculate end positions after duel disks are created and positioned
    this.updateEndPositions();
  }

  private updateEndPositions(): void {
    // Calculate end positions relative to duel disk image dimensions
    // Position at 0.3*width and 0.6*height from the center of each duel disk

    // Get the duel disk texture dimensions
    const hardcodedWidth = 1445;
    const hardcodedHeight = 981;
    const scale = this.topDuelDisk.scale.x;
    const duelDiskWidth = hardcodedWidth * scale;
    const duelDiskHeight = hardcodedHeight * scale;

    // Calculate offset from duel disk center (0.5*width, 0.6*height)

    const offsetX = duelDiskWidth * 0.24;
    const offsetY = duelDiskHeight * 0.22;

    // Top duel disk end position
    this.topEndPosition.x = this.topDuelDisk.x + offsetX;
    this.topEndPosition.y = this.topDuelDisk.y + offsetY;

    // Bottom duel disk end position (flip the Y offset since it's rotated)
    this.bottomEndPosition.x = this.bottomDuelDisk.x - offsetX;
    this.bottomEndPosition.y = this.bottomDuelDisk.y - offsetY;
  }

  private updateCardScales(): void {
    const cardScale = this.getResponsiveScale() * 0.8; // Scale cards relative to duel disk scale
    this.cards.forEach((card) => {
      card.sprite.scale.set(cardScale);
    });
  }

  private setupUI(): void {
    // Create back button in top right corner
    this.backButton = new Button({
      emoji: "🏠",
      color: 0xffd700, // Golden color
      width: 60,
      height: 40,
      fontSize: 20,
      borderRadius: 8,
      onClick: () => this.gameManager.backToMainMenu(),
    });

    // Position in top right corner
    this.backButton.x = this.app.screen.width - 100;
    this.backButton.y = 60;
    this.addChild(this.backButton);

    // Create hurry up button
    this.hurryUpButton = new Button({
      text: "Hurry up!",
      color: 0xff6b35, // Orange color for urgency
      width: 120,
      height: 50,
      fontSize: 16,
      borderRadius: 8,
      onClick: () => this.toggleSpeedBoost(),
    });

    // Position on the right side of the center stack
    this.hurryUpButton.x = this.app.screen.width / 2 + 200;
    this.hurryUpButton.y = this.app.screen.height / 2;
    this.addChild(this.hurryUpButton);
  }

  private toggleSpeedBoost(): void {
    // Apply speed boost and delete the button
    this.moveInterval = this.originalMoveInterval * 0.01;
    this.animationDuration = this.originalAnimationDuration * 0.1;

    // Remove the button from the scene
    this.removeChild(this.hurryUpButton);
    this.hurryUpButton.destroy();
  }

  private createCards(): void {
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    const cardScale = this.getResponsiveScale() * 0.75; // Scale cards relative to duel disk scale

    // Create 144 cards arranged in a random pile
    for (let i = 0; i < 144; i++) {
      const card = Sprite.from("assets/yu-gi-oh_small.png");

      // Set card properties
      card.anchor.set(0.5, 0.5);
      card.scale.set(cardScale);

      // Random position within a circular area (like cards randomly piled)
      const maxRadius = 30;
      const randomRadius = Math.random() * maxRadius;
      const randomAngle = Math.random() * Math.PI * 2;

      const x = centerX + Math.cos(randomAngle) * randomRadius;
      const y = centerY + Math.sin(randomAngle) * randomRadius;

      card.x = x;
      card.y = y;

      // Add random rotation
      card.rotation = Math.random() * Math.PI * 2; // Random rotation

      const cardData: Card = {
        sprite: card,
        x: card.x,
        y: card.y,
        targetX: card.x,
        targetY: card.y,
        isMoving: false,
        moveStartTime: 0,
        stackIndex: i,
        targetRotation: card.rotation,
      };

      this.cards.push(cardData);
      this.mainStack.push(cardData);
      this.addChild(card);
    }
  }

  private startCardDealing(): void {
    this.app.ticker.add(this.updateCards, this);
  }

  private updateCards(): void {
    const currentTime = Date.now();

    // Check if it's time to move the next card
    if (
      currentTime - this.lastMoveTime >= this.moveInterval &&
      this.mainStack.length > 0
    ) {
      this.moveTopCard();
      this.lastMoveTime = currentTime;
    }

    // Update moving cards
    this.cards.forEach((card) => {
      if (card.isMoving) {
        const elapsed = currentTime - card.moveStartTime;
        const progress = Math.min(elapsed / this.animationDuration, 1);

        // Ease out animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Get initial values
        const initialX = (card as any).initialX || card.sprite.x;
        const initialY = (card as any).initialY || card.sprite.y;
        const initialRotation =
          (card as any).initialRotation || card.sprite.rotation;

        // Update position using initial position as starting point
        card.x = initialX + (card.targetX - initialX) * easeProgress;
        card.y = initialY + (card.targetY - initialY) * easeProgress;

        card.sprite.x = card.x;
        card.sprite.y = card.y;

        // Smoothly rotate from initial rotation to target rotation (0 degrees)
        const rotationDiff = card.targetRotation - initialRotation;
        card.sprite.rotation = initialRotation + rotationDiff * easeProgress;

        // Check if animation is complete
        if (progress >= 1) {
          card.isMoving = false;
          card.x = card.targetX;
          card.y = card.targetY;
          card.sprite.x = card.x;
          card.sprite.y = card.y;
          card.sprite.rotation = card.targetRotation; // Ensure final rotation is exactly 0
        }
      }
    });
  }

  private moveTopCard(): void {
    if (this.mainStack.length === 0) return;

    const topCard = this.mainStack[this.mainStack.length - 1];
    this.mainStack.pop();

    // Determine target stack
    const targetStack =
      this.currentTarget === "top" ? this.topStack : this.bottomStack;
    this.currentTarget = this.currentTarget === "top" ? "bottom" : "top";

    // Calculate target position using the end position variables
    const endPosition =
      this.currentTarget === "top"
        ? this.topEndPosition
        : this.bottomEndPosition;
    const stackX =
      endPosition.x +
      targetStack.length * 0.05 * (this.currentTarget === "top" ? -1 : 1); // Add a small offset to give illusion of deck size
    const stackY =
      endPosition.y +
      targetStack.length * 0.05 * (this.currentTarget === "top" ? -1 : 1); // Add a small offset to give illusion of deck size

    // Store initial position and rotation for smooth animation
    const initialX = topCard.sprite.x;
    const initialY = topCard.sprite.y;
    const initialRotation = topCard.sprite.rotation;

    // Set up card movement
    topCard.targetX = stackX;
    topCard.targetY = stackY;
    topCard.isMoving = true;
    topCard.moveStartTime = Date.now();
    topCard.targetRotation = 0; // Target is 0 degrees (straight)

    // Store initial values for the animation
    (topCard as any).initialX = initialX;
    (topCard as any).initialY = initialY;
    (topCard as any).initialRotation = initialRotation;

    // Add to target stack
    targetStack.push(topCard);
  }

  public onResize(): void {
    // Resize background
    this.background.width = this.app.screen.width;
    this.background.height = this.app.screen.height;

    // Reposition and rescale duel disks
    this.topDuelDisk.x = this.app.screen.width / 2;
    this.topDuelDisk.y = this.duelDiskYBorderOffset;
    this.topDuelDisk.scale.set(this.getResponsiveScale());

    this.bottomDuelDisk.x = this.app.screen.width / 2;
    this.bottomDuelDisk.y = this.app.screen.height - this.duelDiskYBorderOffset;
    this.bottomDuelDisk.scale.set(this.getResponsiveScale());

    // Update end positions after repositioning and rescaling duel disks
    this.updateEndPositions();

    // Update card scales to match the new screen size
    this.updateCardScales();

    // Reposition back button in top right corner
    this.backButton.x = this.app.screen.width - 100;
    this.backButton.y = 60;

    // Reposition hurry up button (if it still exists)
    if (this.hurryUpButton && this.hurryUpButton.parent) {
      this.hurryUpButton.x = this.app.screen.width / 2 + 200;
      this.hurryUpButton.y = this.app.screen.height / 2;
    }
  }

  public destroy(): void {
    // Clean up ticker
    this.app.ticker.remove(this.updateCards, this);

    // Destroy all cards
    this.cards.forEach((card) => {
      card.sprite.destroy();
    });
    this.cards = [];
    this.topStack = [];
    this.bottomStack = [];
    this.mainStack = [];

    // Destroy sprites
    if (this.background) this.background.destroy();
    if (this.topDuelDisk) this.topDuelDisk.destroy();
    if (this.bottomDuelDisk) this.bottomDuelDisk.destroy();

    super.destroy();
  }
}
