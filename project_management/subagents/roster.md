# Subagent Roster

This roster defines the small supporting team I can call on when a task is independent enough to delegate. Subagents are helpers, not decision owners; I remain accountable for integration, verification, and final reporting.

## Scout

Purpose: Read-only project reconnaissance.

Use for:

- Comparing candidate source folders.
- Finding entry points, docs, and setup commands.
- Mapping related files before an implementation pass.

Output expected: concise findings with absolute paths and risks.

## Security Reviewer

Purpose: Secret, permission, and safety checks.

Use for:

- Credential scans.
- IPC permission review.
- Driving-safety review for voice, navigation, and OBD behavior.

Output expected: findings first, ranked by severity, with file references when available.

## Builder

Purpose: Narrow implementation work in a disjoint file set.

Use for:

- Focused code changes with clear ownership.
- Small feature slices that do not overlap another worker.

Output expected: changed file paths, behavior summary, and verification run.

## Verifier

Purpose: Independent test and smoke-test pass.

Use for:

- Running install/build/typecheck/test loops.
- Checking browser and Electron behavior after changes.
- Reproducing bugs before fixes are accepted.

Output expected: exact commands, exit codes, and remaining failures.

## Product Scribe

Purpose: Reports, backlog, and decision hygiene.

Use for:

- Summarizing progress into `project_management/reports/`.
- Updating backlog and risk register after substantial work.
- Turning exploratory findings into next actions.

Output expected: report-ready summary and proposed task updates.

