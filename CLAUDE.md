# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Ultimate Danmaku" is a browser-based bullet hell survival game written in vanilla JavaScript. The game features:
- Customizable fighter assembly with body/weapon/engine combinations
- Survival-based gameplay with progressive difficulty
- Local storage for high scores and achievements
- Canvas-based rendering with particle effects

## Architecture

### Core Game Loop
- **main.js**: Central game orchestrator containing the main `Game` class
- **Game loop**: Standard `requestAnimationFrame` loop with update/draw phases
- **Object pooling**: Efficient memory management for bullets, enemies, and particles

### Key Components

#### Player System (`player.js`)
- **Player class**: Handles player movement, weapon shooting, and damage
- **Customization**: Fighter parts (body/weapon/engine) affect stats and behavior
- **Movement**: Touch/mouse tracking with optional dash mechanics

#### Enemy Management (`waveManager.js`)
- **WaveManager class**: Spawns enemies from screen edges
- **Progressive difficulty**: Spawn rate increases, max enemies scale up
- **Boss spawning**: Triggers after 2 minutes of survival

#### UI System (`uiManager.js`)
- **UIManager class**: Handles all DOM interactions and screen management
- **Screen states**: Start screen, builder screen, game over, pause
- **Real-time updates**: Score, health bars, combo counters

#### Support Entities (`drone.js`)
- **Drone class**: Orbiting companions that auto-shoot
- **Power-ups**: Collectible items that spawn drones, health, shields

### Game Data
- **Local storage**: High scores, total games/kills, achievements
- **Achievements**: Event-based unlocks (first kill, combos, survival time)
- **Fighter parts**: Pre-defined configurations in `fighterParts` object

## Development Commands

This is a client-side only project with no build system. Development workflow:

1. **Local server**: Use any HTTP server (e.g., `python -m http.server 8000`)
2. **Testing**: Open `index.html` in browser
3. **Debugging**: Use browser developer tools, console logs are present throughout

## Technical Notes

### Object Pooling Pattern
The game uses custom `ObjectPool` class for performance:
- Pre-allocates objects to avoid garbage collection
- Manages active/inactive states
- Used for bullets, enemies, particles

### Collision Detection
- Simple distance-based collision for most objects
- Special handling for wave-type weapons (radius-based)
- Separate collision systems for player vs enemies and bullets vs enemies

### Performance Considerations
- Canvas clearing with alpha overlay for trail effects
- Particle system with lifecycle management
- Efficient enemy movement patterns (straight, sine, circle)

### Customization System
Fighter parts are defined in `fighterParts` object with:
- **Bodies**: Affect HP and agility
- **Weapons**: Define shooting behavior and damage
- **Engines**: Control thruster effects and dash abilities

## Claude Instructions

Please assist with:
- Reviewing `main.js` for code smell and excessive responsibility
- Suggesting modularization strategies for `waveManager.js` and `uiManager.js`
- Identifying unnecessary state complexity or duplicate logic
- Proposing Boss system integration points

Please do **not**:
- Remove or alter files under `legacy/`
- Translate Chinese comments or variables
- Make changes without clear justification

**Language Preference**: 回覆內容請使用繁體中文