# AI Coding Agent Instructions - Juego Ivannita

## Project Overview
**Juego Ivannita** is a browser-based 1v1 fighting game built with vanilla JavaScript and Canvas API. Two players battle on a 60-second timer with sprite animations, collision detection, and health management. Built with Vite for development and bundling.

## Architecture & Data Flow

### Core Components
- **Game (CoreGame.js)**: Main game loop orchestrator. Manages:
  - Game state (timer, gameOver flag, health tracking)
  - Fighter initialization with sprite configs
  - Keyboard input handling (hardcoded: WASD for Player 1, Arrow keys for Player 2)
  - Win/loss determination and UI updates
  - Animation frame loop via `animate()` method

- **Fighter (Fighter.js)**: Individual player entity with:
  - Position/velocity physics (gravity: 0.7)
  - Spritesheet-based animation system (sprite data maps row/col positions)
  - Collision detection box (150x50 offset for attacks)
  - Health & attack cooldown state
  - Image transparency processing (removes white/light backgrounds on load)

- **InputHandler (InputHandler.js)**: Persistent keyboard state tracker (6 keys monitored, persistent press/release state)

### Critical Data Patterns
1. **Sprite Configuration**: Each Fighter receives `sprites` object mapping animation names to `{row, col}` positions in spritesheet grid. Example:
   ```javascript
   sprites: {
     idle: { row: 0, col: 0 },
     attack: { row: 0, col: 1 },
     jump: { row: 1, col: 0 }
   }
   ```

2. **Collision System**: `rectangularCollision()` compares attacker's `attackBox` (150x50 rectangle) against opponent's position/dimensions. Returns boolean for damage application.

3. **Physics**: Each Fighter has gravity applied on Y-axis; jumping/falling use velocity accumulation with canvas boundaries (576px height).

## Key Developer Workflows

### Development & Building
```bash
npm run dev      # Starts Vite dev server with HMR
npm run build    # Bundles to /dist for production
npm run preview  # Serves built bundle locally
```

### Adding Assets
- Spritesheets: Place in `/public/assets/` (e.g., `/assets/michael_spritesheet.png`)
- Backgrounds: Also in `/public/assets/`
- Referenced as absolute paths in code: `/assets/filename.png`

### Debugging
- Global `debugLog` div in HTML logs game state messages
- Use `window.onerror` handler (main.js) for error capture
- Fighter health values: Track via `fighter.health` and DOM elements `#player1Health`, `#player2Health`

## Project-Specific Conventions

1. **Two-Player Hardcoded Input**: Player 1 = WASD + Space (attack). Player 2 = Arrow Keys + ArrowDown (attack). This is intentional, not configurable.

2. **Bidirectional Enemy References**: Each Fighter maintains `this.enemy` pointer to opponent. Used for facing direction, health tracking, collision checks.

3. **State Machine Over Explicit Flags**: Fighter uses `currSprite` to track animation state. Avoid parallel state variables.

4. **Attack Cooldown Pattern**: `isCoolingDown` flag prevents spam; reset timing is managed in Fighter methods.

5. **Image Processing Pipeline**: Transparency applied post-load via canvas manipulation (`processTransparency()`). Critical for sprite backgrounds—don't skip for new fighters.

6. **Canvas Coordinate System**: Origin (0,0) is top-left. Y=576 is floor. Position values are top-left corner of Fighter bounding box.

## Integration Points & Dependencies

- **External**: Vite (dev tool only), ES6 modules
- **Internal Cross-File**: Game imports Fighter + InputHandler + rectangularCollision utility. Fighter is independent (no game imports).
- **DOM Hooks**: Game expects elements: `#timer`, `#restartButton`, `#player1Health`, `#player2Health`, `#restartContainer`, `#displayText`
- **Event Listeners**: CoreGame adds its own keydown/keyup handlers directly (separate from InputHandler) for instant attack triggering

## Common Modification Points

| Task | Location | Pattern |
|------|----------|---------|
| Add new fighter | Fighter constructor | Extend sprites config, add spritesheet |
| Modify physics | Fighter `gravity`, `update()` | Adjust velocity accumulation |
| Change attack timing | Fighter `attack()` | Modify `isCoolingDown` delay |
| Adjust canvas size | main.js | Update `canvas.width/height`; update Fighter spawn positions |
| New game mechanics | CoreGame `animate()` | Add state checks before update calls |

## Notes for AI Agents
- Fighter sprite rendering is **flipped horizontally** based on position relative to enemy (see Fighter.draw() scale transform)
- Frame animation advances via `framesElapsed` counter with `framesHold` (5 frames default) delay per frame—adjust for smoother/choppier animations
- Health UI updates happen in CoreGame's game loop; Fighter only stores health value
