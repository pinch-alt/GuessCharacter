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

## Current Plan: Refinement & Deployment
1.  **Gravity Logic Adjustment**: Reduced gravity force by 20% and smoothed mouse-driven movement (lerp & friction).
2.  **Homing Mechanics**: Re-introduced homing logic for asteroids to target Earth when outside the gravity field.
3.  **Git Deployment**: Stage all changes, commit with a descriptive message, and push to the remote repository.

## Project History & Implementation Details
- **Initial Setup**: Established core engine with Canvas and Vector math.
- **Entity System**: Implemented Earth, Asteroid, and Item classes with physics.
- **Gravity Modes**: Added 'Original', 'Change', and 'Two-Earth' modes.
- **Physics Refinement**: Adjusted for smoother movement and controlled repulsion.
- **Deployment**: Integrated Git workflow for updates.
