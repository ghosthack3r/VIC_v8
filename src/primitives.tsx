import type { CSSProperties, PropsWithChildren } from 'react';
import { useHudTheme } from './hudTheme';

export function cut(size = 10) {
  return `polygon(${size}px 0, 100% 0, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0 100%, 0 ${size}px)`;
}

export function cutBoth(size = 10) {
  return `polygon(${size}px 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, ${size}px 100%, 0 calc(100% - ${size}px), 0 ${size}px)`;
}

type Tone = 'default' | 'warn' | 'ok';

interface PanelProps extends PropsWithChildren {
  title?: string;
  flag?: string;
  tone?: Tone;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Panel({ title, flag, tone = 'default', compact, className, style, children }: PanelProps) {
  const { palette, base } = useHudTheme();
  const border = tone === 'warn' ? `${base.red}72` : tone === 'ok' ? `${palette.accent}66` : `${palette.primary}40`;
  const titleColor = tone === 'warn' ? base.red : tone === 'ok' ? palette.accent : palette.primary;

  return (
    <section
      className={`hud-panel${compact ? ' hud-panel-compact' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--panel-border': border,
        '--panel-title': titleColor,
        clipPath: cut(10),
        ...style,
      } as CSSProperties}
    >
      {title ? (
        <div className="panel-heading">
          <div className="panel-title-pip" />
          <div className="panel-title">{title}</div>
          <div className="panel-rule" />
          {flag ? <div className="panel-flag">{flag}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

interface BracketProps extends PropsWithChildren {
  tone?: 'default' | 'red' | 'ok';
}

export function Bracket({ children, tone = 'default' }: BracketProps) {
  return (
    <span className={`hud-bracket hud-bracket-${tone}`}>
      <span className="bracket-cap">[</span>
      {children}
      <span className="bracket-cap">]</span>
    </span>
  );
}

interface StatProps {
  label: string;
  value: number | string;
  unit?: string;
  max?: number;
  tone?: Tone;
}

export function Stat({ label, value, unit, max, tone = 'default' }: StatProps) {
  const { palette, base } = useHudTheme();
  const numericValue = typeof value === 'number' ? value : undefined;
  const pct = typeof numericValue === 'number' && max ? Math.min(1, numericValue / max) : undefined;
  const color = tone === 'warn' ? base.red : tone === 'ok' ? palette.accent : palette.primary;
  const displayValue = typeof value === 'number' ? value.toFixed(value < 10 ? 1 : 0) : value;

  return (
    <div className="stat-row">
      <div className="stat-label">{label}</div>
      {pct !== undefined ? (
        <div className="stat-track">
          <div className="stat-fill" style={{ width: `${pct * 100}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
          <div className="stat-tick" style={{ left: '25%' }} />
          <div className="stat-tick" style={{ left: '50%' }} />
          <div className="stat-tick" style={{ left: '75%' }} />
        </div>
      ) : null}
      <div className="stat-value" style={{ color }}>
        {displayValue}
        {unit ? <span>{unit}</span> : null}
      </div>
    </div>
  );
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 100, height = 22, color }: SparklineProps) {
  const { palette } = useHudTheme();
  const stroke = color ?? palette.primary;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(0.001, max - min);
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(1, data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Telemetry trend">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.2" opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${stroke})` }} />
    </svg>
  );
}

interface MetricTileProps {
  label: string;
  value: string | number;
  tone?: Tone;
}

export function MetricTile({ label, value, tone = 'default' }: MetricTileProps) {
  return (
    <div className={`metric-tile metric-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

interface TireDiagramProps {
  psi: [number, number, number, number];
}

export function TireDiagram({ psi }: TireDiagramProps) {
  const { palette, base } = useHudTheme();
  const corners = [
    { x: 10, y: 10, value: psi[0], label: 'FL' },
    { x: 90, y: 10, value: psi[1], label: 'FR' },
    { x: 10, y: 90, value: psi[2], label: 'RL' },
    { x: 90, y: 90, value: psi[3], label: 'RR' },
  ];

  return (
    <div className="tire-diagram" style={{ clipPath: cut(6) }}>
      <svg viewBox="0 0 100 100" className="tire-car" aria-hidden="true">
        <rect x="22" y="12" width="56" height="76" rx="10" fill="none" stroke={palette.primary} strokeOpacity="0.35" strokeWidth="0.8" />
        <rect x="30" y="22" width="40" height="22" fill="none" stroke={palette.primary} strokeOpacity="0.25" strokeWidth="0.5" />
        <rect x="30" y="58" width="40" height="22" fill="none" stroke={palette.primary} strokeOpacity="0.25" strokeWidth="0.5" />
        <line x1="22" y1="50" x2="78" y2="50" stroke={palette.primary} strokeOpacity="0.2" strokeDasharray="2 2" strokeWidth="0.4" />
      </svg>

      {corners.map((corner) => {
        const low = corner.value < 31;
        const color = low ? base.red : palette.primary;
        return (
          <div
            key={corner.label}
            className="tire-readout"
            style={{
              left: `${corner.x}%`,
              top: `${corner.y}%`,
              borderColor: `${color}66`,
              color,
              clipPath: cut(3),
            }}
          >
            <span>{corner.label}</span>
            <strong>{corner.value} PSI</strong>
          </div>
        );
      })}
    </div>
  );
}
