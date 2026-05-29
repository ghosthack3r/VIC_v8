# VIC/Aura Operating Model

Date: 2026-05-03

## Product Goal

VIC/Aura should become a dependable in-car assistant for travel-heavy work periods. Near-term value is not a broad feature list; it is a reliable car-ready loop for voice, navigation, vehicle telemetry, safety, and startup.

## Priority Ladder

1. Safety and secrets.
2. Install/build/run repeatability.
3. Browser fallback and Electron shell health.
4. Voice simulation and real cloud setup path.
5. Navigation degraded mode and real Maps setup path.
6. OBD UI and physical adapter path.
7. Mini-PC startup and car deployment.
8. Product polish.

## Definition Of Done For VIC Changes

A VIC change is only complete when:

- It was made in `codexEdit_VICv1` or another approved `codexEdit_` copy.
- App source changes follow `AGENTS.md` architecture rules.
- IPC changes update handler, preload, and bridge types together.
- Native modules remain optional or fail gracefully.
- Browser-only Vite mode still works for bridge consumers.
- Relevant checks are run and recorded.
- The report/backlog/risk files are updated if project state changed.

## Driving-Specific Bias

When choosing between two useful tasks, prefer the task that improves:

- Reliable startup.
- Hands-free interaction.
- Navigation clarity.
- Vehicle health visibility.
- Failure behavior when cloud services, Maps, OBD, or native modules are unavailable.

Avoid adding distracting UI or high-risk commands without a safety review.

