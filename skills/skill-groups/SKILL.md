---
name: skill-groups
description: Use when the user wants to inspect, organize, enable, disable, slim down, or selectively activate installed skills by related capability area.
---

# Skill Groups

## Overview

Use this skill to reason about skills as related groups instead of one long flat list. It provides a stable grouping reference and a conservative workflow for future enable/disable operations.

## Core Rules

- Read `references/groups.md` before proposing group changes.
- Treat group changes as configuration changes: show the affected skills and source locations before moving or disabling anything.
- Only personal/local skill folders are safe toggle candidates by default.
- Do not move plugin cache, bundled runtime, or system skill directories. Report the plugin or source that should be disabled instead.
- Never disable safety/process skills such as debugging, TDD, verification, or skill management unless the user explicitly names them.
- Tell the user that skill availability may require a new session or reload after filesystem changes.

## Toggle Policy

Use these source classes when deciding whether a group can be enabled or disabled:

| Source | Example | Policy |
| --- | --- | --- |
| Personal | `C:\Users\ghost\.agents\skills\<name>` | Safe to toggle after explicit approval |
| Local Codex | `C:\Users\ghost\.codex\skills\<name>` | Toggle only after approval; avoid `.system` |
| System | `C:\Users\ghost\.codex\skills\.system\<name>` | Do not move |
| Plugin cache | `C:\Users\ghost\.codex\plugins\cache\...` | Do not move; recommend disabling the plugin |
| Project copy | Repository `skills/<name>` | Reviewable source, not automatically active |

## Workflow

1. Inventory current skills if the user asks for current state. Prefer `rg --files -g SKILL.md` or a targeted PowerShell `Get-ChildItem`.
2. Load `references/groups.md`.
3. Resolve requested group names or aliases.
4. Split affected skills into personal/local toggle candidates and plugin/system managed skills.
5. Present the exact affected skills and directories.
6. Ask for explicit approval before moving personal/local skill folders.
7. If approved, move disabled skills into a sibling disabled directory such as `.agents/skills.disabled/<name>`, preserving folder contents.
8. Re-run a simple inventory check and report what changed.

## Group Reference

Primary group definitions live in `references/groups.md`. Keep this file updated when new skills are installed, removed, or renamed.
