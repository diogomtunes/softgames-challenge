import {
	Container,
	Application,
	Assets,
	Text,
	TextStyle,
	// ParticleContainer, // Ended up not using this due to visual glitch problems
} from 'pixi.js';
import { Emitter } from '@pixi/particle-emitter';
import { Game } from '../core/Game';
import { isMobileDevice, isUsingHeight, scaled } from '../core/Utils';
import { sound } from '@pixi/sound';

/**
 * Interactive particle flame game with mouse/touch controls to intensify the flame.
 *
 * Implemented using https://particle-emitter.pixijs.io/docs/
 *
 * Interactive editor here: https://particle-emitter-editor.pixijs.io/#pixieDust
 *
 * Particle emitters taken from https://particle-emitter.pixijs.io/examples/flame.html
 *
 * Features two particle emitters (normal and intense) that can be switched by pressing the mouse / tap the screen.
 *
 * Has real-time particle count display.
 *
 * @extends Game
 */
export class PhoenixFlame extends Game {
	// UI Constants
	private readonly TITLE_FONT_SIZE_PORTRAIT = 40;
	private readonly TITLE_FONT_SIZE_LANDSCAPE = 48;
	private readonly PARTICLE_COUNT_FONT_SIZE = 32;
	private readonly EMITTER_Y_OFFSET = 100;
	private readonly TITLE_DROP_SHADOW_BLUR = 4;
	private readonly TITLE_DROP_SHADOW_DISTANCE = 2;
	private readonly PARTICLE_COUNT_DROP_SHADOW_BLUR = 2;
	private readonly PARTICLE_COUNT_DROP_SHADOW_DISTANCE = 1;
	private readonly PARTICLE_COUNT_X_OFFSET = 150;
	private readonly PARTICLE_COUNT_Y_OFFSET = 100;

	// UI Elements
	private particleContainer!: Container;
	private title!: Text;
	private particleCountText!: Text;

	// Particle System
	private normalEmitter: Emitter | null = null;
	private intenseEmitter: Emitter | null = null;
	private normalEmitterConfig: any;
	private intenseEmitterConfig: any;

	// Event Handlers
	private boundPointerMove: (event: PointerEvent) => void;
	private boundPointerDown: (event: PointerEvent) => void;
	private boundPointerUp: (event: PointerEvent) => void;

	constructor(
		app: Application,
		backgroundContainer: Container,
		foregroundContainer: Container
	) {
		super(app, backgroundContainer, foregroundContainer);

		this.boundPointerMove = (event: PointerEvent) =>
			this.onPointerMove(event);
		this.boundPointerDown = (event: PointerEvent) =>
			this.onPointerDown(event);
		this.boundPointerUp = (event: PointerEvent) => this.onPointerUp(event);
	}

	private loadTexturesForConfig(config: any): void {
		const textureRandomBehavior = config.behaviors.find(
			(b: any) => b.type === 'textureRandom'
		);

		if (textureRandomBehavior && textureRandomBehavior.config.textures) {
			const texturePaths = textureRandomBehavior.config.textures;
			const loadedTextures = [];

			for (const texturePath of texturePaths) {
				const fullPath = `assets/particles/${texturePath}`;
				const texture = Assets.get(fullPath);
				if (texture) {
					loadedTextures.push(texture);
				} else {
					console.error(`Texture not found in cache: ${fullPath}`);
				}
			}

			// Replace the string paths with loaded PIXI Texture objects for the emitters to use
			textureRandomBehavior.config.textures = loadedTextures;
		}
	}

	private loadParticleTextures(): void {
		const originalNormalConfig = Assets.cache.get('particle-config-flame');
		const originalIntenseConfig = Assets.cache.get(
			'particle-config-flame_hotter'
		);

		// Create deep copies of the configurations to avoid modifying the cached originals
		this.normalEmitterConfig = JSON.parse(
			JSON.stringify(originalNormalConfig)
		);
		this.intenseEmitterConfig = JSON.parse(
			JSON.stringify(originalIntenseConfig)
		);

		const position = {
			x: this.app.screen.width * 0.5,
			y: this.app.screen.height - scaled(this.EMITTER_Y_OFFSET),
		};

		this.normalEmitterConfig.pos = position;
		this.intenseEmitterConfig.pos = position;

		// Enforce 10 particle limit as per assignment requirements
		// Note: Only for the normal emitter, not the intense emitter
		this.normalEmitterConfig.maxParticles = 10;

		this.loadTexturesForConfig(this.normalEmitterConfig);
		this.loadTexturesForConfig(this.intenseEmitterConfig);
	}

	private createEmitters(): void {
		this.normalEmitter = new Emitter(
			this.particleContainer,
			this.normalEmitterConfig
		);
		this.intenseEmitter = new Emitter(
			this.particleContainer,
			this.intenseEmitterConfig
		);
		this.normalEmitter.emit = true;
		this.intenseEmitter.emit = false;
	}

	public initialize(): void {
		this.loadParticleTextures();
	}

	public addEventListeners(): void {
		window.addEventListener('pointermove', this.boundPointerMove);
		window.addEventListener('pointerdown', this.boundPointerDown);
		window.addEventListener('pointerup', this.boundPointerUp);
	}

	public buildBackground(): void {
		// No background needed for PhoenixFlame - particles are the main visual
	}

	public buildForeground(): void {
		// Create particle container with all dynamic properties enabled
		// this.particleContainer = new ParticleContainer(
		//   2000,
		//   {
		//     vertices: true,
		//     position: true,
		//     rotation: true,
		//     uvs: true,
		//     tint: true,
		//     alpha: true,
		//     scale: true,
		//   },
		//   undefined,
		//   true
		// );
		// this.particleContainer.roundPixels = false;

		// Use regular container for particle emitters (better compatibility)
		this.particleContainer = new Container();
		this.foregroundContainer.addChild(this.particleContainer);

		// Title
		this.title = new Text(
			'',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fill: 0xffffff,
				align: 'center',
				fontWeight: 'bold',
				dropShadow: true,
				dropShadowColor: 0x000000,
				dropShadowAngle: Math.PI / 6,
			})
		);
		this.title.anchor.set(0.5, 0.5);
		this.foregroundContainer.addChild(this.title);

		// Particle count
		this.particleCountText = new Text(
			'',
			new TextStyle({
				fontFamily: 'Arial, sans-serif',
				fill: 0xffffff,
				align: 'left',
				fontWeight: 'normal',
				dropShadow: true,
				dropShadowColor: 0x000000,
				dropShadowAngle: Math.PI / 6,
			})
		);
		this.particleCountText.anchor.set(0, 0.5);
		this.foregroundContainer.addChild(this.particleCountText);

		// Emitters
		this.createEmitters();
	}

	public update(deltaTime: number): void {
		if (this.normalEmitter) {
			this.normalEmitter.update(deltaTime * 0.01);
		}
		if (this.intenseEmitter) {
			this.intenseEmitter.update(deltaTime * 0.01);
		}

		this.updateParticleCount();
	}

	public start(): void {
		this.app.ticker.add(this.update, this);
		sound.play('fireplace');
	}

	public onResize(): void {
		// Title
		// Note: this could use a dynamic max text width to wrap, but using the hard coded \n placement makes it visually cleaner
		this.title.text = isMobileDevice()
			? `Press screen ${isUsingHeight() ? '\n' : ' '}to intensify the flame`
			: `Hold the left mouse button ${
					isUsingHeight() ? '\n' : ' '
				}to intensify the flame`;

		this.title.style.fontSize = scaled(
			isUsingHeight()
				? this.TITLE_FONT_SIZE_PORTRAIT
				: this.TITLE_FONT_SIZE_LANDSCAPE
		);
		this.title.style.dropShadowBlur = scaled(this.TITLE_DROP_SHADOW_BLUR);
		this.title.style.dropShadowDistance = scaled(
			this.TITLE_DROP_SHADOW_DISTANCE
		);
		this.title.x = this.app.screen.width * 0.5;
		this.title.y = this.app.screen.height * 0.2;

		// Particle count
		this.particleCountText.style.fontSize = scaled(
			this.PARTICLE_COUNT_FONT_SIZE
		);
		this.particleCountText.style.dropShadowBlur = scaled(
			this.PARTICLE_COUNT_DROP_SHADOW_BLUR
		);
		this.particleCountText.style.dropShadowDistance = scaled(
			this.PARTICLE_COUNT_DROP_SHADOW_DISTANCE
		);
		this.particleCountText.x =
			this.app.screen.width * 0.5 - scaled(this.PARTICLE_COUNT_X_OFFSET);
		this.particleCountText.y =
			this.app.screen.height * 0.2 + scaled(this.PARTICLE_COUNT_Y_OFFSET);

		const position = {
			x: this.app.screen.width * 0.5,
			y: this.app.screen.height - scaled(this.EMITTER_Y_OFFSET),
		};

		if (this.normalEmitter) {
			this.normalEmitter.updateSpawnPos(position.x, position.y);
		}
		if (this.intenseEmitter) {
			this.intenseEmitter.updateSpawnPos(position.x, position.y);
		}
	}

	private updateParticleCount(): void {
		let particleCount = 0;

		// Get total particle count from both emitters, regardless of which is emitting
		if (this.normalEmitter) {
			particleCount += this.normalEmitter.particleCount;
		}
		if (this.intenseEmitter) {
			particleCount += this.intenseEmitter.particleCount;
		}

		this.particleCountText.text = `Particle count: ${particleCount}`;
	}

	private onPointerMove(event: PointerEvent): void {
		this.updateEmitterPosition(event.x, event.y);
	}

	private onPointerDown(_event: PointerEvent): void {
		this.intensifyFlame();
	}

	private onPointerUp(_event: PointerEvent): void {
		this.normalizeFlame();
	}

	private updateEmitterPosition(newX: number, newY: number): void {
		if (this.normalEmitter) {
			this.normalEmitter.updateSpawnPos(newX, newY);
		}
		if (this.intenseEmitter) {
			this.intenseEmitter.updateSpawnPos(newX, newY);
		}
	}

	private intensifyFlame(): void {
		sound.play('flame_on');
		sound.volume('fireplace', 1);
		if (this.normalEmitter) {
			this.normalEmitter.emit = false;
		}
		if (this.intenseEmitter) {
			this.intenseEmitter.emit = true;
		}
	}

	private normalizeFlame(): void {
		sound.volume('fireplace', 0.5);
		if (this.normalEmitter) {
			this.normalEmitter.emit = true;
		}
		if (this.intenseEmitter) {
			this.intenseEmitter.emit = false;
		}
	}

	public removeEventListeners(): void {
		window.removeEventListener('pointermove', this.boundPointerMove);
		window.removeEventListener('pointerdown', this.boundPointerDown);
		window.removeEventListener('pointerup', this.boundPointerUp);
	}

	public destroy(): void {
		sound.stop('fireplace');
		sound.stop('flame_on');
		if (this.normalEmitter) {
			this.normalEmitter.destroy();
		}
		if (this.intenseEmitter) {
			this.intenseEmitter.destroy();
		}
	}
}
