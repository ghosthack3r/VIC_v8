import { motion } from 'framer-motion';
import type { ObdValues, ObdStatus } from '../../pcBridge';
import type { CoreState } from '../../types';

interface DrivingModeProps {
  obdValues?: ObdValues;
  obdStatus?: ObdStatus;
  coreState?: CoreState;
  armed?: boolean;
  holding?: boolean;
  reply?: string;
  onPress?: () => void;
  onRelease?: () => void;
}

export function DrivingMode({ obdValues, obdStatus, coreState, armed, reply, onPress, onRelease }: DrivingModeProps) {
  const live = obdStatus?.connected ?? false;

  const rawSpeed = live && obdValues?.SPEED?.value != null ? obdValues.SPEED.value : 0;
  const rawRpm = live && obdValues?.RPM?.value != null ? obdValues.RPM.value : 700;
  const rawFuel = live && obdValues?.FUEL_LEVEL?.value != null ? obdValues.FUEL_LEVEL.value : 78;
  const rawTemp = live && obdValues?.COOLANT?.value != null ? obdValues.COOLANT.value : 192;

  const speed = Math.round(rawSpeed);
  const rpm = Math.round(rawRpm);
  const fuel = Math.round(rawFuel);
  const temp = Math.round(rawTemp);

  // Arc: max speed ~120 MPH / KPH, strokeDasharray=283 for r=45
  const maxSpeed = 120;
  const arcFill = Math.min(1, speed / maxSpeed);
  const arcOffset = 283 - (213 * arcFill); // 213 = usable arc (283 - 70 dead zone)

  const rpmPct = Math.min(100, (rpm / 6000) * 100);
  const fuelBars = Math.round((fuel / 100) * 10);

  const stateLabel = coreState === 'listening' ? '● LISTENING'
    : coreState === 'thinking' ? '// PROCESSING'
    : coreState === 'speaking' ? '▶ SPEAKING'
    : (armed ? 'SPACE TO TALK' : 'MIC DISARMED');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {/* VIC Core / PTT button */}
      <div
        className="absolute top-0 right-0 w-24 h-24 flex items-center justify-center opacity-80 cursor-pointer select-none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onPress?.(); }}
        onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); onRelease?.(); }}
      >
        <div className={`absolute inset-0 rounded-full border border-t-vic-accent animate-spin-slow ${
          coreState === 'listening' ? 'border-red-500/50' : 'border-vic-accent/30'
        }`} />
        <div className={`absolute inset-2 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 transition-all ${
          coreState === 'listening' ? 'shadow-[inset_0_0_15px_rgba(255,80,80,0.3)]' :
          coreState === 'thinking' || coreState === 'speaking' ? 'shadow-[inset_0_0_15px_rgba(0,255,200,0.3)]' :
          'shadow-[inset_0_0_15px_rgba(79,209,197,0.2)]'
        }`}>
          <span className="text-[10px] font-medium tracking-widest text-vic-accent">VIC</span>
        </div>
      </div>

      {/* Main Speedometer */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center justify-center"
      >
        <svg className="absolute w-[400px] h-[400px] -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="283" strokeDashoffset="70" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none" stroke="#4fd1c5" strokeWidth="3"
            strokeDasharray="283"
            style={{ strokeDashoffset: 283 }}
            animate={{ strokeDashoffset: arcOffset }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="drop-shadow-[0_0_8px_rgba(79,209,197,0.5)]"
          />
        </svg>

        <div className="flex flex-col items-center z-10 mt-8">
          <span className="text-[120px] font-light leading-none tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            {speed}
          </span>
          <span className="text-xl tracking-[0.3em] text-vic-muted font-medium mt-2">
            {live ? 'KPH' : 'MPH'}
          </span>
        </div>

        {/* RPM Bar */}
        <div className="w-64 h-2 bg-white/5 rounded-full mt-12 overflow-hidden relative">
          <motion.div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-vic-accent to-emerald-400"
            animate={{ width: `${rpmPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="text-[10px] tracking-widest text-vic-muted mt-2">{rpm} RPM</span>
      </motion.div>

      {/* Bottom Stats Row */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-12 flex items-center gap-8"
      >
        <div className="glass-panel px-6 py-3 rounded-2xl flex flex-col items-center">
          <span className="text-[9px] text-vic-muted tracking-widest mb-1">GEAR</span>
          <span className="text-2xl font-medium text-vic-accent">D</span>
        </div>

        <div className="glass-panel px-6 py-3 rounded-2xl flex flex-col items-center min-w-[140px]">
          <span className="text-[9px] text-vic-muted tracking-widest mb-2">FUEL</span>
          <div className="w-full flex gap-1 h-3">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${
                  i < fuelBars
                    ? fuelBars <= 2
                      ? 'bg-red-400/90 shadow-[0_0_5px_rgba(255,80,80,0.5)]'
                      : 'bg-emerald-400/80 shadow-[0_0_5px_rgba(52,211,153,0.5)]'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="glass-panel px-6 py-3 rounded-2xl flex flex-col items-center">
          <span className="text-[9px] text-vic-muted tracking-widest mb-1">TEMP</span>
          <span className="text-xl font-medium text-white">{temp}°</span>
        </div>
      </motion.div>

      {/* VIC reply + state hint */}
      <div className="absolute top-8 left-8 glass-panel px-4 py-2 rounded-xl border-l-2 border-l-vic-accent/50 max-w-xs">
        <div className="text-[9px] text-vic-muted tracking-widest mb-1">{stateLabel}</div>
        {reply && reply !== 'Standing by.' && (
          <div className="text-xs text-white/80 leading-snug truncate">{reply}</div>
        )}
      </div>

      {/* OBD live indicator */}
      {live && (
        <div className="absolute top-8 right-32 glass-panel px-3 py-1 rounded-lg border-teal-500/30">
          <span className="text-[9px] text-teal-400 tracking-widest font-mono">● OBD LIVE</span>
        </div>
      )}
    </div>
  );
}
