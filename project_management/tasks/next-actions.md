# Next Actions

Date: 2026-05-06

1. Keep the current tonight runtime available: Electron production app, backend `127.0.0.1:8000`, and browser fallback `127.0.0.1:5173`.
2. Add real local `.env` values only after rotating old Google/Gemini/Maps/OAuth credentials.
3. Test push-to-talk with a real `GEMINI_API_KEY`; confirm missing-key mode stays non-crashing.
4. Test NAV degraded mode without a Maps key, then real route rendering with `VITE_GOOGLE_MAPS_API_KEY`.
5. Test OBD unavailable behavior, then connect a physical ELM327 adapter.
6. Create a Windows startup/autostart path for the travel machine.
7. Initialize Git in the working copy and create a baseline commit if desired.
8. Inspect full `npm audit` output and choose targeted development dependency fixes.
