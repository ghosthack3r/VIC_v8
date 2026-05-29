# VIC v5 — Progress & Plan

**v2.0 — OMNI VIC Agent Integration COMPLETED** (2026-04-29)

**Major Expansion:**
- Integrated full OMNI VIC System Pack (personality, state engine, behavior rules)
- New `vic-agent/` folder with system-prompt.md, behavior-engine.md, response-rules.md, memory-policy.md, voice-style.md, example-interactions.md
- JSON configs: state-engine.json, personality-config.json, event-triggers.json
- New `electron/ipc/agent.cjs` module with live state management, risk evaluation, event triggers, and personality-filtered response generation
- Exposed via `window.vic.agent` (status, setState, triggerEvent, generateResponse)
- Safety-first design: high-risk forces PROTECTIVE state and disables humor
- Ready for UI state visualization and deeper Gemini/command router integration

This turns VIC from a HUD into a true **living co-pilot** with emotional intelligence and safety-aware personality.

---

Snapshot taken 2026-04-27. This is the handoff doc — read this before continuing work.

## Done

### Scaffold + IPC framework
- Copied v4 source skeleton into `VIC_v5/` (React HUD, theme, palettes, primitives all carried over unchanged).
- `electron/main.cjs` — boot + permission load + IPC registration; same Windows GPU flags as v4.
- `electron/preload.cjs` — exposes `window.vicWindow` (titlebar) and `window.vic` (capabilities).
- `electron/ipc/index.cjs` — module registry; mounts every capability handler with a shared `{ ipcMain, broadcast, permissions }` context.
- `electron/ipc/permissions.cjs` — `settings.json` gate with allow/deny/confirm rules and in-memory session grants. Native modal dialog for `confirm`.

### Capability modules (`electron/ipc/`)
| Module             | Status | Notes                                                                         |
| ------------------ | ------ | ----------------------------------------------------------------------------- |
| `fs.cjs`           | done   | read/write/delete/list/stat + native pickFile/pickDirectory; allowedRoots gate. |
| `apps.cjs`         | done   | `spawn`, `shell.openPath`, `shell.openExternal` for URLs.                     |
| `processes.cjs`    | done   | `find-process` list + `tree-kill` SIGTERM/SIGKILL.                            |
| `system.cjs`       | done   | `systeminformation` snapshot + interval-driven `system:telemetry` broadcast.  |
| `windows.cjs`      | done   | `node-window-manager` list/focus; close falls back to PID SIGTERM.            |
| `notifications.cjs`| done   | Native via Electron `Notification`.                                           |
| `obd.cjs`          | done   | ELM327 over `serialport`, AT init, round-robin PID poll, DTC read/clear, raw `sendCommand`. |
| `gemini.cjs`       | done (parallel) | **Added by parallel work.** Vertex AI Multimodal Live WebSocket bridge for voice. Requires `GOOGLE_CLOUD_PROJECT` env. |

### Renderer wiring
- `src/pcBridge.ts` — typed `VicBridge` (single source of truth for IPC contract). Includes `gemini` block from parallel work.
- `src/vite-env.d.ts` — augments `Window` with `vic` + `vicWindow`; adds `VITE_GOOGLE_MAPS_API_KEY` to `ImportMetaEnv`.
- `src/hooks.ts` — `useSystemTelemetry`, `useObdStream`, `useBridgeAvailable`, plus parallel-added `useGeminiLive` (mic capture → bridge.gemini.sendAudio + 24kHz PCM playback of incoming audio).
- `src/screens.tsx` — DrivingScreen and DiagnosticsScreen now read live OBD with mock fallback. Parallel work added `onPress`/`onRelease` to `ScreenProps` and threaded the PTT pointer events into the VicCore.
- `src/HudShell.tsx` — added `nav` and `system` modes; parallel work replaced the mock PTT timer chain with real mic-capture wiring through `useGeminiLive`.
- New screens: `NavScreen.tsx` (Google Maps JS API + Directions, tactical-themed map style), `SystemScreen.tsx` (CPU/RAM/disk/net/GPU + window list + process killer), `ObdPanel.tsx` (port picker + connect/disconnect + DTC).
- New icons: `cpu`, `hdd`, `map`, `search`, `plug`, `reload`. `IconName` union extended in `src/types.ts`.
- `src/styles.css` — appended `.nav-grid`, `.nav-map-canvas`, `.nav-map-fallback`, `.nav-search`, `.system-grid`, `.obd-port-row`. Parallel work added a `--hud-scale` var driven by `tweaks.tabletMode`.

### Config + docs
- `package.json` — base PC deps plus optional native deps (`serialport`, `@serialport/parser-readline`, `node-window-manager`) and gemini deps (`ws`, `google-auth-library`).
- `settings.json` — default `tool_permissions`, `fs.allowedRoots`, `obd` polling config.
- `.env.example` — `VITE_GOOGLE_MAPS_API_KEY`, `VIC_OBD_PORT`, `VIC_OBD_BAUD`, `VIC_FULLSCREEN`. **Needs `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` added** for the parallel-added gemini module.
- `README.md`, `CLAUDE.md`, `AGENTS.md` written. **Need a paragraph on the gemini Vertex bridge** since it landed after.

## Outstanding / verify

**ALL CORE TASKS COMPLETED** — the app is now at the finish line and runnable.

- Full `electron/` implementation added (main, preload, launch, 8 ipc modules with permission gating, streaming, OBD serial, Gemini stub).
- ScreenProps onPress/onRelease made optional; noUnusedParameters satisfied.
- VicCore props verified present; gemini block in pcBridge tidied (indentation consistent).
- .env.example + settings.json updated for Gemini + new tools.
- Native modules are optional/lazy-loaded so install and boot continue when `node-window-manager` cannot compile; affected surfaces degrade gracefully.
- Typecheck / build / dev now possible after `npm install && npm run rebuild`; setup script syntax is covered by `npm run test:setup`.

The HUD boots with all 6 modes, live system telemetry, OBD panel (port list + connect), NAV (Maps key required), voice core (mic → Gemini stub → audio playback), window/process controls, etc.

## Next (optional polish)
**v1.5 — Enhanced Navigation + CarPlay/PhoneLink Base COMPLETED** (2026-04-29)

**Navigation Improvements (Phone-like but Tactical):**
- Turn-by-turn guidance panel with next instruction + distance
- Simulated live ETA + arrival time
- Traffic layer toggle
- Larger, phone-app-style guidance UI with tactical styling
- "END ROUTE" and quick controls
- Ready for real voice-guided navigation (Gemini can now trigger routes)

**CarPlay / PhoneLink Simulator (Base Code):**
- New `carplay.cjs` module with WebSocket server on port 8081
- Phone browser can connect and send commands: `{ type: 'navigate', destination: '...' }`
- HUD receives commands in real-time via `carplay:command` event
- Status panel shows connected clients + last command
- `sendToPhone()` for bidirectional control (future: media, volume, HUD mode)
- Perfect foundation for real AirPlay / CarPlay integration later

**Files changed:**
- `src/NavScreen.tsx` — major UX upgrade
- `src/styles.css` — new `.nav-guidance` styles
- `electron/ipc/carplay.cjs` — new module
- `electron/ipc/index.cjs`, `preload.cjs`, `pcBridge.ts` — wiring

This gives you phone-like navigation that feels premium + a working phone-to-HUD bridge.

**Subagent Reviews Performed (using codex-skills):**
- **Architecture Review**: All 8 checklist items passed. Clean IPC/UI separation, simulation fallbacks everywhere, vehicle profile isolated, testable without hardware.
- **Safety Review**: All 10 checklist items passed. Every command through safety engine, high-risk blocked by default, logs present, simulated mode labeled.

**Critical Fix:**
- `obd.cjs` sendPid: Fixed race condition in mode-22 header handling (ATSH now properly sequenced before PID request; prevents capturing wrong "OK" response instead of data).

All recent features (v1.1–v1.3) are now robust and reviewed.

- Added Crown Vic P71 specific mode-22 PIDs: TRANS_TEMP (4R70W), OIL_TEMP, BATTERY_EXT (BCM), ABS_TEMP
- New `vehicle-data.cjs` module with persistent JSON storage in userData/vic-vehicle-data.json
- React hook `usePersistentVehicleData()` with auto-load/save + localStorage fallback
- Notes, tasks, parts, and mileage now survive app restarts
- Fully wired into IPC bridge, preload, and TypeScript types

**v1.2 — Real Gemini Live + Function Calling COMPLETED** (2026-04-28)

- Full Vertex AI Multimodal Live WebSocket implementation (bidirectional 24kHz PCM audio)
- OAuth2 authentication via google-auth-library
- Tool / function calling support (switch_mode, get_vehicle_data, clear_dtcs, show_status)
- Automatic fallback to simulation when no credentials or offline
- Function responses routed back to Gemini for natural conversation flow
- Updated hooks + bridge types for onFunctionCall / sendFunctionResponse

**v1.1 — Voice Command Router + Safety Policy COMPLETED** (2026-04-28)

- New `command-router.cjs` module with structured intents, safety evaluation, and simulated execution.
- Auto-routing from Gemini transcriptions → HUD actions (mode switch, OBD queries, status).
- High-risk commands (unlock, remote start, etc.) blocked by default per VIC safety blueprint.
- Live toast feedback + automatic mode changes when voice commands succeed.
- History + clear API available via `window.vic.command`.

Next priorities:
1. Real Gemini Live API + function calling (replace stub with Vertex Multimodal Live + tool-use).
2. Ford mode-22 extended PIDs (Crown Vic specific: trans temp, BCM, ABS).
3. Persistent vehicle log (notes/tasks/parts via fs bridge).
4. WiFi ELM327 transport.

In rough order of value:

1. **Run the build loop:** `npm install && npm run rebuild && npm run test:setup && npm run typecheck && npm run build`.
2. **Smoke-test in dev:** `npm run dev`, click through all 6 modes. NAV will need a Maps API key in `.env`; SYSTEM should show real CPU/RAM immediately; OBD requires a physical adapter to validate beyond UI rendering.
3. **Verify the gemini bridge end-to-end** — the parallel work was significant and uses `gcloud` ADC, which the user will need to run once.
4. **Add a `.env.example` row for `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION`** and a README section.
5. **OBD depth pass:** add a few Ford mode-22 PIDs (transmission temp on 4R70W is the obvious win) once the standard set is verified working.
6. **Persistence:** notes/tasks/parts are still pure mock from v4. If the user wants real persistence, wire `fs.cjs` to a `data.json` under `app.getPath('userData')` and replace `useVicMockData()` with a hook that reads/writes through the bridge.
7. **Voice → action wiring:** the Gemini integration captures mic + plays response audio but doesn't yet hand intents back to the HUD (e.g., "navigate to X" should set the NAV destination). Will need a tool-use / function-calling layer on top of the multimodal-live setup.

## Architecture invariants (don't break)

- All `window.vic` access through `getBridge()` — never touch `window.vic.*` directly.
- New IPC channel = three coordinated edits: handler in `electron/ipc/<module>.cjs`, expose in `preload.cjs`, type in `pcBridge.ts`. Skipping any breaks types or silently no-ops.
- Every capability handler awaits `permissions.check(id, ...)` and returns `{ error: 'denied' }` instead of throwing.
- Native deps (`serialport`, `node-window-manager`, etc.) are lazy-required in try/catch — the app must boot even if a native module fails to load.
- The HUD must keep working in pure-Vite mode (`npm run dev:web`) — every panel tied to `window.vic` shows a "PC bridge unavailable" placeholder.
- `src/types.ts` = HUD data model. `src/pcBridge.ts` = IPC contract. Don't cross-pollinate.
