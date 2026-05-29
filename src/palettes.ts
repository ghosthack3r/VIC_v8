import type { CSSProperties } from 'react';
import type { PaletteId } from './types';

export interface HudPalette {
  id: PaletteId;
  primary: string;
  primaryDim: string;
  accent: string;
  glow: string;
}

export const HUD_PALETTES: Record<PaletteId, HudPalette> = {
  cyan: {
    id: 'cyan',
    primary: '#7fe3ff',
    primaryDim: '#2a7d9c',
    accent: '#00ffd0',
    glow: 'rgba(127, 227, 255, 0.55)',
  },
  amber: {
    id: 'amber',
    primary: '#ffb95c',
    primaryDim: '#8a5a1c',
    accent: '#ffea7b',
    glow: 'rgba(255, 185, 92, 0.55)',
  },
  phosphor: {
    id: 'phosphor',
    primary: '#5ff19c',
    primaryDim: '#2a7d4f',
    accent: '#baffce',
    glow: 'rgba(95, 241, 156, 0.55)',
  },
  mono: {
    id: 'mono',
    primary: '#e5eaf0',
    primaryDim: '#5a6470',
    accent: '#ffffff',
    glow: 'rgba(229, 234, 240, 0.55)',
  },
  redwar: {
    id: 'redwar',
    primary: '#ff6a5a',
    primaryDim: '#8a2a20',
    accent: '#ffb199',
    glow: 'rgba(255, 106, 90, 0.55)',
  },
};

export const HUD_BASE = {
  bg: '#05090d',
  bgDeep: '#02050a',
  panel: 'rgba(10, 18, 24, 0.58)',
  ink: '#e5f4ff',
  inkDim: '#6e92ab',
  inkFaint: '#3b566c',
  red: '#ff4a3d',
  redDim: '#a82a20',
  yellow: '#ffcc33',
  rule: 'rgba(255, 255, 255, 0.08)',
};

export function getPalette(id: PaletteId): HudPalette {
  return HUD_PALETTES[id] ?? HUD_PALETTES.cyan;
}

export function hudCssVars(palette: HudPalette): CSSProperties {
  return {
    '--hud-bg': HUD_BASE.bg,
    '--hud-bg-deep': HUD_BASE.bgDeep,
    '--hud-panel': HUD_BASE.panel,
    '--hud-ink': HUD_BASE.ink,
    '--hud-ink-dim': HUD_BASE.inkDim,
    '--hud-ink-faint': HUD_BASE.inkFaint,
    '--hud-red': HUD_BASE.red,
    '--hud-red-dim': HUD_BASE.redDim,
    '--hud-yellow': HUD_BASE.yellow,
    '--hud-rule': HUD_BASE.rule,
    '--hud-primary': palette.primary,
    '--hud-primary-dim': palette.primaryDim,
    '--hud-accent': palette.accent,
    '--hud-glow': palette.glow,
  } as CSSProperties;
}
