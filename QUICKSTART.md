# VIC v5 — Quickstart Guide

**Get the Crown Victoria Tactical HUD running in under 10 minutes.**

---

## 1. Extract the Package

```bash
# On your mini-PC or development machine
unzip VIC_v5_v1.5_nav_carplay_20260429.zip
cd vic5
```

---

## 2. Install Dependencies (Recommended)

**One-command setup (recommended):**

```bash
npm run precheck
```

This single command will:
- Check dependencies
- Install missing packages
- Rebuild installed native modules for Electron
- Build the project
- Start VIC automatically

Alternative (manual):
```bash
npm install
```

This installs the project dependencies. Native packages such as `serialport` and `node-window-manager` are optional; if one cannot compile, VIC still installs and boots with that feature degraded.

---

## 3. Rebuild Native Modules

The setup scripts above already run this step. If running manually:

```bash
npm run rebuild
```

**Why this step matters:**
- `serialport`, `node-window-manager`, and other modules are **native** (C++ addons).
- They must be compiled against **Electron's Node ABI**, not your system Node.
- The repo wrapper rebuilds installed native modules and skips optional modules that were not installed.
- Run this after `npm install` or when you change Node/Electron versions.

### Windows Users — Extra Step Required

If you need the full native feature set and see errors about `node-gyp`, `Visual Studio`, or `extract-file-icon`, install:

1. Download **Visual Studio Build Tools 2022** (free):
   - Go to: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Or direct link: https://aka.ms/vs/17/release/vs_buildtools.exe

2. During installation, select the workload:
   - **"Desktop development with C++"**

3. After installation completes, **restart your terminal** (PowerShell or CMD), then run:

```powershell
npm install
npm run rebuild
```

Without this toolset, `node-window-manager` may be skipped and SYSTEM window controls will be unavailable, but the HUD can still run.

---

## 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add at minimum:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
GOOGLE_CLOUD_PROJECT=your-gcp-project-id          # for real Gemini voice
GOOGLE_CLOUD_LOCATION=us-central1
```

**Optional but recommended:**
```env
VIC_FULLSCREEN=true
VIC_OBD_PORT=/dev/ttyUSB0          # or COM3 on Windows
VIC_OBD_BAUD=38400
```

---

## 5. Run VIC

```bash
npm run dev
```

The app should launch in ~8–12 seconds.

**First launch checklist:**
- [ ] All 6 modes appear in the bottom bar (DRIVING / NAV / PARKED / DIAGNOSTICS / SYSTEM / AMBIENT)
- [ ] SYSTEM mode shows live CPU/RAM/GPU stats
- [ ] NAV mode loads Google Maps (if key is valid)
- [ ] Hold **SPACE** → mic activates (voice input)
- [ ] Try saying: *"switch to diagnostics"* or *"what is my coolant temperature"*

If VIC crashes or the renderer shows a blank/failure screen, check the JSONL log path printed in the terminal as `Diagnostic logging ready`. Logs include Chrome console errors, renderer crashes, preload errors, and unhandled renderer/main exceptions.

---

## 6. Connect Real Hardware (Optional but Powerful)

### OBD-II (ELM327)
1. Plug in your ELM327 adapter (USB or Bluetooth).
2. In **DIAGNOSTICS** mode → click **LIST PORTS**.
3. Select your adapter and click **CONNECT**.
4. You should see live RPM, Speed, Coolant, Fuel, Battery, **Transmission Temp** (Crown Vic specific), etc.

### Voice + Gemini (Real AI)
1. Make sure you ran `gcloud auth application-default login` on the machine.
2. Set `GOOGLE_CLOUD_PROJECT` in `.env`.
3. Hold SPACE and speak naturally — VIC now uses **real Vertex AI Multimodal Live**.

---

## 7. PhoneLink / CarPlay Simulator (New in v1.5)

```bash
# In the app, go to any screen
# Open a terminal on the same machine or your phone's browser:
wscat -c ws://localhost:8081
# or use browser console:
const ws = new WebSocket('ws://YOUR_MINI_PC_IP:8081');
ws.send(JSON.stringify({ type: 'navigate', destination: 'nearest gas station' }));
```

The HUD will instantly react to commands sent from your phone.

---

## 8. Production / Mini-PC Deployment

```bash
npm run build
npm run test:setup
npm run start          # runs the built app
```

**Recommended for vehicle use:**
- Add to autostart (systemd, Windows Task Scheduler, or `~/.config/autostart`)
- Set `VIC_FULLSCREEN=true` in `.env`
- Use a 10–15" touchscreen + USB ELM327
- Optional: `npm run rebuild` once, then copy the `dist/` + `node_modules/` to the mini-PC

---

## Troubleshooting

| Problem                              | Solution |
|--------------------------------------|----------|
| **`npm run rebuild` skips `node-window-manager`** | Install Visual Studio Build Tools 2022 with "Desktop development with C++", then run `npm install` and `npm run rebuild` |
| `electron-rebuild` not recognized    | Run `npm install`, then use `npm run rebuild`; the repo wrapper calls the local binary |
| Serialport / native module errors    | Make sure Visual Studio C++ workload is installed, then run `npm install` and `npm run rebuild` |
| SYSTEM window list unavailable       | `node-window-manager` was not installed or failed to load; install the C++ toolset and rebuild |
| Google Maps not loading              | Check `.env` has valid `VITE_GOOGLE_MAPS_API_KEY` and restart `npm run dev` |
| Voice not working                    | Run `gcloud auth application-default login` and set `GOOGLE_CLOUD_PROJECT` in `.env` |
| App crashes / blank screen           | Open the JSONL file shown by `Diagnostic logging ready`; it captures Chrome console errors and renderer/main crashes |
| App is tiny / wrong scale            | Use the **Tweaks** panel (gear icon) → Tablet Mode or adjust HUD Scale |
| OBD shows "NO DATA"                  | Try different baud rate (38400 or 115200), or use a known-good ELM327 clone |
| Port permission denied (Linux)       | `sudo chmod 666 /dev/ttyUSB0` (temporary) or add udev rule |

---

## Keyboard Shortcuts

| Key          | Action |
|--------------|--------|
| `SPACE`      | Hold for voice input (PTT) |
| `1–6`        | Switch modes directly |
| `F11`        | Toggle fullscreen |
| `Ctrl + R`   | Reload (dev only) |
| `Esc`        | Close current panel / end route |

---

## Next Steps After First Run

1. **Wire persistence** — notes/tasks/parts now survive restarts (use the `usePersistentVehicleData` hook in any screen).
2. **Add your own voice commands** — edit `electron/ipc/command-router.cjs`.
3. **Customize palettes** — 5 tactical themes included, or create your own in `src/palettes.ts`.
4. **Deploy to vehicle** — see the mini-PC section above.

---

**You're now running VIC v1.5** — the most complete tactical HUD for a 2008 Crown Victoria Police Interceptor.

Questions? Check `PROGRESS.md` for the full feature list or open an issue in your repo.

**Drive safe. VIC is standing by.** 🚔
