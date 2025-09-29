import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class LoadingBar extends Container {
  private background!: Graphics;
  private fill!: Graphics;
  private progressText!: Text;
  private barWidth: number;
  private barHeight: number;

  constructor(width: number = 300, height: number = 20) {
    super();

    this.barWidth = width;
    this.barHeight = height;

    this.setupLoadingBar();
  }

  private setupLoadingBar(): void {
    // Background bar
    this.background = new Graphics();
    this.background.lineStyle(2, 0xffffff);
    this.background.beginFill(0x333333);
    this.background.drawRoundedRect(
      0,
      0,
      this.barWidth,
      this.barHeight,
      this.barHeight / 2
    );
    this.background.endFill();
    this.addChild(this.background);

    // Progress fill
    this.fill = new Graphics();
    this.fill.beginFill(0x00ff00);
    this.fill.drawRoundedRect(0, 0, 0, this.barHeight, this.barHeight / 2);
    this.fill.endFill();
    this.addChild(this.fill);

    // Progress text
    this.progressText = new Text(
      "0%",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 16,
        fill: 0xffffff,
        align: "center",
        fontWeight: "bold",
        stroke: 0x000000,
        strokeThickness: 2,
      })
    );
    this.progressText.anchor.set(0.5, 0.5);
    this.progressText.x = this.barWidth / 2;
    this.progressText.y = this.barHeight / 2;
    this.addChild(this.progressText);
  }

  public updateProgress(progress: number): void {
    // Clamp progress between 0 and 1
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Update fill width
    const fillWidth = this.barWidth * clampedProgress;
    this.fill.clear();
    this.fill.beginFill(0x00ff00);
    this.fill.drawRoundedRect(
      0,
      0,
      fillWidth,
      this.barHeight,
      this.barHeight / 2
    );
    this.fill.endFill();

    // Update text
    const percentage = Math.round(clampedProgress * 100);
    this.progressText.text = `${percentage}%`;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}
