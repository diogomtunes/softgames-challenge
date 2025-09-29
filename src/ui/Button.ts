import { Container, Graphics, Text, TextStyle } from "pixi.js";

export interface ButtonOptions {
  text?: string;
  emoji?: string;
  color: number;
  width?: number;
  height?: number;
  fontSize?: number;
  borderRadius?: number;
  onClick: () => void;
}

export class Button extends Container {
  private background: Graphics;
  private textElement?: Text;
  private emojiElement?: Text;
  private color: number;
  private buttonWidth: number;
  private buttonHeight: number;
  private borderRadius: number;

  constructor(options: ButtonOptions) {
    super();

    this.color = options.color;
    this.buttonWidth = options.width || 200;
    this.buttonHeight = options.height || 50;
    this.borderRadius = options.borderRadius || 10;

    this.interactive = true;
    (this as any).buttonMode = true;

    // Create button background
    this.background = new Graphics();
    this.drawBackground(this.color);
    this.addChild(this.background);

    // Create text if provided
    if (options.text) {
      this.textElement = new Text(
        options.text,
        new TextStyle({
          fontFamily: "Arial, sans-serif",
          fontSize: options.fontSize || 18,
          fill: 0xffffff,
          align: "center",
          fontWeight: "bold",
        })
      );
      this.textElement.anchor.set(0.5, 0.5);
      this.addChild(this.textElement);
    }

    // Create emoji if provided
    if (options.emoji) {
      this.emojiElement = new Text(
        options.emoji,
        new TextStyle({
          fontFamily: "Arial, sans-serif",
          fontSize: (options.fontSize || 18) * 1.2,
          align: "center",
        })
      );
      this.emojiElement.anchor.set(0.5, 0.5);
      this.addChild(this.emojiElement);
    }

    // Position elements
    this.positionElements();

    // Add hover effects
    this.on("pointerover", () => {
      // Calculate lighter color without overflow
      const r = Math.min(((this.color >> 16) & 0xff) + 0x33, 0xff);
      const g = Math.min(((this.color >> 8) & 0xff) + 0x33, 0xff);
      const b = Math.min((this.color & 0xff) + 0x33, 0xff);
      const lighterColor = (r << 16) | (g << 8) | b;

      this.drawBackground(lighterColor);
      this.scale.set(1.05);
    });

    this.on("pointerout", () => {
      this.drawBackground(this.color);
      this.scale.set(1);
    });

    this.on("pointerdown", () => {
      this.scale.set(0.95);
    });

    this.on("pointerup", () => {
      this.scale.set(1.05);
      options.onClick();
    });
  }

  private positionElements(): void {
    if (this.textElement && this.emojiElement) {
      // Both text and emoji - position emoji on both sides of text
      this.textElement.x = 0;
      this.textElement.y = 0;

      // Create a second emoji for the right side
      const rightEmoji = new Text(
        this.emojiElement.text,
        this.emojiElement.style
      );
      rightEmoji.anchor.set(0.5, 0.5);
      this.addChild(rightEmoji);

      // Position left emoji
      this.emojiElement.x = -this.textElement.width / 2 - 15;
      this.emojiElement.y = 0;

      // Position right emoji
      rightEmoji.x = this.textElement.width / 2 + 15;
      rightEmoji.y = 0;
    } else if (this.textElement) {
      // Only text - center it
      this.textElement.x = 0;
      this.textElement.y = 0;
    } else if (this.emojiElement) {
      // Only emoji - center it
      this.emojiElement.x = 0;
      this.emojiElement.y = 0;
    }
  }

  private drawBackground(fillColor: number): void {
    this.background.clear();
    this.background.lineStyle(2, 0xffffff);
    this.background.beginFill(fillColor);
    this.background.drawRoundedRect(
      -this.buttonWidth / 2,
      -this.buttonHeight / 2,
      this.buttonWidth,
      this.buttonHeight,
      this.borderRadius
    );
    this.background.endFill();
  }
}
