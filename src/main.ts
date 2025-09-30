import './style.css';
import { Application } from 'pixi.js';
import { GameManager } from './core/GameManager';
import { getResponsiveScale, isMobileDevice } from './core/Utils';

function adjustResponsiveScales(): void {
	getResponsiveScale();
	isMobileDevice();
}

(function init(): void {
	// Setup Pixi.js app
	const app = new Application({
		width: window.innerWidth,
		height: window.innerHeight,
		backgroundColor: 0x000000,
		resolution: window.devicePixelRatio || 1,
		autoDensity: true,
		antialias: true,
	});

	// Add app view to DOM
	const appDiv = document.querySelector<HTMLDivElement>('#app')!;
	if (!appDiv) {
		throw new Error('Failed to detect app div');
	}
	// Cast to Node to avoid type error (funny that this is needed since even Pixi.js tutorial uses appendChild)
	appDiv.appendChild(app.view as unknown as Node);

	// Setup scale responsiveness
	adjustResponsiveScales();
	window.addEventListener('resize', adjustResponsiveScales);

	// Prevent context menu on right click
	window.addEventListener('contextmenu', e => e.preventDefault());

	// Initialize game manager
	new GameManager(app);
})();
