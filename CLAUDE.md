# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`vic-tactical-pc` (this directory) is the Electron + React 19 + TypeScript HUD with a permission-gated IPC bridge that gives the renderer real PC and vehicle capabilities. It is the v4 HUD plus a Node-side capability layer plus a voice/agent stack (Gemini Live + the OMNI VIC System Pack in `vic-agent/`). The visual system, theme/palette infrastructure, and HUD primitives are unchanged from v4. If a question is purely about the HUD UI, the v4 architecture in `../VIC_v4/CLAUDE.md` still applies.

The sibling `../VIC/` project is a separate Python-backend variant; do not apply patterns from it here. The numbered siblings (`../VIC_v4`, `../VIC_v5`, `../VIC_v6*`, `../VIC_v7*`) are prior snapshots — work in this directory unless told otherwise.

## Commands

Run from this directory.

- `npm install` — install dependencies (native packages in `optionalDependencies` are allowed to fail).
- `npm run precheck` — one-shot bootstrap: dep check → install → native rebuild → build → start. Use this for first-time setup or after major env changes.
- `npm run rebuild` — rebuild installed optional native modules against Electron's Node ABI; skips optional modules that are not installed.
- `npm run dev:web` — Vite only (browser); `window.vic` is unavailable, hooks degrade to mock data.
- `npm run dev` — Vite + Electron together (via `concurrently` + `wait-on tcp:5173` + `electron/launch.cjs`); this is the normal dev loop.
- `npm run test:setup` — runs four Node smoke suites in `test/`: setup-scripts, gemini-simulation throttling, logging-hooks, logviewer.
- `npm run typecheck` — `tsc -b` over the project references.
- `npm run build` — typecheck + `vite build`. **Run before claiming a change complete.**
- `npm start` — launch Electron against the built `dist/` (via `electron/launch.cjs production`).

Env (`.env`):
- `VITE_GOOGLE_MAPS_API_KEY` — NAV screen (build-time injection through Vite).
- `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION` — real Vertex AI Gemini Live; without these, `gemini.cjs` falls back to the simulation responder. Auth uses ADC: run `gcloud auth application-default login` once.
- `VIC_OBD_PORT` / `VIC_OBD_BAUD` — auto-connect ELM327 on startup.
- `VIC_FULLSCREEN=0` — windowed maximized instead of fullscreen.
- `VIC_DEBUG` — extra debug logging.

Diagnostics: `electron/logger.cjs` writes JSONL logs under Electron `userData/logs/` after app ready (path printed as `Diagnostic logging ready`). `electron/logging-hooks.cjs` captures main unhandled errors, Chrome `webContents` console messages, preload errors, renderer crashes, load failures, and responsiveness events. Renderer-side `src/errorLogging.ts` forwards `window.onerror`, unhandled rejections, React error-boundary failures, and `console.warn` / `console.error` through `window.vic.logs`. Open `tools/logviewer.html` in a browser to inspect `vic-*.jsonl` (file picker / drag-drop, level/source/search filters, JSONL/CSV export).

## Architecture

### Three-tier flow

```
React renderer  ──invoke──▶  preload.cjs  ──▶  ipcMain handler  ──▶  Node module / OS
       ▲                                                                  │
       └────────  on('channel') ◀── webContents.send(channel, payload) ◀──┘
```

- **Renderer side**: components call typed methods on `window.vic.*` via `getBridge()` in `src/pcBridge.ts`. The bridge returns `null` when running in pure browser mode, so every consumer must handle that case (most do via the `useBridgeAvailable()` / `useObdStream()` / `useSystemTelemetry()` hooks in `src/hooks.ts`).
- **Preload** (`electron/preload.cjs`): the only place `contextBridge.exposeInMainWorld` happens. Exposes `window.vic` (capabilities) and `window.vicWindow` (titlebar controls). Stays a thin invoke/subscribe shim — no logic. Generic `subscribe(channel, listener)` helper wraps `ipcRenderer.on` and returns an unsubscribe.
- **Main process** (`electron/main.cjs`): boots the BrowserWindow with same Windows GPU flags as v4, loads `settings.json` via the permissions module, then calls `registerHandlers` from `electron/ipc/index.cjs` which mounts every per-capability module. Modules receive `{ ipcMain, broadcast, getMainWindow, permissions }` and register `ipcMain.handle(...)` channels.

### IPC modules currently mounted

`electron/ipc/index.cjs` registers, in order: `fs`, `apps`, `processes`, `system`, `windows`, `notifications`, `logs`, `obd`, `gemini`, `command-router`, `vehicle-data`, `carplay`, `agent`. Each exports `{ name, register(ctx), dispose? }`. Registration failures are caught and logged — a broken module does not block the rest.

### Permission gate

`electron/ipc/permissions.cjs` is the single chokepoint. Every capability handler awaits `permissions.check(id, { summary, detail })` and bails with `{ error: 'denied' }` if the user (or settings) refuses. Three rules in `settings.json` → `tool_permissions`: `allow` (silent), `confirm` (native modal — Deny / Allow once / Allow for session), `deny` (never). Session grants live in an in-memory map cleared on quit. There is no async event for permission changes — handlers re-check on every call.

### Adding a new IPC capability

**Three files in lockstep**, in this order:

1. Handler in `electron/ipc/<module>.cjs` exporting `{ name, register({ ipcMain, broadcast, ... }) }`. Wrap any user-facing operation in `await check('<id>', { summary })`. Return `{ error: msg }` on failure (don't throw across IPC).
2. Wire it in `electron/preload.cjs` under the `contextBridge` namespace (`vic.<group>.<method>` → `invoke('<channel>', payload)`).
3. Type the surface in `src/pcBridge.ts` (extend `VicBridge`). Don't put these types in `src/types.ts` — that file is for the HUD data model only.
4. Add the module to the list in `electron/ipc/index.cjs`.
5. Add the default rule to `settings.json` → `tool_permissions`. Default to `'confirm'` for anything write-side or destructive.

If the new module owns native deps, lazy-require them in a try/catch that logs and downgrades the surface — `serialport`, `node-window-manager`, `find-process`, `tree-kill`, and `systeminformation` all do this. Native packages that can fail on Windows should be optional dependencies (see `package.json` → `optionalDependencies`) and covered by `scripts/rebuild-natives.cjs`. **Do not** let a missing native module crash the app boot.

### Streaming telemetry (system + OBD + voice + carplay + agent)

Long-lived data streams use `webContents.send` instead of `invoke` for push:

- **System telemetry** (`system:telemetry`): renderer calls `system.startStream(intervalMs)`, main process polls `systeminformation` and broadcasts snapshots. `useSystemTelemetry()` wraps subscribe + cleanup.
- **OBD telemetry** (`obd:telemetry` + `obd:status`): main process owns one ELM327 connection and a round-robin PID poll loop. Renderer never sees the serial port. `useObdStream()` wraps both channels and is called from any screen that wants live readings; multiple subscribers get the same broadcast.
- **Gemini voice** (`gemini:audio` / `gemini:status` / `gemini:turnComplete` / `gemini:interrupted` / `gemini:transcription` / `gemini:functionCall`): bidirectional 24 kHz PCM streaming over WebSocket; renderer pushes audio with `gemini:sendAudio` (a `send`, not `invoke`). Function-call responses go back via `gemini:sendFunctionResponse`.
- **CarPlay/PhoneLink** (`carplay:command` / `carplay:status`): the WS server in `carplay.cjs` listens on **port 8081** and forwards phone-side messages into the HUD.
- **Command router** (`vic:command:response` / `vic:command:modeChange`): structured command lifecycle output from `command-router.cjs`.
- **Agent** (`agent:status`): state changes from `agent.cjs`.

When adding a new stream, broadcast via `ctx.broadcast(channel, payload)` from inside `register()`, expose `subscribe(channel, listener)` via the preload's `subscribe` helper (already generic), and add the `onX(listener)` typing to `VicBridge`.

### OBD-II / ELM327 (`electron/ipc/obd.cjs`)

The most non-obvious module. Key points for editing it:

- **Serial only owns one program at a time.** FORScan and this app share the same ELM327 hardware but cannot share the COM port simultaneously. The module's docstring spells this out — don't try to "integrate with FORScan", talk to the adapter directly.
- **Init sequence is brittle.** ATZ → ATE0 → ATL0 → ATS0 → ATH0 → ATSP0 (echo off, linefeeds off, spaces off, headers off, auto protocol). Errors during init are non-fatal except ATZ; failures are tolerated for the rest because some clones reject options.
- **Polling is round-robin, one PID per tick** (`pollIntervalMs`, default 250ms from `settings.json`). The full snapshot is broadcast only once per cycle through all PIDs to avoid spam.
- **Adding a PID**: add to the `PIDS` table in `obd.cjs` (mode/pid/bytes/decode), add the name to `ObdPidName` in `pcBridge.ts`, optionally add to `settings.json` → `obd.pids` (or leave it out and the loop picks up everything in the table).
- **Ford-specific data** (BCM, IPC, ABS, transmission temps not in standard OBD-II) requires mode 22 PIDs against Ford CAN IDs. The current module only does mode 01/03/04/AT. To extend, add an `extended` flag to PIDs and switch the request format to `22XXXX` with appropriate header set via `ATSH`.
- **Transport swap**: BT adapters expose a virtual COM port — same module works. WiFi adapters (commonly 192.168.0.10:35000) require swapping `serialport` for `net.Socket`; isolate that behind the existing `port.write` / `parser.on('data')` interface.

### Gemini Live + simulation fallback (`electron/ipc/gemini.cjs`)

Real Vertex AI Multimodal Live (`gemini-2.0-flash-exp`) over WebSocket with `google-auth-library` ADC. If `GOOGLE_CLOUD_PROJECT`/`GOOGLE_CLOUD_LOCATION` are absent or auth fails, the module hands off to `gemini-simulation.cjs` (covered by `test/gemini-simulation.test.cjs` for throttling). Function calls from the model are surfaced to the renderer as `gemini:functionCall` events; the renderer is expected to dispatch them through the command router and reply via `gemini.sendFunctionResponse`. Don't bypass the simulation fallback — many devs and CI run without GCP credentials.

### Command router + safety (`electron/ipc/command-router.cjs`)

Implements voice-command lifecycle: transcript → intent parse → safety check → execute → log → response. Persists the last 200 entries each of `commands` and `safety` to `userData/vic-commands.json`. The safety policy hard-blocks high-risk command types (`unlock_doors`, `lock_doors`, `remote_start`, `window_move`) — leave these blocked unless the user explicitly asks to wire them and is aware of the safety implications. New command types go in `COMMAND_TYPES` plus a handler branch; high-risk ones must go through the `requiresConfirm` path.

### Agent / OMNI VIC System Pack (`electron/ipc/agent.cjs` + `vic-agent/`)

The agent module loads `state-engine.json`, `personality-config.json`, and `event-triggers.json` from `vic-agent/` at startup. State is one of `playful | focused | alert | protective | chill`; risk is `low | medium | high`, and high/medium risk forces `protective`/`alert`. `vic-agent/system-prompt.md`, `behavior-engine.md`, `response-rules.md`, `voice-style.md`, `memory-policy.md`, and `example-interactions.md` define the runtime personality and are intended to be fed into the LLM prompt. When changing tone/state behavior, edit the JSON config files — the JS is just a loader.

### Vehicle data persistence (`electron/ipc/vehicle-data.cjs`)

Notes/tasks/parts/profile persist to `userData/vic-vehicle-data.json` with a `dataCache` in-memory copy. The default seed is a 2008 Crown Victoria Police Interceptor (matches the original mock in `src/data.ts`). Use `usePersistentVehicleData` from the renderer rather than touching the file directly.

### CarPlay / PhoneLink simulator (`electron/ipc/carplay.cjs`)

Plain `ws` server on port 8081. Phone connects from a browser and sends JSON messages (`{ type: 'navigate', destination: '...' }`, etc.); the HUD reacts to `carplay:command` broadcasts. This is the seam where a real AirPlay/MFi integration would later replace the simulator — keep the message-shape contract simple.

### Google Maps NAV screen

`src/NavScreen.tsx` loads the Maps JS API on demand via a script tag, with `VITE_GOOGLE_MAPS_API_KEY` injected at build time. Without a key, it renders a fallback panel and the OPEN IN BROWSER button still works (deep-links to maps.google.com via `apps.openUrl` which goes through `shell.openExternal` in main). The map style is a tactical-themed override built from the active palette so it matches the HUD theme.

The map runs in the renderer, not in a BrowserView — keeps it inside the React layout, but means it's bound by Maps JS API quotas and billing. For a fully-offline option, swap to Leaflet + OpenStreetMap tiles (would require a new dep + rewriting `NavScreen.tsx`).

### Mode system (carried from v4, expanded)

`HudShell` still owns `mode: ModeId` and conditionally renders one screen. The current union (`src/types.ts`) is `'driving' | 'nav' | 'parked' | 'diagnostics' | 'system' | 'ambient'`. When adding a screen, all four edits are required: `ModeId` union, `data.ts` modes array, `HudShell` conditional render, and the screen component itself. Mode bar order and number-key shortcuts (1–6) are driven by `data.ts`.

### Keyboard

`Spacebar` = push-to-talk (voice / Gemini), `1`–`6` = direct mode switch, `F11` = fullscreen, `Ctrl+Alt+T` = tweaks panel, `Esc` = close current panel / end route.

## Conventions

- Strict TypeScript, React 19 function components in `src/`. CommonJS for everything in `electron/` (this is enforced by `test/setup-scripts.test.cjs`).
- Renderer types in `src/types.ts` (HUD data) vs `src/pcBridge.ts` (IPC contract). Keep these separate.
- All `window.vic` access goes through `getBridge()` so non-Electron preview mode keeps working.
- IPC handlers return `{ error: string }` on failure rather than throwing — consumers narrow on the `error` field.
- Per-capability modules in `electron/ipc/` export `{ name, register, dispose? }`. `dispose` is called on `before-quit` and `window-all-closed` (the hook is wired but currently a no-op in `main.cjs` — add it there if your module needs cleanup).
- `settings.json` is the ground truth for permissions and OBD polling config; never hardcode permission bypasses in handlers. Personal overrides go in `settings.local.json` (gitignored).
- The HUD must boot even when Electron is absent (`npm run dev:web`). Hooks degrade to mock data; UI panels render "PC bridge unavailable" placeholders.

## Reference files

- `README.md` — user setup (Google Maps key, OBD adapter, permission model).
- `QUICKSTART.md` — 10-minute end-to-end runbook including phone WebSocket smoke test.
- `AGENTS.md` — short conventions document for AI assistants.
- `GEMINI.md` — parallel architecture brief written for the Gemini agent; mostly overlaps with this file.
- `PROGRESS.md` — feature changelog.
- `settings.json` — permission defaults + OBD config (gitignored personal override goes in `settings.local.json`).
- `vic-agent/` — OMNI VIC System Pack: personality, state engine, event triggers, voice style, memory policy.
- `tools/logviewer.html` — standalone JSONL log viewer.
- `../VIC_v4/CLAUDE.md` — original HUD architecture; still authoritative for the visual/theme/palette layer.
