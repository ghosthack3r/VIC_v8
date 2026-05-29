import type { SystemTelemetry } from '../pcBridge';
import type { CoreState } from '../types';

export type AuraMode = 'standby' | 'loading' | 'listening' | 'thinking' | 'working' | 'talking';

interface AuraModeInput {
  loading?: boolean;
  holding?: boolean;
  coreState?: CoreState;
}

export function getAuraMode({ loading = false, holding = false, coreState = 'idle' }: AuraModeInput = {}): AuraMode {
  if (loading) return 'loading';
  if (holding || coreState === 'listening') return 'listening';
  if (coreState === 'thinking') return 'thinking';
  if (coreState === 'speaking') return 'talking';
  return 'standby';
}

export function getBootAuraMode(phase: number): AuraMode {
  return phase >= 2 ? 'loading' : 'standby';
}

export function getAuraLabel(mode: AuraMode): string {
  const labels: Record<AuraMode, string> = {
    standby: 'STANDBY',
    loading: 'BOOTING',
    listening: 'LISTENING',
    thinking: 'PROCESSING',
    working: 'WORKING',
    talking: 'SPEAKING',
  };
  return labels[mode];
}

export function getAuraAccent(mode: AuraMode): string {
  const accents: Record<AuraMode, string> = {
    standby: '#00f3ff',
    loading: '#00f3ff',
    listening: '#00f3ff',
    thinking: '#4d00ff',
    working: '#8b5cf6',
    talking: '#ff00c8',
  };
  return accents[mode];
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function getThinkingIntensity(telemetry: SystemTelemetry | null | undefined): number {
  if (!telemetry?.load && !telemetry?.memory) return 0.35;

  const cpu = clamp01((telemetry.load?.total ?? 0) / 100);
  const memory = clamp01((telemetry.memory?.usedPct ?? 0) / 100);
  const intensity = clamp01(cpu * 0.6 + memory * 0.4);

  return Math.round(intensity * 100) / 100;
}
