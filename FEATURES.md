# VIC — Feature Registry

Status key: ✅ Implemented · 🔧 Partial / needs wiring · 🗓 Planned · ❌ Removed / not yet started

---

## CORE SHELL

| Feature | Status | Notes |
|---|---|---|
| Electron app wrapper (frameless, fullscreen) | ✅ | `electron/main.cjs` |
| Auto-start Python backend on launch | ✅ | Spawns `backend/server.py` via `main.cjs` |
| Mode switcher (Parked / Driving / Navigation / Ambient) | ✅ | `ModeNav.tsx` + `App.tsx` |
| VIC orb (animated idle / listening / thinking / speaking) | ✅ | `VicOrb.tsx`, `VicCore.tsx` |
| Live clock display | ✅ | `ClockDisplay.tsx` |
| Tactical corner ticks + scanline overlay | ✅ | `HudShell.tsx` |
| Grid overlay background | ✅ | CSS via `styles.css` |
| Toast notification system | ✅ | `App.tsx` — flash with auto-dismiss |
| Error boundary + renderer crash logging | ✅ | `ErrorBoundary.tsx`, `errorLogging.ts` |
| Palette / theme switcher (teal, amber, red, violet) | ✅ | `TweaksPanel.tsx`, `palettes.ts`, `hudTheme.tsx` |
| HUD scale control | ✅ | `TweaksPanel.tsx` |
| Tweaks panel (settings panel) | ✅ | `TweaksPanel.tsx` |
| Electron IPC bridge (preload, context isolation) | ✅ | `electron/preload.cjs`, `pcBridge.ts` |
| Dev tools in development mode | ✅ | Auto-opens in detached window |
| Responsive / breakpoint layout | ✅ | `styles.css` media queries |

---

## VOICE ASSISTANT (ADA / VIC)

| Feature | Status | Notes |
|---|---|---|
| Gemini Live voice session (PCM16 duplex audio) | ✅ | `backend/ada.py`, model: gemini-2.5-flash-native-audio |
| Push-to-talk via spacebar | ✅ | `App.tsx` keydown/keyup listeners |
| Push-to-talk via VicOrb click/hold | ✅ | Parked, Driving, Ambient modes |
| Mic arm/disarm toggle | ✅ | Header badge click |
| Input audio transcription (streaming) | ✅ | `output_audio_transcription={}` in `ada.py` config |
| Output audio transcription (streaming) | ✅ | Reply shown in ParkedMode / DrivingMode |
| TTS voice — "Kore" | ✅ | `speech_config` in `ada.py` |
| System instruction / personality ("Ada, call user Sir") | ✅ | `ada.py` `config` block |
| Gemini function calling (tool use) | ✅ | Tool declarations in `ada.py` |
| Tool permission gating | ✅ | `settings.json` + `server.py` |
| Tool confirmation popup (approve/deny) | ✅ | `ConfirmationPopup.jsx` (backend wired, frontend dormant) |
| Send text to session | ✅ | `socket.emit('send_text')` in `server.py` |
| Audio visualizer (AI response bars) | ✅ | `Visualizer.jsx`, `TopAudioBar.jsx` (present, not mounted) |
| Mic audio visualizer | 🔧 | `analyserRef` chain exists in ada_v2; not yet wired into VIC shell |
| Multi-turn memory (project-based) | ✅ | `project_manager.py` |
| Video frame input to Gemini (camera context) | 🗓 | Ada_v2 had it; not wired into VIC |
| Wake word ("VIC") | 🗓 | Ambient mode footer mentions it; not yet implemented |
| Voice-triggered mode switching | 🗓 | `switch_mode` command routing exists in `App.tsx`; needs Gemini tool declaration |
| Electron IPC Gemini route (no Python) | 🔧 | `electron/ipc/gemini.cjs` exists from v80; currently unused (Python backend preferred) |

---

## NAVIGATION

| Feature | Status | Notes |
|---|---|---|
| Google Maps (tactical dark style) | ✅ | `NavigationMode.tsx` — full JS API |
| Geolocation — center map on user | ✅ | `getCurrentPosition` on load |
| Destination search + routing | ✅ | Directions API, polyline rendered |
| Turn-by-turn guidance panel | ✅ | First step shown with ETA |
| Traffic toggle | ✅ | State tracked; `trafficLayer` hookup ready |
| End route | ✅ | Clears renderer + state |
| Open in browser (deep link) | ✅ | `window.open` / Electron bridge |
| GPS origin readout | ✅ | Lat/lng displayed |
| Custom HUD zoom controls | ✅ | ± buttons overlay |
| Tactical corner ticks on map | ✅ | CSS overlay |
| Route summary overlay | ✅ | Duration + distance bar |
| Real-time re-routing | ❌ | Would need periodic `directionsService.route` calls |
| Speed limit overlay | ❌ | Not exposed in Maps JS API |
| Address autocomplete | 🗓 | Places API is loaded; just needs `Autocomplete` widget |

---

## OBD-II / VEHICLE TELEMETRY

| Feature | Status | Notes |
|---|---|---|
| ELM327 serial connection | ✅ | `electron/ipc/obd.cjs` |
| Live OBD stream (RPM, speed, coolant, fuel, battery, throttle, MAF) | ✅ | `useObdStream` hook in `hooks.ts` |
| OBD values in Header stats bar | ✅ | Teal highlight when live |
| OBD values in Driving Mode speedometer | ✅ | Arc, RPM bar, fuel bar animate from live data |
| Port selection at runtime | ✅ | `ObdPanel.tsx` |
| OBD status badge (LIVE / OFFLINE) | ✅ | Header |
| Tire pressure (TPMS) | ❌ | Not a standard OBD-II PID on most vehicles |
| DTC fault code reader | 🗓 | OBD supports it; needs UI panel |
| Trip computer (avg speed, fuel economy) | 🗓 | Can be derived from live OBD data |

---

## CAD AGENT

| Feature | Status | Notes |
|---|---|---|
| Gemini 2.5 Pro CAD script generation (build123d) | ✅ | `backend/cad_agent.py` |
| Streaming AI thoughts during generation | ✅ | `cad_thought` socket event |
| Auto-retry on build failure (up to 3 attempts) | ✅ | Retry loop in `cad_agent.py` |
| STL export | ✅ | `export_stl(result_part, 'output.stl')` |
| 3D model viewer (Three.js) | ✅ | `CadWindow.jsx` (present, not mounted in VIC shell) |
| CAD iteration ("make it taller") | ✅ | `iterate_cad` tool in `ada.py` |
| Project-based STL storage | ✅ | `project_manager.py` |
| STEP / IGES export | ❌ | build123d supports it; not wired |
| Live wireframe preview during generation | ❌ | Would need streaming geometry chunks |

---

## WEB AGENT

| Feature | Status | Notes |
|---|---|---|
| Playwright browser automation | ✅ | `backend/web_agent.py` |
| Gemini computer-use model driving browser | ✅ | `gemini-2.5-computer-use-preview` |
| Live browser screenshots streamed to frontend | ✅ | `browser_frame` socket event |
| Browser window panel | ✅ | `BrowserWindow.jsx` (present, not mounted) |
| Open URL via Electron bridge | ✅ | `getBridge().apps.openUrl()` |

---

## SMART HOME (KASA)

| Feature | Status | Notes |
|---|---|---|
| TP-Link Kasa device discovery | ✅ | `backend/kasa_agent.py` |
| Turn on/off lights and plugs | ✅ | `control_light` tool |
| Set brightness + color | ✅ | KL135 bulb support |
| Device list from settings.json | ✅ | `kasa_devices` array |
| Kasa control panel UI | ✅ | `KasaWindow.jsx` (present, not mounted) |
| Voice control of lights | ✅ | Via Gemini `control_light` function call |
| Scene presets (e.g. "movie mode") | 🗓 | Would need multi-device batch commands |
| Energy monitoring | 🗓 | Kasa plugs support it; not wired |

---

## 3D PRINTING

| Feature | Status | Notes |
|---|---|---|
| Printer discovery (mDNS / Zeroconf) | ✅ | `backend/printer_agent.py` |
| OctoPrint API support | ✅ | REST API client in `printer_agent.py` |
| Moonraker / Klipper support | ✅ | REST API client |
| PrusaLink support | ✅ | REST API client |
| Print STL (auto-slice + upload) | ✅ | `print_stl` tool |
| Print status (progress, temps, state) | ✅ | `get_print_status` tool |
| Printer panel UI | ✅ | `PrinterWindow.jsx` (present, not mounted) |
| Slicer profile selection | ✅ | `profile` param in `print_stl` |
| Pause / resume / cancel print | 🗓 | API calls exist in Moonraker; not wired as tools |
| Camera feed from printer | 🗓 | `camera_url` field in settings; not streamed yet |
| Voice: "print the current model" | ✅ | `print_stl` with `stl_path='current'` |

---

## SYSTEM DIAGNOSTICS

| Feature | Status | Notes |
|---|---|---|
| CPU usage, load, cores | ✅ | `useSystemTelemetry` hook → `systeminformation` |
| RAM usage | ✅ | As above |
| Disk usage | ✅ | As above |
| GPU info | ✅ | As above |
| Network rx/tx | ✅ | As above |
| Battery status | ✅ | As above |
| Diagnostics screen | ✅ | `DiagnosticsApp.tsx` |
| Log viewer | ✅ | `tools/logviewer.html` |
| Process list | ✅ | `electron/ipc/processes.cjs` |

---

## SECURITY / AUTH

| Feature | Status | Notes |
|---|---|---|
| Face authentication (MediaPipe) | ✅ | `backend/authenticator.py`, `AuthLock.jsx` |
| Face auth toggle in settings | ✅ | `settings.json` `face_auth_enabled` |
| Tool permission gates | ✅ | Per-tool on/off in `settings.json` |
| Confirmation popup before dangerous tools | ✅ | `ConfirmationPopup.jsx`, `on_tool_confirmation` callback |
| Reference image enrollment | 🗓 | Needs UI; currently requires placing `reference.jpg` manually |

---

## UI / UX

| Feature | Status | Notes |
|---|---|---|
| Parked mode (clock + VicOrb + info cards) | ✅ | `ParkedMode.tsx` |
| Driving mode (speedometer arc + RPM bar + OBD) | ✅ | `DrivingMode.tsx` |
| Navigation mode (tactical Google Maps) | ✅ | `NavigationMode.tsx` |
| Ambient mode (particles + clock + music stub) | ✅ | `AmbientMode.tsx` |
| iOS-style dock taskbar | ✅ | `Taskbar.tsx` with magnification |
| App overlay system (DiagnosticsApp) | 🔧 | Only Diagnostics wired; others are stubs |
| Hand gesture cursor control | 🗓 | `ada_v2` had full MediaPipe hand tracking; not yet in VIC |
| Drag-to-reposition windows (modular mode) | 🗓 | Ada_v2 had it; not in VIC |
| Music player (real playback) | 🗓 | Ambient mode has UI stub; no audio source wired |
| CarPlay / Android Auto integration | 🗓 | `electron/ipc/carplay.cjs` stub exists |
| Notification system | 🗓 | `electron/ipc/notifications.cjs` exists |
| OBD panel (port picker) | ✅ | `ObdPanel.tsx` |

---

## BACKEND / INFRA

| Feature | Status | Notes |
|---|---|---|
| FastAPI server | ✅ | `backend/server.py` |
| Socket.IO (async) | ✅ | `python-socketio` + `uvicorn` |
| CORS open (dev) | ✅ | `cors_allowed_origins='*'` |
| Settings load/save (JSON) | ✅ | `load_settings()` / `save_settings()` |
| Graceful SIGINT / SIGTERM shutdown | ✅ | `signal_handler` in `server.py` |
| Python auto-start from Electron | ✅ | `electron/main.cjs` `startPythonBackend()` |
| `.env` config (GEMINI_API_KEY, Maps key, OBD port) | ✅ | `.env.example` documents all keys |
| Electron IPC bridge (preload + contextBridge) | ✅ | `electron/preload.cjs` |
| Logging (main process + renderer) | ✅ | `electron/logger.cjs`, `errorLogging.ts` |
| Packaged build (dist) | 🔧 | `vite build` works; Electron packaging not set up |

---

## QUICKSTART

```bash
# 1. Install frontend deps
npm install

# 2. Install Python backend deps
pip install -r backend/requirements.txt
playwright install chromium   # for web agent

# 3. Configure
cp .env.example .env
# → add GEMINI_API_KEY and VITE_GOOGLE_MAPS_API_KEY

# 4. Run (starts both Electron + Python backend)
npm run dev:full

# OR: frontend only (no backend features)
npm run dev
```
