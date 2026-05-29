# VIC v5 — Tactical PC HUD (GEMINI.md)

## Project Overview
`vic-tactical-pc` is a high-performance HUD (Heads-Up Display) built with **Electron**, **React 19**, **Vite**, and **TypeScript**. It extends the visual system of VIC v4 with a robust **Node.js IPC bridge**, granting the renderer permission-gated access to PC telemetry and vehicle data via OBD-II (ELM327).

### Key Features
- **Navigation:** Integrated Google Maps JS API with tactical styling.
- **OBD-II Telemetry:** Live polling of RPM, Speed, Coolant, Fuel, etc., over Serial/USB.
- **System Monitoring:** PC metrics (CPU, RAM, GPU, Disks, Network) via `systeminformation`.
- **OS Integration:** Process management, window control, file system access, and app launching.
- **Permission Model:** Every IPC action is gated by a user-configurable permission system (`settings.json`).

---

## Building and Running

### Prerequisites
- **Node.js:** v18+ recommended.
- **Google Maps API Key:** Required for the NAV screen. Set in `.env` as `VITE_GOOGLE_MAPS_API_KEY`.
- **OBD-II Adapter:** ELM327-compatible device (USB or Bluetooth/Serial).

### Setup
1. `npm install`
2. `npm run rebuild` — Rebuilds installed optional native modules for the Electron environment and skips missing optional modules.
3. `cp .env.example .env` — Configure your environment variables.

### Common Commands
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server + Electron (main dev loop). |
| `npm run dev:web` | Starts Vite only (browser-mode, `window.vic` will be unavailable). |
| `npm run test:setup` | Validates setup scripts, Electron CommonJS syntax, and voice simulation throttling. |
| `npm run typecheck` | Runs `tsc` to verify types across the project. |
| `npm run build` | Compiles the project for production. **Run before finishing tasks.** |
| `npm run rebuild` | Re-compiles installed native dependencies for Electron's Node version. |
| `npm start` | Launches Electron against the production `dist/` build. |

---

## Diagnostic Logging
Runtime logs are JSONL files under Electron `userData/logs/`; the active path is printed as `Diagnostic logging ready`. The app captures main-process failures, preload errors, renderer crashes, load failures, renderer `window.onerror` / `unhandledrejection`, React boundary errors, renderer `console.warn` / `console.error`, and Chrome console messages emitted through Electron `webContents`.

---

## Architecture

### The Three-Tier IPC Flow
1. **Main Process (`electron/ipc/*`)**: Node.js modules that perform the heavy lifting.
2. **Preload (`electron/preload.cjs`)**: A secure bridge that exposes specific channels to the renderer.
3. **Renderer (`src/pcBridge.ts`)**: A typed TypeScript interface used by React components.

### Streaming Data
Telemetry (System and OBD) uses a push model via `webContents.send`.
- **System Stream:** Managed in `electron/ipc/system.cjs`.
- **OBD Stream:** Managed in `electron/ipc/obd.cjs`.
- **Hooks:** Use `useSystemTelemetry()` and `useObdStream()` in `src/hooks.ts` to consume data.

---

## Development Conventions

### 1. Adding an IPC Capability
New capabilities must be added in three locations:
1. **Handler:** `electron/ipc/<module>.cjs` (must include `permissions.check`).
2. **Preload:** `electron/preload.cjs` (expose via `contextBridge`).
3. **Bridge Types:** `src/pcBridge.ts` (extend the `VicBridge` interface).

### 2. Permissions
- All user-facing IPC calls must be gated. 
- Rules are defined in `settings.json` under `tool_permissions`.
- Modes: `allow` (silent), `confirm` (user dialog), `deny` (blocked).

### 3. Graceful Degradation
- Always use `getBridge()` from `pcBridge.ts`.
- Ensure the app boots even if native modules (`serialport`, `node-window-manager`) fail to load by using lazy-requires and try/catch blocks. Windows-sensitive native packages should be optional dependencies.

### 4. Code Standards
- **UI:** React 19 Function Components with TypeScript.
- **IPC Types:** Keep IPC contracts in `pcBridge.ts`, and HUD-specific data models in `src/types.ts`.
- **Validation:** Always run `npm run test:setup`, `npm run typecheck`, and `npm run build` to verify changes.

---

## Key Files
- `electron/main.cjs`: Electron entry point and window lifecycle.
- `electron/ipc/`: Directory containing all capability-specific Node modules.
- `src/pcBridge.ts`: The source of truth for the renderer-main process contract.
- `src/HudShell.tsx`: The primary UI container and mode manager.
- `settings.json`: Configuration for permissions, OBD polling, and file system roots.
