# Earth Guard: Gravity Control - Blueprint

## Overview
"Earth Guard: Gravity Control" is a high-performance web-based gravity defense game built with HTML5 Canvas and Vanilla JavaScript. Players act as the planetary guardian, using a dynamic gravity field to deflect asteroids and attract valuable resources.

## Features
- **Dynamic Gravity Physics**: Real-time attraction and repulsion mechanics based on mouse cursor distance and state.
- **Entity Management**: Optimized rendering of asteroids, items, and particle effects using ES6 classes.
- **Difficulty Scaling**: Progressive spawn rates and speed increases based on survival time.
- **Modern UI**: Full-screen canvas with a glassmorphism HUD and neon-glow aesthetics.
- **Performance**: 60 FPS gameplay using `requestAnimationFrame` and efficient collision detection.

## Style & Design
- **Theme**: Deep Space / Sci-Fi.
- **Colors**:
  - Deep Navy/Black Background with noise texture.
  - Earth: Blue/Cyan glow.
  - Attraction Field: Soft Cyan glow.
  - Repulsion Field: Soft Magenta/Red glow.
- **Typography**: Expressive sans-serif (Inter/Roboto) with bold headers for impact.
- **Effects**: Multi-layered drop shadows, glowing particles, and smooth transitions.

## Current Plan: Initial Implementation
1.  **HTML/CSS Overhaul**: Setup full-screen canvas and HUD.
2.  **Core Physics Engine**: Implement `Vector2` math and `Game` class.
3.  **Entity System**: Create `Earth`, `Asteroid`, and `Item` classes.
4.  **Input Logic**: Implement the gravity toggle (Click to switch Mode).
5.  **Spawning & Collision**: Build the logic for survival and point collection.
6.  **Game Over State**: Add restart logic and final score display.
