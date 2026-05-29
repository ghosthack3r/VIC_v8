# VIC/Aura Backlog

Status values: `todo`, `doing`, `blocked`, `done`.

## P0 - Protect And Boot

| Status | Task | Notes |
| --- | --- | --- |
| done | Secret scan copied tree | PowerShell scan found key-shaped values in `.env.example`; placeholders were restored and the follow-up scan reported no secret-pattern hits in scanned text files. |
| todo | Rotate previously exposed credentials | Older action notes identify Google/Gemini/Maps/OAuth credentials as compromised. User action required in Google consoles. |
| ready | Initialize local Git baseline | Copied tree passed the local secret-pattern scan; initialize Git when we start implementation work. |
| done | Install dependencies | `npm install` passed after aligning React/React DOM to 18.3.x for `@react-three/drei@9.x` peer compatibility. npm reports 8 audit vulnerabilities. |
| done | Verify setup tests | `npm run test:setup` passed on 2026-05-03 and 2026-05-06. |
| done | Verify TypeScript/build | `npm run typecheck` and `npm run build` passed on 2026-05-03 and 2026-05-06. |
| done | Smoke-test browser fallback | `npm run dev:web` is running at `http://127.0.0.1:5173`; HTTP check returned 200 and Playwright smoke rendered VIC HUD text with no console errors on 2026-05-06. |
| done | Smoke-test Electron shell | `npm start` launched the Electron production app from `dist/` on 2026-05-06; window title detected as `VIC - Vehicle Intelligence Core`. |
| done | Backend health endpoint | Electron-started backend returned HTTP 200 from `http://127.0.0.1:8000/status` on 2026-05-06. |

## P1 - Car-Ready Loop

| Status | Task | Notes |
| --- | --- | --- |
| doing | Voice simulation and real Gemini audit | Missing `GEMINI_API_KEY` no longer crashes backend startup. Next: test push-to-talk with real credentials and confirm clear degraded UI without them. |
| doing | Navigation degraded-mode test | Maps loader now uses `loading=async`, GPS timeout degrades in UI instead of console warnings, and missing/invalid-key behavior still needs a live key/no-key pass. |
| todo | OBD adapter path | Verify UI and mock fallback now; test physical ELM327 when hardware is available. |
| todo | Startup/autostart plan | Define mini-PC startup path for travel use; current manual relaunch is `$env:VIC_FULLSCREEN="1"; npm start`. |
| todo | Driver safety review | Ensure high-risk commands stay blocked or confirmed; no distracting UI states while driving. |
| blocked | Dependency audit triage | `npm audit` reports 8 vulnerabilities. `npm audit fix` did not resolve them without major upgrades; `electron@41.5.0` and `@electron/rebuild@4.0.4` require a planned compatibility pass. |

## P2 - Product Polish

| Status | Task | Notes |
| --- | --- | --- |
| todo | Compare `VIC_v8.0` | Mine useful newer HUD changes without replacing the OMNI backend base blindly. |
| todo | Project report automation | Generate report JSON/HTML from backlog and risk files. |
| done | Backend health endpoint | Current backend exposes `/status`; report `2026-05-06-tonight-bringup.md` records the verified response. |
| todo | Persistent vehicle profile review | Confirm notes/tasks/parts/mileage persistence path and backup behavior. |
| todo | Migrate Google Maps routing API | Replace deprecated `DirectionsService` / `DirectionsRenderer` with the Routes Library `Route.computeRoutes()` plus `createPolylines()` / `createWaypointAdvancedMarkers()`. Google says legacy routing continues for now, so this is not a tonight blocker. |
