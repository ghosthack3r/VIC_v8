# Tonight Bring-Up Report - VIC/Aura

Date: 2026-05-06
Working copy: `C:\Users\ghost\PROJECTS\codexEdit_VICv1`

## Executive Status

VIC is up tonight in the safe `codexEdit_` working copy.

- Electron window is running from the production build with title `VIC - Vehicle Intelligence Core`.
- Backend sidecar is running at `http://127.0.0.1:8000/status`.
- Browser fallback is running at `http://127.0.0.1:5173/`.

This is a minimal verified bring-up, not a full road-ready release. Missing cloud credentials now degrade instead of crashing startup.

## Fixes Applied

- `electron/main.cjs`: production launch now respects `ELECTRON_IS_DEV=0`, so `npm start` can load `dist/index.html` instead of requiring Vite.
- `backend/ada.py`: no longer constructs the Gemini client at import time when `GEMINI_API_KEY` is missing.
- `backend/web_agent.py`: no longer raises during module import when `GEMINI_API_KEY` is missing.
- `backend/cad_agent.py`: CAD generation/iteration now reports unavailable status when `GEMINI_API_KEY` is missing instead of crashing initialization.
- `src/App.tsx`: active push-to-talk capture now uses `AudioWorkletNode` when available, with `ScriptProcessorNode` only as an older-browser fallback.
- `src/components/modes/DrivingMode.tsx`: speedometer dash animation now starts from a numeric `strokeDashoffset`.
- `src/components/modes/NavigationMode.tsx`: Google Maps loader includes `loading=async`, and geolocation timeout now degrades through UI status instead of console warnings.

## Verified This Run

- `npm run test:setup` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `python -c "import server; print('server import ok')"` passed without `GEMINI_API_KEY`.
- `http://127.0.0.1:8000/status` returned `{"status":"running","service":"A.D.A Backend"}`.
- `http://127.0.0.1:5173/` returned HTTP 200.
- Playwright browser smoke found full-root rendering, visible VIC HUD text, and no console errors.
- Screenshot artifact: `output/playwright/vic-web-smoke.png`.
- Follow-up console smoke after pressing Space found no page errors, no `strokeDashoffset` warning, and no `ScriptProcessorNode` warning in a clean browser. Screenshot artifact: `output/playwright/vic-console-cleanup-smoke.png`.

## Current Runtime

- Electron production app: running windowed for desktop safety.
- Backend: listening on `127.0.0.1:8000`.
- Browser fallback: listening on `127.0.0.1:5173`.

If the current processes are closed, relaunch with:

```powershell
cd C:\Users\ghost\PROJECTS\codexEdit_VICv1
$env:VIC_FULLSCREEN="0"
npm start
```

For vehicle fullscreen after you are ready:

```powershell
cd C:\Users\ghost\PROJECTS\codexEdit_VICv1
$env:VIC_FULLSCREEN="1"
npm start
```

Browser fallback:

```powershell
cd C:\Users\ghost\PROJECTS\codexEdit_VICv1
npm run dev:web
```

Then open `http://127.0.0.1:5173/`.

## Known Degraded Areas

- Real Gemini/ADA voice, CAD generation, and web-agent functions need `GEMINI_API_KEY`.
- NAV maps need `VITE_GOOGLE_MAPS_API_KEY`.
- Google Maps `DirectionsService` / `DirectionsRenderer` are deprecated but still supported; migrating to the newer Routes Library is tracked in backlog.
- OBD live data still needs a physical ELM327 adapter test.
- Kasa/device network lookups may timeout when devices are unavailable; this did not block backend startup.
- Older exposed credentials still need rotation before real cloud use.

## Next Actions

1. Add real local `.env` values only after rotating old credentials.
2. Test push-to-talk behavior with `GEMINI_API_KEY` set.
3. Test NAV degraded mode and then real Maps with a valid key.
4. Test OBD unavailable behavior, then physical ELM327 connection.
5. Create a simple Windows startup/autostart path for the travel machine.
