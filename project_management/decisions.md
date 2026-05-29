# Decision Log

## 2026-05-03 - Use `OMNI_VIC-v1.2` As VIC/Aura Base

Decision: Use `C:\Users\ghost\PROJECTS\OMNI_VIC-v1.2` as the source for `C:\Users\ghost\PROJECTS\codexEdit_VICv1`.

Reasoning: It has the most complete combination of frontend HUD, Electron IPC, backend services, VIC agent behavior files, setup docs, and test scaffolding. The older `VIC` folder is an archive of many snapshots and is useful as reference material rather than the active base.

Consequence: Future work happens in `codexEdit_VICv1`. Useful changes from `VIC_v8.0` or other snapshots must be deliberately compared and selectively ported.

## 2026-05-03 - Exclude Generated And Secret-Prone Files From Copy

Decision: Exclude dependency folders, build outputs, virtual environments, `.env`, OAuth client files, and caches from the working copy.

Reasoning: The user requested copy-first development, but a faithful copy should not preserve local secrets or bulky generated state unless required for reproducibility.

Consequence: `npm install` and verification still need to run inside the working copy before it can be called runnable.

