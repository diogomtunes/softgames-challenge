import { Container, Text, TextStyle } from "pixi.js";
import { LoadingBar } from "../ui/LoadingBar";

export class Loading extends Container {
  private loadingBar!: LoadingBar;
  private title!: Text;
  private subtitle!: Text;

  constructor() {
    super();

    this.setupUI();
    this.positionElements();
  }

  private setupUI(): void {
    // Title
    this.title = new Text(
      "Loading...",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 32,
        fill: 0xffffff,
        align: "center",
        fontWeight: "bold",
        stroke: 0x000000,
        strokeThickness: 4,
      })
    );
    this.title.anchor.set(0.5, 0.5);
    this.addChild(this.title);

    // Loading bar
    this.loadingBar = new LoadingBar(400, 30);
    this.addChild(this.loadingBar);

    // Subtitle
    this.subtitle = new Text(
      "Preparing your gaming experience",
      new TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 16,
        fill: 0xcccccc,
        align: "center",
        fontWeight: "bold",
        stroke: 0x000000,
        strokeThickness: 2,
      })
    );
    this.subtitle.anchor.set(0.5, 0.5);
    this.addChild(this.subtitle);
  }

  private positionElements(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    this.title.x = screenWidth / 2;
    this.title.y = screenHeight / 2 - 60;

    this.loadingBar.setPosition(screenWidth / 2 - 200, screenHeight / 2 - 15);

    this.subtitle.x = screenWidth / 2;
    this.subtitle.y = screenHeight / 2 + 40;
  }

  public updateProgress(progress: number): void {
    this.loadingBar.updateProgress(progress);
  }

  public onResize(): void {
    this.positionElements();
  }
}
