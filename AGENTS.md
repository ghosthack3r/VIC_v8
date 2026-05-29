# Repository Guidelines

## Project Structure & Module Organization

`vic-tactical-pc` is a Vite + React 19 + TypeScript HUD packaged with Electron. Renderer code lives in `src/`: HUD primitives, screens, hooks, palettes, and typed bridge contracts. Electron entry points and IPC handlers live in `electron/`; capability modules are under `electron/ipc/` and should stay one capability per file. Agent configuration assets live in `vic-agent/`. Utility scripts are in `scripts/`, and runtime defaults are in `settings.json`.

## Build, Test, and Development Commands

- `npm install`: install dependencies.
- `npm run rebuild`: rebuild native Electron modules after installs or Electron upgrades.
- `npm run dev:web`: start Vite only at `127.0.0.1`, without Electron IPC.
- `npm run dev`: run Vite and the Electron shell together.
- `npm run typecheck`: run TypeScript references with `tsc -b`.
- `npm run test:setup`: validate setup scripts, Electron CommonJS syntax, and voice simulation throttling.
- `npm run build`: typecheck and create the production Vite build.
- `npm run preview`: preview the built web bundle.
- `npm start`: launch Electron against `dist/`.

Run `npm run test:setup`, `npm run typecheck`, and `npm run build` before claiming code changes are complete.

## Coding Style & Naming Conventions

Use TypeScript and React function components in `src/`; use CommonJS for Electron files. Follow existing two-space indentation, single quotes, and semicolon usage. Keep renderer access to native features behind `getBridge()` from `src/pcBridge.ts`; do not call `window.vic` directly. When adding IPC, update all three surfaces together: the handler in `electron/ipc/<module>.cjs`, the preload exposure in `electron/preload.cjs`, and the `VicBridge` types in `src/pcBridge.ts`.

## Testing Guidelines

There is no broad test suite. Treat `npm run test:setup`, `npm run typecheck`, and `npm run build` as required checks. For OBD work, smoke-test with an ELM327 adapter when available, or mock `serialport`. Verify plain web fallback behavior with `npm run dev:web` when touching bridge consumers.

## Commit & Pull Request Guidelines

Git history is not available in this workspace, so use clear, imperative commits such as `Add OBD coolant PID` or `Fix system telemetry cleanup`. Pull requests should include a behavior summary, linked issue or task, verification commands, and screenshots or recordings for visible HUD changes.

## Security & Configuration Tips

Do not commit `.env` files or personal keys. Google Maps uses `VITE_GOOGLE_MAPS_API_KEY`. Every new IPC handler must call `permissions.check('id', { summary, detail })` and add a default `settings.json` rule under `tool_permissions`, using `confirm` unless the operation is low-risk read-only.
