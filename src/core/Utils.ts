// Base UI dimensions for 1080p
const baseWidth = 1920;
const baseHeight = 1080;

let baseScale = 1; // Current base scale for UI elements. Used to scale UI elements based on the window size
let usingHeight = false; // Whether the device is using height for scaling (Portrait mode)

/**
 * Gets the responsive scale based on the window size
 * @returns The responsive scale
 */
export function getResponsiveScale(): number {
	const width = window.innerWidth;
	const height = window.innerHeight;
	//   const aspectRatio = width / height;

	usingHeight = height > width;

	if (usingHeight) {
		// Use height as baseline for portrait mode
		baseScale = height / baseHeight;
	} else {
		baseScale = width / baseWidth;
	}

	// Debug
	// baseScale = baseScale / devicePixelRatio;
	// console.log("baseScale", baseScale);
	// console.log("usingHeight", usingHeight);
	return baseScale;
}

/**
 * Scales a pixel value based on the base scale
 * @param value - The value to scale
 * @returns The scaled value
 */
export function scaled(value: number) {
	// Debug
	// console.log("baseScale", baseScale);
	// console.log("usingHeight", usingHeight);
	return value * baseScale;
}

/**
 * Detects if the current device is mobile using multiple methods
 * @returns boolean indicating if the device is mobile
 */
export function isMobileDevice(): boolean {
	const userAgentMobile = (navigator as any).userAgentData?.mobile ?? false;
	const touchCapable =
		'ontouchstart' in window || navigator.maxTouchPoints > 0;
	const smallScreen = window.innerWidth <= 768;

	// console.log(userAgentMobile, touchCapable, smallScreen);
	return userAgentMobile || (touchCapable && smallScreen);
}

/**
 * Checks if the current device is using height for scaling
 * @returns boolean indicating if the device is using height for scaling
 */
export function isUsingHeight(): boolean {
	return usingHeight;
}

/**
 * Processes a single emoji match and returns the appropriate HTML.
 * Creates an image tag if the emoji exists, or a fallback span if not.
 */
function processEmojiMatch(
	emojiName: string,
	emojiBase64Map: Map<string, string>,
	emojiSize: number
): string {
	const base64 = emojiBase64Map.get(emojiName);

	if (base64) {
		// Create image tag for existing emoji
		const imgStyle = `display:inline-block;vertical-align:middle;width:${emojiSize}px;height:${emojiSize}px;margin:0 4px;padding-bottom:8px;`;
		return `<img src="${base64}" style="${imgStyle}" />`;
	} else {
		// Create fallback span for missing emoji
		const spanStyle = `display:inline-block;width:${emojiSize}px;height:${emojiSize}px;line-height:${emojiSize}px;text-align:center;`;
		return `<span style="${spanStyle}">�</span>`;
	}
}

/**
 * Converts dialogue text with {emoji} tags to HTML with <img> tags for HTMLText.
 * Emoji images are styled to match the font size and spacing.
 */
export function textToHtmlWithEmojis(
	text: string,
	emojiBase64Map: Map<string, string>,
	fontSize: number = 32
): string {
	const emojiRegex = /\{(\w+)\}/g;
	const emojiSize = Math.round(fontSize * 1.1); // Slightly larger than text

	let result = '';
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	// Process each emoji match in the text
	while ((match = emojiRegex.exec(text)) !== null) {
		// Add text before the emoji
		if (match.index > lastIndex) {
			result += text.slice(lastIndex, match.index);
		}

		// Add the emoji HTML
		result += processEmojiMatch(match[1], emojiBase64Map, emojiSize);
		lastIndex = match.index + match[0].length;
	}

	// Add any remaining text after the last emoji
	if (lastIndex < text.length) {
		result += text.slice(lastIndex);
	}

	return result;
}

/**
 * Converts an image element to a base64 data URL
 */
function imageToBase64(img: HTMLImageElement): string {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');

	if (!context) {
		throw new Error('Could not get canvas context');
	}

	// Set canvas size to match image dimensions
	canvas.width = img.width;
	canvas.height = img.height;

	// Draw the image onto the canvas
	context.drawImage(img, 0, 0);
	return canvas.toDataURL('image/png');
}

/**
 * Loads an image from a URL and converts it to a base64 data URL, to use with HTMLText.
 */
export async function convertUrlToBase64(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			// Create an image element
			const img = new Image();
			img.crossOrigin = 'anonymous'; // Enable CORS for cross-origin images
			img.src = url;

			img.onload = () => {
				try {
					const base64 = imageToBase64(img);
					resolve(base64);
				} catch (error) {
					reject(error);
				}
			};

			img.onerror = () => {
				reject(new Error(`Failed to load image: ${url}`));
			};
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Resizes a sprite to fit the screen while maintaining aspect ratio.
 * The sprite will be scaled to cover the entire screen and centered.
 *
 * @param sprite - The PIXI sprite to resize
 * @param screenWidth - The width of the screen
 * @param screenHeight - The height of the screen
 */
export function resizeToFit(
	sprite: {
		texture: { width: number; height: number };
		width: number;
		height: number;
		x: number;
		y: number;
	},
	screenWidth: number,
	screenHeight: number
): void {
	// Get aspect ratios
	const textureAspectRatio = sprite.texture.width / sprite.texture.height;
	const screenAspectRatio = screenWidth / screenHeight;

	if (textureAspectRatio > screenAspectRatio) {
		// Texture is wider than screen - fit to height
		sprite.height = screenHeight;
		sprite.width = screenHeight * textureAspectRatio;
	} else {
		// Texture is taller than screen - fit to width
		sprite.width = screenWidth;
		sprite.height = screenWidth / textureAspectRatio;
	}

	// Center sprite
	sprite.x = (screenWidth - sprite.width) * 0.5;
	sprite.y = (screenHeight - sprite.height) * 0.5;
}
