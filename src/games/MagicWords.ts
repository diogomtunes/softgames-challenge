import {
  Container,
  Text,
  TextStyle,
  Sprite,
  Texture,
  Graphics,
  Application,
  Assets,
} from "pixi.js";
import { GameManager } from "../core/GameManager";
import { Button } from "../ui/Button";

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

export class MagicWords extends Container {
  private gameManager: GameManager;
  private backButton!: Button;
  private app: Application;
  private background!: Sprite;
  private darkOverlay!: Graphics;
  private dialogueBanner!: Graphics;
  private characterPortrait!: Sprite;
  private characterNameText!: Text;
  private dialogueText!: Text;
  private continueIndicator!: Text;
  private dialogueData: DialogueData | null = null;
  private currentDialogueIndex: number = 0;
  private emojiMap: Map<string, Texture> = new Map();
  private avatarMap: Map<string, Texture> = new Map();
  private isDialogueComplete: boolean = false;
  private animationTime: number = 0;

  constructor(gameManager: GameManager) {
    super();
    this.gameManager = gameManager;
    this.app = gameManager.getApp();
    this.setupBackground();
    this.setupUI();
    this.loadDialogueData();
  }

  private setupBackground(): void {
    // Create background sprite
    this.background = Sprite.from("assets/neighbourhood.jpg");
    this.background.width = this.app.screen.width;
    this.background.height = this.app.screen.height;
    this.addChild(this.background);

    // Create dark overlay (initially transparent)
    this.darkOverlay = new Graphics();
    this.darkOverlay.beginFill(0x000000, 0);
    this.darkOverlay.drawRect(
      0,
      0,
      this.app.screen.width,
      this.app.screen.height
    );
    this.darkOverlay.endFill();
    this.addChild(this.darkOverlay);

    // Start the animation sequence after 1 second
    setTimeout(() => {
      this.startAnimationSequence();
    }, 1000);
  }

  private startAnimationSequence(): void {
    // Start the darkening animation over 0.5 seconds
    this.app.ticker.add(this.animateDarkening, this);
  }

  private animateDarkening = (): void => {
    this.animationTime += this.app.ticker.deltaMS;
    const progress = Math.min(this.animationTime / 500, 1); // 0.5 seconds

    // Darken the overlay
    this.darkOverlay.clear();
    this.darkOverlay.beginFill(0x000000, progress * 0.3); // 30% opacity max
    this.darkOverlay.drawRect(
      0,
      0,
      this.app.screen.width,
      this.app.screen.height
    );
    this.darkOverlay.endFill();

    if (progress >= 1) {
      // Animation complete, create UI elements
      this.app.ticker.remove(this.animateDarkening, this);
      this.createDialogueUI();
    }
  };

  private createDialogueUI(): void {
    // Create grey banner covering bottom 40% of the page (initially transparent)
    this.dialogueBanner = new Graphics();
    this.dialogueBanner.beginFill(0x404040, 0);
    this.dialogueBanner.drawRect(
      0,
      this.app.screen.height * 0.6,
      this.app.screen.width,
      this.app.screen.height * 0.4
    );
    this.dialogueBanner.endFill();
    this.addChild(this.dialogueBanner);

    // Start banner fade-in animation
    this.animationTime = 0;
    this.app.ticker.add(this.animateBannerFadeIn, this);

    // Create character portrait (initially hidden)
    this.characterPortrait = new Sprite();
    this.characterPortrait.anchor.set(0.5, 1);
    this.characterPortrait.x = this.app.screen.width / 2;
    this.characterPortrait.y = this.app.screen.height * 0.6;
    this.characterPortrait.scale.set(2); // Larger scale
    this.characterPortrait.visible = false;
    this.addChild(this.characterPortrait);

    // Create character name text
    this.characterNameText = new Text(
      "",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 48,
        fill: 0xffffff,
        align: "left",
        fontWeight: "bold",
      })
    );
    this.characterNameText.x = 50;
    this.characterNameText.y = this.app.screen.height * 0.6 + 10;
    this.addChild(this.characterNameText);

    // Create dialogue text
    this.dialogueText = new Text(
      "",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 32,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: this.app.screen.width - 100,
        align: "left",
      })
    );
    this.dialogueText.x = 50;
    this.dialogueText.y = this.app.screen.height * 0.6 + 60; // 10px (name position) + 48px (name height) + 2px (padding)
    this.addChild(this.dialogueText);

    // Create continue indicator
    this.continueIndicator = new Text(
      "▼",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 24,
        fill: 0xffffff,
      })
    );
    this.continueIndicator.anchor.set(1, 1);
    this.continueIndicator.x = this.app.screen.width - 30;
    this.continueIndicator.y = this.app.screen.height - 30;
    this.addChild(this.continueIndicator);

    // Start the continue indicator animation
    this.app.ticker.add(this.animateContinueIndicator, this);

    // Make the entire screen clickable for dialogue advancement
    this.interactive = true;
    this.on("pointerdown", this.advanceDialogue);
  }

  private animateBannerFadeIn = (): void => {
    this.animationTime += this.app.ticker.deltaMS;
    const progress = Math.min(this.animationTime / 500, 1); // 0.5 seconds

    // Fade in the banner
    this.dialogueBanner.clear();
    this.dialogueBanner.beginFill(0x404040, progress * 0.9);
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
      this.startDialogue();
    }
  };

  private animateContinueIndicator = (): void => {
    // Animate the continue indicator up and down
    const time = Date.now() * 0.003;
    const movement = Math.sin(time) * 5;
    this.continueIndicator.y = this.app.screen.height - 30 + movement;

    // Sync blinking with movement: opaque at top, transparent at bottom
    // Convert movement range (-5 to +5) to alpha range (1.0 to 0.6)
    const normalizedMovement = (movement + 5) / 10; // 0 to 1
    this.continueIndicator.alpha = 0.6 + 0.4 * normalizedMovement;
  };

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
  }

  private advanceDialogue = (): void => {
    if (this.isDialogueComplete) {
      // Remove completion text
      const completionText = this.getChildByName("completionText");
      if (completionText) {
        this.removeChild(completionText);
        completionText.destroy();
      }

      // Restart dialogue
      this.currentDialogueIndex = 0;
      this.isDialogueComplete = false;
      this.showCurrentDialogue();
    } else {
      // Advance to next dialogue
      this.nextDialogue();
    }
  };

  private async loadDialogueData(): Promise<void> {
    try {
      const response = await fetch("dialogue/magicwords.json");
      this.dialogueData = await response.json();

      // Load emoji textures
      await this.loadEmojiTextures();

      // Load avatar textures
      await this.loadAvatarTextures();

      // Dialogue will start automatically after banner animation completes
      console.log("Dialogue data loaded successfully");
    } catch (error) {
      console.error("Failed to load dialogue data:", error);
      this.showError();
    }
  }

  private async loadEmojiTextures(): Promise<void> {
    if (!this.dialogueData) return;

    for (const emoji of this.dialogueData.emojies) {
      try {
        const texture = await Texture.fromURL(emoji.url);
        this.emojiMap.set(emoji.name, texture);
      } catch (error) {
        console.error(`Failed to load emoji ${emoji.name}:`, error);
      }
    }
  }

  private async loadAvatarTextures(): Promise<void> {
    if (!this.dialogueData) return;

    for (const avatar of this.dialogueData.avatars) {
      try {
        const texture = await Texture.fromURL(avatar.url);
        this.avatarMap.set(avatar.name, texture);
      } catch (error) {
        console.error(`Failed to load avatar ${avatar.name}:`, error);
      }
    }
  }

  private startDialogue(): void {
    if (!this.dialogueData) {
      console.log("Dialogue data not loaded yet, waiting...");
      return;
    }

    this.currentDialogueIndex = 0;
    this.showCurrentDialogue();
  }

  private showCurrentDialogue(): void {
    if (
      !this.dialogueData ||
      this.currentDialogueIndex >= this.dialogueData.dialogue.length
    ) {
      this.showDialogueComplete();
      return;
    }

    const dialogueEntry = this.dialogueData.dialogue[this.currentDialogueIndex];

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

      // Position based on character position from dialogue data
      const avatarData = this.dialogueData?.avatars.find(
        (a) => a.name === characterName
      );
      if (avatarData?.position === "left") {
        this.characterPortrait.x = this.app.screen.width * 0.2; // Left side
      } else {
        this.characterPortrait.x = this.app.screen.width * 0.8; // Right side
      }
    } else {
      // Use unknown.png for characters without portraits, default to right side
      Assets.load("assets/unknown.png")
        .then((texture: Texture) => {
          this.characterPortrait.texture = texture;
          this.characterPortrait.visible = true;
          this.characterPortrait.x = this.app.screen.width * 0.8; // Default to right side
        })
        .catch(() => {
          // If unknown.png fails to load, hide the portrait
          this.characterPortrait.visible = false;
        });
    }
  }

  private showDialogueText(text: string): void {
    // Clear previous text elements
    this.dialogueText.text = "";

    // Parse text for emojis
    const parts = this.parseTextWithEmojis(text);

    // Create a container for rich text display
    const textContainer = new Container();
    textContainer.x = 50;
    textContainer.y = this.app.screen.height * 0.6 + 100; // Match dialogue text position
    this.addChild(textContainer);

    // Remove any existing text container
    const existingContainer = this.getChildByName("dialogueTextContainer");
    if (existingContainer) {
      this.removeChild(existingContainer);
      existingContainer.destroy();
    }

    textContainer.name = "dialogueTextContainer";

    let currentX = 0;
    let currentY = 0;
    const lineHeight = 40;
    const maxWidth = this.app.screen.width - 100;

    parts.forEach((part) => {
      if (part.type === "text") {
        // Create text element
        const textElement = new Text(
          part.content,
          new TextStyle({
            fontFamily: "Arial, sans-serif",
            fontSize: 32,
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: maxWidth - currentX,
            align: "left",
          })
        );

        textElement.x = currentX;
        textElement.y = currentY;
        textContainer.addChild(textElement);

        // Update position for next element with spacing
        currentX += textElement.width + 8; // Add spacing after text

        // Check if we need to wrap to next line
        if (currentX > maxWidth - 50) {
          currentX = 0;
          currentY += lineHeight;
        }
      } else if (part.type === "emoji") {
        // Create emoji sprite
        const emojiTexture = this.emojiMap.get(part.content);
        if (emojiTexture) {
          const emoji = new Sprite(emojiTexture);
          emoji.scale.set(0.4); // Slightly larger emoji
          emoji.anchor.set(0.5, 0.5);
          emoji.x = currentX + 20;
          emoji.y = currentY + 16;
          textContainer.addChild(emoji);

          currentX += 40 + 8; // Emoji width + spacing after emoji

          // Check if we need to wrap to next line
          if (currentX > maxWidth - 50) {
            currentX = 0;
            currentY += lineHeight;
          }
        } else {
          // Fallback for missing emojis - show replacement character
          const fallbackText = new Text(
            "�",
            new TextStyle({
              fontFamily: "Arial, sans-serif",
              fontSize: 32,
              fill: 0xffffff,
              align: "left",
            })
          );
          fallbackText.x = currentX;
          fallbackText.y = currentY;
          textContainer.addChild(fallbackText);

          currentX += fallbackText.width + 8; // Fallback width + spacing

          // Check if we need to wrap to next line
          if (currentX > maxWidth - 50) {
            currentX = 0;
            currentY += lineHeight;
          }
        }
      }
    });
  }

  private parseTextWithEmojis(
    text: string
  ): Array<{ type: "text" | "emoji"; content: string }> {
    const parts: Array<{ type: "text" | "emoji"; content: string }> = [];
    const emojiRegex = /\{([^}]+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = emojiRegex.exec(text)) !== null) {
      // Add text before emoji
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }

      // Add emoji
      parts.push({
        type: "emoji",
        content: match[1],
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return parts;
  }

  private nextDialogue(): void {
    this.currentDialogueIndex++;
    this.showCurrentDialogue();
  }

  private showDialogueComplete(): void {
    this.characterPortrait.visible = false;
    this.characterNameText.text = "";
    this.isDialogueComplete = true;

    // Remove any existing text container
    const existingContainer = this.getChildByName("dialogueTextContainer");
    if (existingContainer) {
      this.removeChild(existingContainer);
      existingContainer.destroy();
    }

    // Create centered completion message
    const completionText = new Text(
      "Dialogue Complete!\nClick to restart",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 28,
        fill: 0xffffff,
        align: "center",
        fontWeight: "bold",
      })
    );
    completionText.anchor.set(0.5, 0.5);
    completionText.x = this.app.screen.width / 2;
    completionText.y =
      this.app.screen.height * 0.6 + (this.app.screen.height * 0.4) / 2;
    completionText.name = "completionText";
    this.addChild(completionText);
  }

  private showError(): void {
    const errorText = new Text(
      "Failed to load dialogue data",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 24,
        fill: 0xff0000,
        align: "center",
        fontWeight: "bold",
      })
    );
    errorText.anchor.set(0.5, 0.5);
    errorText.x = this.app.screen.width / 2;
    errorText.y = this.app.screen.height / 2;
    this.addChild(errorText);
  }

  public onResize(): void {
    // Resize background
    this.background.width = this.app.screen.width;
    this.background.height = this.app.screen.height;

    // Update dark overlay
    this.darkOverlay.clear();
    this.darkOverlay.beginFill(0x000000, 0.3);
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
      this.dialogueBanner.beginFill(0x404040, 0.9);
      this.dialogueBanner.drawRect(
        0,
        this.app.screen.height * 0.6,
        this.app.screen.width,
        this.app.screen.height * 0.4
      );
      this.dialogueBanner.endFill();
    }

    // Reposition character portrait
    if (this.characterPortrait && this.characterPortrait.visible) {
      // Recalculate position based on current dialogue
      if (
        this.dialogueData &&
        this.currentDialogueIndex < this.dialogueData.dialogue.length
      ) {
        const currentDialogue =
          this.dialogueData.dialogue[this.currentDialogueIndex];
        const avatarData = this.dialogueData.avatars.find(
          (a) => a.name === currentDialogue.name
        );
        if (avatarData?.position === "left") {
          this.characterPortrait.x = this.app.screen.width * 0.2;
        } else {
          // Default to right side for unknown characters or right-positioned characters
          this.characterPortrait.x = this.app.screen.width * 0.8;
        }
      }
      this.characterPortrait.y = this.app.screen.height * 0.6;
    }

    // Reposition character name text
    if (this.characterNameText) {
      this.characterNameText.x = 50;
      this.characterNameText.y = this.app.screen.height * 0.6 + 10;
    }

    // Reposition dialogue text container
    const textContainer = this.getChildByName("dialogueTextContainer");
    if (textContainer) {
      textContainer.x = 50;
      textContainer.y = this.app.screen.height * 0.6 + 60;
    }

    // Reposition completion text
    const completionText = this.getChildByName("completionText");
    if (completionText) {
      completionText.x = this.app.screen.width / 2;
      completionText.y =
        this.app.screen.height * 0.6 + (this.app.screen.height * 0.4) / 2;
    }

    // Reposition continue indicator
    if (this.continueIndicator) {
      this.continueIndicator.x = this.app.screen.width - 30;
      this.continueIndicator.y = this.app.screen.height - 30;
    }

    // Reposition back button in top right corner
    this.backButton.x = this.app.screen.width - 100;
    this.backButton.y = 60;
  }
}
