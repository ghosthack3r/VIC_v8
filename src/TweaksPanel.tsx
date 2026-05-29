import { useCallback, useEffect, useState } from 'react';
import { Icon } from './icons';
import type { PaletteId, TweakSettings } from './types';

const DEFAULT_TWEAKS: TweakSettings = {
  palette: 'cyan',
  grid: true,
  scanlines: false,
  chrome: true,
  tabletMode: false,
};

const STORAGE_KEY = 'vic.tactical.tweaks';

export function useTweaks() {
  const [tweaks, setTweaks] = useState<TweakSettings>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_TWEAKS, ...JSON.parse(raw) } : DEFAULT_TWEAKS;
    } catch {
      return DEFAULT_TWEAKS;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
  }, [tweaks]);

  const setTweak = useCallback(<K extends keyof TweakSettings>(key: K, value: TweakSettings[K]) => {
    setTweaks((current) => ({ ...current, [key]: value }));
  }, []);

  return { tweaks, setTweak };
}

interface TweaksPanelProps {
  visible: boolean;
  tweaks: TweakSettings;
  onChange: <K extends keyof TweakSettings>(key: K, value: TweakSettings[K]) => void;
  onClose: () => void;
}

const paletteOptions: { id: PaletteId; label: string }[] = [
  { id: 'cyan', label: 'Cyan' },
  { id: 'amber', label: 'Amber' },
  { id: 'phosphor', label: 'Phosphor' },
  { id: 'mono', label: 'Mono' },
  { id: 'redwar', label: 'Redwar' },
];

export function TweaksPanel({ visible, tweaks, onChange, onClose }: TweaksPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <aside className="tweaks-panel" aria-label="VIC HUD tweaks">
      <div className="tweaks-title">
        <div>
          <span>DEV LAB</span>
          <strong>TWEAKS</strong>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close tweaks panel" title="Close tweaks panel">
          <Icon name="close" width={14} height={14} />
        </button>
      </div>

      <div className="tweak-section">
        <span>Palette</span>
        <div className="palette-options" role="radiogroup" aria-label="HUD palette">
          {paletteOptions.map((option) => (
            <button
              key={option.id}
              className={tweaks.palette === option.id ? 'active' : ''}
              onClick={() => onChange('palette', option.id)}
              role="radio"
              aria-checked={tweaks.palette === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-section">
        <span>Overlays</span>
        <label className="tweak-toggle">
          <input type="checkbox" checked={tweaks.grid} onChange={(event) => onChange('grid', event.target.checked)} />
          <strong>Background grid</strong>
        </label>
        <label className="tweak-toggle">
          <input type="checkbox" checked={tweaks.scanlines} onChange={(event) => onChange('scanlines', event.target.checked)} />
          <strong>CRT scanlines</strong>
        </label>
        <label className="tweak-toggle">
          <input type="checkbox" checked={tweaks.chrome} onChange={(event) => onChange('chrome', event.target.checked)} />
          <strong>Window chrome</strong>
        </label>
        <label className="tweak-toggle">
          <input type="checkbox" checked={tweaks.tabletMode} onChange={(event) => onChange('tabletMode', event.target.checked)} />
          <strong>Tablet mode</strong>
        </label>
      </div>
    </aside>
  );
}
