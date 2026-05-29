import { Car } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ObdValues, ObdStatus } from '../pcBridge';
import type { CoreState } from '../types';

interface HeaderProps {
  obdValues?: ObdValues;
  obdStatus?: ObdStatus;
  coreState?: CoreState;
  armed?: boolean;
  onToggleArm?: () => void;
}

export function Header({ obdValues, obdStatus, coreState, armed = true, onToggleArm }: HeaderProps) {
  const live = obdStatus?.connected ?? false;

  // Pull live OBD values with fallback to placeholder
  const speed = live && obdValues?.SPEED?.value != null ? Math.round(obdValues.SPEED.value) : 0;
  const rpm = live && obdValues?.RPM?.value != null ? Math.round(obdValues.RPM.value) : 700;
  const fuel = live && obdValues?.FUEL_LEVEL?.value != null ? Math.round(obdValues.FUEL_LEVEL.value) : 78;
  const temp = live && obdValues?.COOLANT?.value != null ? Math.round(obdValues.COOLANT.value) : 192;
  const batt = live && obdValues?.BATTERY?.value != null ? obdValues.BATTERY.value.toFixed(1) : '12.6';
  const oil = 40; // OBD-II doesn't expose oil PSI on most ECUs; keep as static

  const obdBadgeStatus = live ? 'active' : 'offline';
  const micStatus: 'active' | 'ready' | 'offline' =
    coreState === 'listening' ? 'active' : armed ? 'ready' : 'offline';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full h-20 px-4 sm:px-8 flex items-center justify-between gap-3 border-b border-vic-border bg-vic-bg/90 backdrop-blur-md z-50 relative shrink-0"
    >
      {/* Left: Vehicle Info */}
      <div className="flex min-w-0 items-center gap-4 xl:w-1/4">
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-vic-accent">
            <Car size={20} />
          </div>
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs uppercase tracking-widest text-vic-muted font-medium">
            VIC SYSTEM
          </span>
          <span className="max-w-[240px] truncate text-lg font-medium tracking-wide text-vic-text sm:max-w-none">
            2008 P71 Interceptor
          </span>
        </div>
      </div>

      {/* Center: Live Stats — wired to OBD when connected */}
      <div className="hidden items-center justify-center gap-8 flex-1 xl:flex">
        <StatBlock label="SPEED" value={String(speed)} unit={live ? 'KPH' : 'MPH'} live={live} />
        <div className="w-px h-8 bg-white/10" />
        <StatBlock label="RPM" value={live ? String(rpm) : '700'} unit="" live={live} />
        <div className="w-px h-8 bg-white/10" />
        <StatBlock label="FUEL" value={String(fuel)} unit="%" live={live} />
        <div className="w-px h-8 bg-white/10" />
        <StatBlock label="TEMP" value={String(temp)} unit={live ? '°C' : '°F'} live={live} />
        <div className="w-px h-8 bg-white/10" />
        <StatBlock label="BATT" value={batt} unit="V" live={live} />
        <div className="w-px h-8 bg-white/10" />
        <StatBlock label="OIL" value={String(oil)} unit="PSI" live={false} />
      </div>

      {/* Right: Status Badges */}
      <div className="flex w-auto items-center justify-end gap-2 xl:w-1/4">
        <StatusBadge label="ONLINE" status="active" />
        <button onClick={onToggleArm} title="Toggle mic arm">
          <StatusBadge
            label={micStatus === 'active' ? 'LISTENING' : armed ? 'MIC READY' : 'MIC OFF'}
            status={micStatus}
          />
        </button>
        <StatusBadge label={live ? 'OBD LIVE' : 'OBD'} status={obdBadgeStatus} />
      </div>
    </motion.header>
  );
}

function StatBlock({ label, value, unit, live }: { label: string; value: string; unit: string; live: boolean }) {
  return (
    <div className="flex min-w-[60px] flex-col items-center justify-center">
      <span className="mb-1 text-[10px] uppercase tracking-widest text-vic-muted/80 font-medium">
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-lg font-mono tracking-tight ${live ? 'text-teal-300' : 'text-white'}`}>
          {value}
        </span>
        {unit && <span className="text-[11px] font-mono text-vic-muted">{unit}</span>}
      </div>
    </div>
  );
}

function StatusBadge({ label, status }: { label: string; status: 'active' | 'ready' | 'offline' }) {
  const color = {
    active: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    ready: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
    offline: 'text-slate-500 border-slate-700 bg-slate-800/50',
  }[status];
  return (
    <div className={`rounded border px-3 py-1 text-xs font-semibold tracking-widest ${color}`}>
      {label}
    </div>
  );
}
