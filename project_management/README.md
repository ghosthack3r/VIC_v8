# VIC Project Management Hub

Created: 2026-05-03

This folder is the operating center for `codexEdit_VICv1`. It tracks decisions, risks, backlog, reports, and subagent roles so VIC/Aura work stays reviewable while the application evolves.

## Current Priority

Get VIC/Aura reliable enough for near-term car travel:

1. Remove or isolate credential risk.
2. Restore a repeatable install/build/run loop.
3. Verify Electron, web fallback, backend, voice simulation, navigation fallback, and OBD UI behavior.
4. Keep every change inside the `codexEdit_` working copy unless the user explicitly chooses to promote it.

## Key Files

- `report_viewer.html` - local review page for status, risks, and next actions.
- `reports/2026-05-03-kickoff.md` - first project status report.
- `tasks/backlog.md` - prioritized task board.
- `tasks/next-actions.md` - short execution checklist.
- `risks.md` - active risk register.
- `decisions.md` - project decision log.
- `subagents/roster.md` - small supporting team model.

## Working Rule

No autonomous edits go into original project folders. Development work happens in a copied folder with a `codexEdit_` prefix first.

