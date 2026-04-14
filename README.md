# Browser Aim Trainer

A self-contained browser FPS aim trainer with movement, multiple scenarios, custom crosshairs, real reactivity tracking, and run-history graphs. No install, no account, no backend — just open the page and play.

🎯 **Live:** [https://1504681.github.io/BrowserAimTrainer/](https://1504681.github.io/BrowserAimTrainer/)

---

## Features

### Scenarios
Four core scenarios, each playable with two weapon styles:

| Scenario | Description |
|---|---|
| **Tracking** | Sphere targets that bounce in physics-based arcs across a panel. Headshots count double on click weapon. |
| **Pursuer** | One cylinder bot that orbits and kites you at fixed range, periodically flipping strafe direction. HP bar above the target. Reactivity stats measured per-flip. |
| **Dodge** | Free movement around an enclosed room with bots scattered around you. A right-side bar fills as you strafe; switch direction in the green zone for a ×2 score multiplier. |
| **Pole Practice** | Stationary thin pole locked to the room center. Pure strafe-form drill — no aim pressure, just rhythm. |

Each scenario has two play buttons:
- **CLICK** — locks to hitscan weapon (1-shot kill, semi-auto)
- **TRACK** — locks to tracking weapon (auto-fire, low damage per tick)

Difficulty (Easy / Normal / Hard) is a single big toggle at the top of the menu and affects target speed, headshot box size, and Pursuer flip cadence.

### Sensitivity (matches your in-game value)
- **First-run setup** asks for your `inches per 360°` from any game
- **Calibration tool**: swipe a single 360° in the browser and it auto-derives the exact value (compensates for browser pointer-lock quirks)
- **Setup** button reopens the welcome flow at any time
- The reference math (`2π / (inches × DPI)`) is documented inline in the source

### Crosshair editor
- 4 styles: cross, dot only, circle, T
- Size, thickness, gap, color
- Center dot toggle with size and color
- Black outline toggle for visibility on bright targets
- Live preview in settings, persisted to localStorage

### HUD & UI
- **Pause menu (ESC)** with live score / time / accuracy / hits / reactivity
- **FPS counter** color-coded green/yellow/red
- **Score / time / accuracy** in the top HUD
- **Streak counter** glows gold above 10
- **HUD inset slider** to pull all UI elements closer to the center
- **Hit marker** pulses on every hit (gold on headshots)
- **Headshot toast** for headshot kills
- **Spawn direction toast** when targets spawn off-screen (`← LEFT`, `RIGHT →`, `BEHIND ↓`)
- **Weapon HUD** showing the active weapon (1/2 to switch when not locked)

### Audio
- Web Audio synth (no external files)
- Hit sounds: pop / tick / beep / thock / off
- Optional miss sound
- Volume slider
- **3D positional spawn sounds** via `PannerNode` HRTF — you'll hear targets spawn behind you in stereo
- Tracking weapon has its own deeper, softer hit tick

### Stats & Graphs
- **Game over card** with PB pill + percentage delta when you set a new best
- **Two charts** on the game-over screen: Score and Accuracy over the last 20 runs
- **Rolling average overlay** (5-run window) on top of each chart
- **Click either chart** to open a full **Run History** screen with table + bigger charts + summary stats
- Best scores stored per `mode-difficulty` so Easy and Hard are tracked independently
- **85–95% accuracy band feedback** colors your accuracy stat green/yellow/red on game over with a tip ("ideal range — push for speed", "below 85% — slow down", "above 95% — increase difficulty")

### Reactivity tracking (Pursuer only)
Built on the AIMER7 strafe-aim doc's framework:
- **Notice** — ms from bot's strafe direction flip until your mouse starts braking the old direction
- **Flick** — ms from "noticed" until your mouse fully crosses into the new direction
- Splits "slow eyes" from "slow hands" so you know what to drill

### Movement
WASD with snappy FPS-feel physics:
- Top speed: configurable (default 5.5 m/s)
- High acceleration (~60 m/s²)
- Quick stop friction
- Counter-strafe is instant
- Camera clamped to the room

### Settings (persisted)
Tabbed panel with: Crosshair, Audio, Visual, Gameplay
- Skybox presets (Void / Range / Daylight / Sunset / Twilight / Space)
- Target color, head color
- FOV slider (60–120°)
- HUD inset
- Weapon, difficulty, walk speed, tracking target count
- All saved to `localStorage` under `aimtrain_settings_v1`

---

## Controls

| Key | Action |
|---|---|
| **Mouse** | Aim |
| **Left Click** | Shoot |
| **W A S D** | Move (in scenarios with movement) |
| **1 / 2** | Switch weapon (when not locked by scenario) |
| **F** | Fullscreen |
| **R** | Restart current scenario |
| **ESC** | Pause / unpause |
| **Click** the canvas | Acquire pointer lock |

---

## Tech

- **Three.js** (loaded from CDN via importmap, no build step)
- Pure HTML/CSS/JS — single file (`index.html`)
- Hosted on GitHub Pages
- The original 2D "Don't Tap the White Tile" game is preserved at [`index-2d.html`](./index-2d.html)

---

## Running locally

```bash
git clone https://github.com/1504681/BrowserAimTrainer.git
cd BrowserAimTrainer
# Just open index.html in a browser, or use any static server:
python3 -m http.server 8000
# Visit http://localhost:8000/
```

No build step, no dependencies, no node_modules. The Three.js import is loaded from `cdn.jsdelivr.net`.

---

## Theory & influences

The trainer's design follows AIMER7's writing on aim training:
- **Reactivity** is decomposed into reactive part (notice) and correcting part (flick)
- **85–95% accuracy** is treated as the ideal training band
- **Conditional movement scoring** — multiplier only for strafe changes that happen in a reactive window after the bot's flip — implements an idea AIMER7 specifically said "no aim trainer has shipped"
- **Strafe form practice** via Pole Practice mode (stationary target, pure rhythm drill)

---

## Sensitivity matching

Browser Pointer Lock reports `event.movementX` in CSS pixels, not raw mouse counts. The OS pointer-speed slider, "Enhanced pointer precision," and display scaling all leak in. To get true muscle-memory parity:

1. Disable **Enhanced pointer precision** in Windows Mouse settings
2. Set Windows pointer speed to 6/11 (the unscaled default)
3. Open the **Calibrate** tool in the menu, swipe one full 360° as you would in your reference game, press **Space**
4. The trainer fills in the exact `inches/360°` value the browser actually needs

This works around the browser API limitation without needing a native helper.

---

## License

Personal project — use the code freely, no warranty.
