# Browser Aim Trainer

A full-featured browser FPS aim trainer with real movement physics, a shared leaderboard, custom scenarios, sensitivity conversion for any game, hover-able run history charts, and a reactivity metric that actually tells you whether your eyes or your hands are the bottleneck. No install, no account — just open the page and play.

🎯 **Live:** https://1504681.github.io/BrowserAimTrainer/

> ⚠️ **REQUIRES BROWSER HARDWARE ACCELERATION.** This is a WebGL game. If your browser has hardware/graphics acceleration disabled it will fall back to software rendering (SwiftShader / llvmpipe) and be unplayable.
>
> - **Chrome / Edge / Brave**: `chrome://settings/system` → "Use graphics acceleration when available"
> - **Firefox**: `about:preferences#general` → Performance → "Use hardware acceleration when available"
> - The trainer detects software rendering and shows a red banner if it's in use. Click the warning on the welcome screen for one-click copy of the setting URL.

---

## Scenarios

Each scenario can be played with **Click Timing** (hitscan · 1-shot kill · semi-auto) or **Tracking** (auto-fire · low damage per tick). Both weapons share scoring but feel different — click rewards precise timing, tracking rewards sustained on-target accuracy.

| Scenario | Description |
|---|---|
| **Bouncing Targets** | 5 sphere targets bouncing in a 3D box arena in front of you. Billiard-style collisions with each other + walls, max speed capped so they stay trackable. |
| **Pursuer** | One cylinder bot orbits and kites you at fixed range, periodically flipping strafe direction. HP bar above the target. Reactivity (notice + flick) measured per bot direction change. |
| **Dodge** | Free WASD movement around a closed room with 6 scattered targets. Strafe bar at bottom-left rewards timed direction switches. |
| **Pole Practice** | Stationary thin pole locked to room center — pure strafe-form rhythm drill. Tracking-only. |

Difficulty (**Easy / Normal / Hard**) scales target speed, head-box size, direction-change frequency, AND target scale (bigger = easier).

---

## Custom runs

Every scenario has a **Customize** panel (inside the scenario detail screen and in the pause menu):
- **Target size** × 0.4–2.0
- **Target speed** × 0.4–2.5
- **Direction-change rate** × 0.4–2.5
- **Target HP** × 0.25–5.0

Custom runs are stored under a separate highscore key (`<mode>-custom-<weapon>`) so tweaking doesn't overwrite your standard-difficulty bests. Preset-load buttons (Easy/Normal/Hard) inside the panel fill the sliders with that difficulty's values as a starting point.

---

## Scoring (damage × movement multiplier)

Every damage-dealing hit contributes `damage × current_movement_multiplier` to your score:

- **Hitscan body** → +1 per shot
- **Hitscan headshot** → +2 per shot
- **Tracking body** → +0.08 per fire-tick
- **Tracking head** → +0.16 per fire-tick

In movement scenarios (Dodge, Pursuer, Pole) the **strafe bar** controls your current multiplier:
- Switching direction in the green zone (75–115% fill) → **×2.0**
- Linear ramp up to that (10–75%) → 0.4 → 2.0
- Too early (<10%) → ×0
- Overshoot (>115%) → ×0.4

The bar **pauses** when you're not strafing, plays a tone when it enters the green zone, and resets on every direction change.

Final score is `sum(damage × mul)` across the whole run. The game-over card shows the weighted final, raw damage, and **average multiplier** derived from `score / rawDamage`. The 85–95% accuracy feedback band only shows for click-timing runs (tracking accuracy has different semantics).

---

## Reactivity metric (Pursuer only)

Split into two parts following the AIMER7 strafe-aim doc:

- **Notice** — time from the bot's strafe flip until your mouse starts braking the old direction (reading/reaction)
- **Flick** — time from "noticed" until your mouse direction actually matches the new direction (mechanics)

Shown as two separate cells on the game-over card. Tells you whether slow eyes or slow hands are the bottleneck.

---

## Leaderboard (global)

Backed by a tiny **Cloudflare Worker + KV** deployment that any browser can read/write. No auth — name is whatever you set in the welcome flow.

- **Welcome → Step 1** asks for a player name (max 20 chars)
- **Welcome → Step 2** asks for your sensitivity: pick a game preset (Overwatch / Valorant / CS2 / Apex / Fortnite / R6 / CoD / Quake / direct inches-per-360°), enter your in-game value + DPI, and it computes the trainer's `inches/360°`. A **Calibrate** tool on the main menu lets you swipe a known 360° to correct for browser pointer-lock quirks.
- On page load, the client pre-fetches every `<mode>-<difficulty>-<weapon>` leaderboard in parallel
- On game over it submits the run, then re-renders the **side-attached leaderboard panel** with ranks, gold/silver/bronze colors, and a "you" highlight on your submission
- Click a chart card on game over → full **Run History** screen with the run table, sort, and clear-history button
- **Settings → Gameplay** has an **opt-out toggle** ("Submit to leaderboard") if you'd rather keep runs local-only

Worker code + deploy instructions live in [`worker/`](./worker/).

---

## UI & UX

- **Design tokens** (cyan accent, dark surfaces) driven by CSS variables
- **Inter font** from Google Fonts with tabular number glyphs
- **Pause menu (ESC)** — redesigned card with scenario header, live stats (score / time / accuracy / hits or reactivity), big colored difficulty toggle (Easy/Normal/Hard/Custom), action grid, and an inline customize section when Custom is selected. Difficulty buttons **preview** — the Resume button turns into "Play X" when the preview differs from the current run, only restarting on confirmation.
- **ESC back-navigation** through menus — scenario detail → main menu, settings → previous, history → game over, etc.
- **Scenario detail screen** — click a card to see the scenario description, a 3×2 (or 3×1) grid of best scores across all difficulty/weapon combos, the score-history chart for the current selection, and **Play Click / Play Track** buttons that highlight your currently-active weapon
- **Hardware acceleration warning** on welcome with per-browser URLs and Copy-to-clipboard buttons (browsers block `chrome://` / `about:` page links for security, so copy-paste is the only way)
- **Smooth menu fade transitions**
- **FPS counter** top-left, color-coded green/yellow/red

## Charts

- Score + Accuracy line charts on every game-over and in the scenario detail screen
- **Rolling average overlay** (5-run window, dashed gold)
- **Day dividers** — vertical dashed lines where the date changes between consecutive runs
- **Hover tooltips** — any chart point shows attempt #, value, accuracy, hits, streak, date/time (and "latest" tag)
- **Smart Y-axis** with a minimum visible range so a cluster of 87–91% accuracy runs still shows variation instead of a flat line
- Click either chart on game over → full Run History drill-down with bigger charts + sortable table

## Audio

- Web Audio synth, no external files
- Hit sounds: pop / **tick** (default) / beep / thock / off
- **3D positional spawn sounds** via `PannerNode` HRTF — you'll hear targets spawn behind you in stereo
- Tracking weapon uses a soft low 280Hz sine tick so sustained fire isn't fatiguing
- Strafe-bar "switch tone" when the bar enters the green zone
- Spawn-direction toast (`← LEFT`, `BEHIND ↓`, etc.) only when a single-target scenario spawns off-screen

## Crosshair editor

- 4 styles: cross / dot / circle / T
- Size, thickness, gap, color, outline, dot toggle, dot size, dot color
- **Context-aware** — when "Dot only" is selected, size/thickness/gap/color/dot-toggle fields hide since they don't apply
- Live preview in settings
- Rendered to a canvas, drawn once per settings change

## Settings

- **Crosshair** — full editor described above
- **Audio** — hitsound preset, miss sound, volume
- **Visual** — skybox presets (void / range / daylight / sunset / twilight / space), target color, head color, FOV (60–120°), HUD inset (pulls all HUD elements closer to center)
- **Gameplay** — just the leaderboard opt-out (weapon and difficulty are set per-scenario, not globally)
- **Sensitivity** — inches/360° calibration accessible from the main menu (Calibrate button + direct input + Setup to reopen the welcome flow)
- All settings persist in localStorage under `aimtrain_settings_v1`

---

## Controls

| Key | Action |
|---|---|
| **Mouse** | Aim |
| **Left Click** | Shoot |
| **W A S D** | Move (Dodge / Pursuer / Pole / Bouncing — movement-enabled scenarios) |
| **1 / 2** | Switch weapon (when not locked by scenario) |
| **F** | Fullscreen |
| **R** | Restart current scenario (keeps locked weapon) |
| **ESC** | Pause / resume (in scenario) · back one step (in menus) |
| **Click the canvas** | Acquire pointer lock |

---

## Movement physics

Snappy FPS-feel (Overwatch-ish):
- Default walk speed: **7.3 m/s** (configurable slider up to 12)
- Acceleration: **80 m/s²** (basically instant)
- Friction: **18** (quick stop)
- Counter-strafe resolves to most recently pressed key — instant direction flip
- Camera clamped to the enclosed room
- Sensitivity math is DPI × inches/360° so your muscle memory carries over

---

## Tech

- **Three.js** (ESM from CDN via importmap — no build step)
- Pure HTML/CSS/JS single-file client (`index.html`)
- Cloudflare Worker + Workers KV for the leaderboard ([`worker/`](./worker/))
- Hosted on GitHub Pages
- Original 2D "Don't Tap the White Tile" game preserved at [`index-2d.html`](./index-2d.html)

## Running locally

```bash
git clone https://github.com/1504681/BrowserAimTrainer.git
cd BrowserAimTrainer
python3 -m http.server 8000  # or any static server
# Visit http://localhost:8000/
```

No dependencies, no build. Three.js loads from `cdn.jsdelivr.net`. The leaderboard will still work from localhost since the Worker has `Access-Control-Allow-Origin: *`.

## Deploying your own leaderboard backend

If you want to run your own instead of using the shared one, see [`worker/README.md`](./worker/README.md):

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Then set `LEADERBOARD_URL` at the top of the script in `index.html` to your deployed `*.workers.dev` URL.

---

## License

Personal project — use the code freely, no warranty.
