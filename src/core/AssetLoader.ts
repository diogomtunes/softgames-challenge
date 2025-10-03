import { Assets, Texture } from 'pixi.js';
import { LoadingScreen } from '../scenes/LoadingScreen';
import { convertUrlToBase64 } from './Utils';
import { sound } from '@pixi/sound';

type AssetList = string[];

const regularAssets: AssetList = [
	// Main Menu
	'assets/sprites/softgames_logo.png',
	// Ace of Shadows
	'assets/sprites/yu-gi-oh_small.png',
	'assets/sprites/duel_disk.png',
	'assets/sprites/duel_disk_card_holder.png',
	'assets/sprites/street.jpg',
	// Magic Words
	'assets/sprites/neighbourhood.jpg',
	'assets/sprites/unknown.png',
];

const backgroundVideoAssets: AssetList = ['assets/videos/space.mp4'];

const dialogueAssets: AssetList = [
	// 'dialogue/magicwords.json',
	'https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords',
];

const particleConfigAssets: AssetList = [
	'assets/particles/flame.json',
	'assets/particles/flame_hotter.json',
];

const audioAssets: AssetList = [
	// Ace of Shadows
	'assets/audio/deal_1.mp3',
	'assets/audio/deal_2.mp3',
	'assets/audio/card_flip.mp3', // UNUSED
	'assets/audio/yu-gi-oh_full_theme.mp3',
	// Magic Words
	'assets/audio/dialogue_next.mp3',
	'assets/audio/street_ambience.mp3',
	// Phoenix Flame,
	'assets/audio/fireplace.mp3',
	'assets/audio/flame_on.mp3',
	// Main Menu
	'assets/audio/space_loop.mp3',
	'assets/audio/button_hover.mp3',
	'assets/audio/button_click.mp3',
];

/**
 * Handles preloading of all game assets, including sprites, videos, dialogue data, and particle configurations.
 *
 * All asset loading is done in parallel, with fallback handling for failed assets.
 *
 * Tracks loading progress and updates the loading scene.
 *
 * @param loadingScene - The loading scene to update with the progress
 */
export class AssetLoader {
	// Core
	private loadingScene: LoadingScreen;

	// Progress Tracking
	private totalAssets: number = 0;
	private completedAssets: number = 0;

	constructor(loadingScene: LoadingScreen) {
		this.loadingScene = loadingScene;
	}

	private updateProgress(): void {
		const progress = this.completedAssets / this.totalAssets;
		this.loadingScene.updateProgress(progress);
	}

	private markAssetComplete(): void {
		this.completedAssets++;
		this.updateProgress();
	}

	async loadAllAssets(): Promise<void> {
		this.totalAssets =
			regularAssets.length +
			backgroundVideoAssets.length +
			dialogueAssets.length +
			particleConfigAssets.length +
			audioAssets.length;

		// Execute all tasks in parallel
		await Promise.all([
			this.loadRegularAssets(regularAssets),
			this.createBackgroundVideoTexture(backgroundVideoAssets),
			this.loadDialogueData(dialogueAssets),
			this.loadParticleConfigs(particleConfigAssets),
			this.loadAudioAssets(audioAssets),
		]);

		console.log('Assets preloaded successfully');
	}

	private async loadRegularAssets(assets: AssetList): Promise<void> {
		return new Promise((resolve, reject) => {
			Assets.load(assets, () => {
				// Each call to this callback means one asset has loaded
				this.markAssetComplete();
			})
				.then(() => resolve())
				.catch(error => reject(error));
		});
	}

	private async loadAudioAssets(audioAssets: AssetList): Promise<void> {
		try {
			const audioPromises = audioAssets.map(async asset => {
				const alias =
					asset.split('/').pop()?.split('.')[0] || 'unknown';

				return new Promise<void>(resolve => {
					try {
						sound.add(alias, {
							volume: 0.2,
							url: asset,
							preload: true,
							loaded: () => {
								this.markAssetComplete();
								resolve();
							},
						});
					} catch (error) {
						console.error(
							`Failed to load audio asset ${asset}:`,
							error
						);
						this.markAssetComplete(); // Still mark as complete to avoid hanging
						resolve();
					}
				});
			});

			await Promise.all(audioPromises);
		} catch (error) {
			console.error('Failed to load audio assets:', error);
			// Mark remaining assets as complete to avoid hanging
			for (let i = 0; i < audioAssets.length; i++) {
				this.markAssetComplete();
			}
		}
	}

	private async createBackgroundVideoTexture(
		backgroundVideoAssets: AssetList
	): Promise<void> {
		try {
			const videoPromises = backgroundVideoAssets.map((videoPath, i) => {
				return new Promise<void>((resolve, reject) => {
					// I had to create a video element to load and create a texture from it, because if not the Sprite wouldn't loop
					const videoElement = document.createElement('video');
					videoElement.src = videoPath;
					videoElement.loop = true;
					videoElement.autoplay = true;
					videoElement.muted = true;
					videoElement.playsInline = true;

					videoElement.addEventListener('loadeddata', () => {
						const videoTexture = Texture.from(videoElement);
						const videoFileName =
							videoPath.split('/').pop()?.split('.')[0] ||
							`video-${i}`;
						const cacheKey = `background-video-texture-${videoFileName}`;
						Assets.cache.set(cacheKey, videoTexture);

						// Clean up the video element after creating the texture
						videoElement.remove();

						this.markAssetComplete();
						resolve();
					});

					videoElement.addEventListener('error', error => {
						console.error(
							`Failed to load background video ${i}:`,
							error
						);
						reject(error);
					});

					videoElement.load();
				});
			});

			await Promise.all(videoPromises);
		} catch (error) {
			console.error('Failed to create background video textures:', error);
			throw error;
		}
	}

	private async loadDialogueData(dialogueAssets: AssetList): Promise<void> {
		try {
			const dialoguePromises = dialogueAssets.map(async dialoguePath => {
				const response = await fetch(dialoguePath);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch dialogue data: ${response.status}`
					);
				}

				const dialogueData = await response.json();

				const dialogueFileName =
					dialoguePath.split('/').pop()?.split('.')[0] ||
					'magicwords';
				const cacheKey = `dialogue-data-${dialogueFileName}`;

				await this.loadEmojiTextures(dialogueData);
				await this.loadAvatarTextures(dialogueData);

				Assets.cache.set(cacheKey, dialogueData);
				this.markAssetComplete();
				return dialogueData;
			});

			await Promise.all(dialoguePromises);
		} catch (error) {
			console.error('Failed to load dialogue data:', error);
			dialogueAssets.forEach(dialoguePath => {
				const dialogueFileName =
					dialoguePath.split('/').pop()?.split('.')[0] ||
					'magicwords';
				Assets.cache.set(`dialogue-data-${dialogueFileName}`, null);
			});
			// Mark remaining assets as complete to avoid hanging
			for (let i = 0; i < dialogueAssets.length; i++) {
				this.markAssetComplete();
			}
		}
	}

	private async loadParticleConfigs(
		particleConfigAssets: AssetList
	): Promise<void> {
		try {
			const configPromises = particleConfigAssets.map(
				async configPath => {
					const response = await fetch(configPath);
					if (!response.ok) {
						throw new Error(
							`Failed to fetch particle config: ${response.status}`
						);
					}

					const config = await response.json();

					const configFileName =
						configPath.split('/').pop()?.split('.')[0] || 'unknown';
					const cacheKey = `particle-config-${configFileName}`;

					await this.loadTexturesForConfig(config);

					Assets.cache.set(cacheKey, config);
					this.markAssetComplete();
					return config;
				}
			);

			await Promise.all(configPromises);
		} catch (error) {
			console.error('Failed to load particle configurations:', error);
			particleConfigAssets.forEach(configPath => {
				const configFileName =
					configPath.split('/').pop()?.split('.')[0] || 'unknown';
				Assets.cache.set(`particle-config-${configFileName}`, null);
			});
			// Mark remaining assets as complete to avoid hanging
			for (let i = 0; i < particleConfigAssets.length; i++) {
				this.markAssetComplete();
			}
		}
	}

	private async loadTexturesForConfig(config: any): Promise<void> {
		const textureRandomBehavior = config.behaviors.find(
			(b: any) => b.type === 'textureRandom'
		);

		if (textureRandomBehavior && textureRandomBehavior.config.textures) {
			const texturePaths = textureRandomBehavior.config.textures;

			const texturePromises = texturePaths.map((texturePath: string) => {
				const fullPath = `assets/particles/${texturePath}`;
				return Assets.load(fullPath);
			});

			await Promise.all(texturePromises);
		}
	}

	private async loadEmojiTextures(dialogueData: any): Promise<void> {
		if (!dialogueData?.emojies) return;

		const emojiPromises = dialogueData.emojies.map(async (emoji: any) => {
			try {
				const base64 = await convertUrlToBase64(emoji.url);
				return { name: emoji.name, base64 };
			} catch (error) {
				console.error(`Failed to load emoji ${emoji.name}:`, error);
				return null;
			}
		});

		const emojiResults = await Promise.all(emojiPromises);
		const emojiBase64Map = new Map<string, string>();

		emojiResults.forEach(result => {
			if (result) {
				emojiBase64Map.set(result.name, result.base64);
			}
		});

		Assets.cache.set('emoji-base64', emojiBase64Map);
	}

	private async loadAvatarTextures(dialogueData: any): Promise<void> {
		if (!dialogueData?.avatars) return;

		const avatarPromises = dialogueData.avatars.map(async (avatar: any) => {
			try {
				const texture = await Texture.fromURL(avatar.url);
				return { name: avatar.name, texture };
			} catch (error) {
				console.error(`Failed to load avatar ${avatar.name}:`, error);
				return null;
			}
		});

		const avatarResults = await Promise.all(avatarPromises);
		const avatarMap = new Map<string, Texture>();

		avatarResults.forEach(result => {
			if (result) {
				avatarMap.set(result.name, result.texture);
			}
		});

		Assets.cache.set('avatar-textures', avatarMap);
	}
}
