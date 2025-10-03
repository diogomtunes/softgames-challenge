# Softgames Game Developer Assignment

A TypeScript-based tech showcase built with PixiJS v7, featuring three interactive scenes, as per the assignment's requirements.

<div>
  <div style="font-size: 24px; font-weight: bold; text-align: center;"><a href="https://diogomtunes.github.io/softgames-challenge/">Live demo hosted on Github pages<a></div>
</div>

&nbsp;

## 🖥️ Tech Stack

### 🗃️ Core

- **[TypeScript](https://www.typescriptlang.org/)**
- **[PixiJS v7](https://pixijs.download/v7.x/docs/index.html)**
- **[pnpm](https://pnpm.io/)**
- **[Vite](https://vitejs.dev/)**
- **[Prettier](https://prettier.io/)**

### 🤝 Dependencies

- **[@pixi/particle-emitter](https://github.com/pixijs-userland/particle-emitter)**

&nbsp;

## 📝 Assignment Tasks

### 🃏 Ace of Shadows

A Yu-Gi-Oh! themed card dealing scene, featuring 144 animated card sprites that automatically move into the duel disk's deck slots.
Cards smoothly animate with rotation effects, showcased at different speeds.

🎯 **Requirements met:**  
✅ Create 144 sprites (NOT graphic objects)  
✅ Cards are stacked on top of each other like cards in a deck.  
✅ The top card must cover the bottom card, but not completely.  
✅ Every 1 second the top card should move to a different stack  
✅ The animation of the movement should take 2 second

📈 **Extra credit:**  
⭐ Yu-Gi-Oh! duel disk visual theme for added nostalgia!  
⭐ Smooth movement animation with randomized rotations  
⭐ Multi-layered graphics so simulate decks fitting into the deck slots  
⭐ Speed up button

&nbsp;

### 🗣️ Magic Words

An interactive dialogue system that combines text and custom emojis, reading dialogue information from json files.

🎯 **Requirements met:**  
✅ Get file from endpoint  
✅ Read data from file  
✅ Combine text with custom emojis  
✅ Showcase dialogue between characters

📈 **Extra credit:**  
⭐ Visual novel style visuals during dialogue  
⭐ User input to advance dialogue  
⭐ Animated UI elements

&nbsp;

### 🔥 Phoenix Flame

An interactive particle effect demo showcasing a flame effect.
Users can intensify the flame by clicking/tapping, with real-time particle count.

🎯 **Requirements met:**  
✅ Make a particle-effect demo showing a fire effect  
✅ Keep the number of images at max 10 sprites on the screen

📈 **Extra credit:**  
⭐ Particle count  
⭐ User input to intensify flame effect  
⭐ Flame effect follows cursor

&nbsp;

### 📱 Technical requirements

🎯 **Requirements met:**  
✅ Code in TypeScript  
✅ Use pixi.js (v7) for rendering  
✅ Tasks accessed via an in-game menu  
✅ Render responsively for both mobile and desktop devices  
✅ Display the fps in the top left corner  
✅ Run the application in full screen
✅ Documented code

📈 **Extra credit:**  
⭐ Loading screen with animation  
⭐ Concurrent asset loading  
⭐ Assets pre-loaded and cached  
⭐ Dynamic menu buttons  
⭐ Animated menu background and visuals  
⭐ Text changes depending on device (Desktop vs Mobile)  
⭐ [JavaDoc style comments](https://www.baeldung.com/javadoc)

&nbsp;

## 🚀 How to run

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm package manager

### Installation and running

```bash
# Clone the repository
git clone https://github.com/diogomtunes/softgames-challenge.git
cd softgames-challenge

# Install dependencies
pnpm install

# Run locally
pnpm run dev

# Build
pnpm run build
```
