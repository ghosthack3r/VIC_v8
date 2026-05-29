# Risk Register

Date opened: 2026-05-03

| ID | Severity | Risk | Current control | Next action |
| --- | --- | --- | --- | --- |
| R-001 | critical | Older project notes identify exposed Google/Gemini/Maps/OAuth credentials. | `.env` and `client_secret_*` were excluded from the new copy; copied `.env.example` was sanitized and follow-up scan found no secret-pattern hits in scanned text files. | User should rotate/revoke old credentials before real cloud use. |
| R-002 | high | Multiple VIC snapshots make source-of-truth ambiguous. | `OMNI_VIC-v1.2` selected as active base and copied to `codexEdit_VICv1`. | Compare `VIC_v8.0` only as a reference task. |
| R-003 | low | Electron shell needs continued smoke coverage after launch-path fixes. | `npm start` now launches Electron from `dist/`; Electron window title, backend status, and browser fallback were verified on 2026-05-06. | Re-test after any Electron/preload/backend change. |
| R-004 | medium | Native Electron modules may fail without Windows C++ build tools. | Optional modules are expected to degrade gracefully. | Record install warnings and decide if native features are needed for travel. |
| R-005 | medium | Real Maps/Gemini features depend on user-managed cloud credentials. | `.env.example` uses placeholders; missing `GEMINI_API_KEY` no longer crashes backend imports/startup. | Rotate old credentials, then test real voice and Maps with a local `.env`. |
| R-006 | medium | Driving UI could become distracting if features expand without safety review. | Existing docs emphasize safety gates and confirmation. | Add safety review to every voice/navigation/OBD change. |
| R-007 | high | npm reports 8 audit vulnerabilities after install: Electron, tar, and Electron rebuild dependency chain issues. | Install/build/typecheck currently pass; `npm audit fix` did not resolve issues without major upgrades; no force upgrade applied. | Plan a compatibility pass for `electron@41.5.0` and `@electron/rebuild@4.0.4`, then rerun native rebuild and Electron smoke tests. |
