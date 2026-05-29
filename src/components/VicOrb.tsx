import { motion } from 'framer-motion';
import { SoundVisualizer } from './SoundVisualizer';
import { getAuraAccent, getAuraLabel, getAuraMode, getBootAuraMode } from './vicOrbState';
import type { CoreState } from '../types';

const AURA_COLORS = ['#00f3ff', '#4d00ff', '#ff00c8'];

interface VicOrbProps {
  coreState?: CoreState;
  holding?: boolean;
  latestReply?: string;
  micLevel?: number;
  outputLevel?: number;
  thinkingIntensity?: number;
  loading?: boolean;
  loadingPhase?: number;
  compact?: boolean;
}

export function VicOrb({
  coreState = 'idle',
  holding = false,
  latestReply,
  micLevel = 0,
  outputLevel = 0,
  thinkingIntensity = 0.35,
  loading = false,
  loadingPhase = 0,
  compact = false,
}: VicOrbProps) {
  const auraMode = loading ? getBootAuraMode(loadingPhase) : getAuraMode({ holding, coreState });
  const accent = getAuraAccent(auraMode);
  const label = loading && auraMode === 'standby' ? 'STANDBY' : getAuraLabel(auraMode);
  const displayReply = latestReply && latestReply !== 'Standing by.' ? latestReply : '';
  const auraSize = compact ? 260 : 'min(760px, 64vh, 76vw)';

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{
        width: compact ? 112 : auraSize,
        height: compact ? 112 : auraSize,
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{
          width: auraSize,
          height: auraSize,
        }}
      >
        <motion.div
          className="h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <SoundVisualizer
            baseRadius={compact ? 58 : 152}
            lineCount={compact ? 32 : 45}
            colors={AURA_COLORS}
            mode={auraMode}
            micLevel={micLevel}
            outputLevel={outputLevel}
            thinkingIntensity={thinkingIntensity}
          />
        </motion.div>
      </div>

      <div
        className={`relative z-10 flex flex-col items-center justify-center rounded-full border border-white/10 bg-black/35 text-center shadow-[inset_0_0_36px_rgba(0,0,0,0.8)] backdrop-blur-md ${
          compact ? 'h-20 w-20' : 'h-52 w-52'
        }`}
        style={{
          boxShadow: `inset 0 0 42px ${accent}22, 0 0 ${compact ? 18 : 28}px ${accent}18`,
        }}
      >
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${compact ? 'text-[7px]' : 'text-[11px]'} mb-2 font-medium uppercase tracking-[0.42em]`}
          style={{ color: accent }}
        >
          {label}
        </motion.div>
        <div className={`${compact ? 'text-xl' : 'text-5xl'} font-light tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`}>
          VIC
        </div>
      </div>

      {!compact && displayReply && (
        <motion.div
          key={displayReply}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute bottom-3 left-1/2 z-20 w-full max-w-xs -translate-x-1/2 text-center"
        >
          <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.3em] text-white/35">
            Latest Reply
          </div>
          <div className="line-clamp-2 text-sm font-light leading-relaxed tracking-wide text-white/75 drop-shadow-[0_0_10px_rgba(255,255,255,0.14)]">
            {displayReply}
          </div>
        </motion.div>
      )}
    </div>
  );
}
