import { Application, Text, Container, Graphics } from "pixi.js";

export class FPSDisplay extends Container {
  private fpsText: Text;
  private background: Graphics;

  constructor(app: Application) {
    super();

    const width = 96;
    const height = 32;

    // BG
    this.background = new Graphics();
    this.background.beginFill("#cccccc", 1);
    this.background.drawRect(0, 0, width, height);
    this.background.endFill();
    this.addChild(this.background);

    // Text
    this.fpsText = new Text("FPS: 0", {
      fontFamily: "Arial, sans-serif",
      fontSize: 16,
      fill: 0x000000,
      fontWeight: "bold",
    });
    this.fpsText.anchor.set(0.5, 0.5);
    this.fpsText.x = width * 0.5;
    this.fpsText.y = height * 0.5;
    this.addChild(this.fpsText);

    app.ticker.add(() => this.update(app.ticker.deltaTime, app.ticker.FPS));
  }

  public update(_deltaTime: number, rawFPS: number): void {
    const fps = Math.round(rawFPS);
    this.fpsText.text = `FPS: ${fps}`;
  }
}
