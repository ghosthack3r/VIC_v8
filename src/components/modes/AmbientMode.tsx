import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { VicOrb } from '../VicOrb';
import { Play, SkipForward, SkipBack, Music } from 'lucide-react';
import type { CoreState } from '../../types';

interface AmbientModeProps {
  coreState?: CoreState;
  armed?: boolean;
  holding?: boolean;
  reply?: string;
  micLevel?: number;
  outputLevel?: number;
  thinkingIntensity?: number;
  onPress?: () => void;
  onRelease?: () => void;
  [key: string]: any;
}

export function AmbientMode({
  coreState,
  holding,
  reply,
  micLevel,
  outputLevel,
  thinkingIntensity,
  onPress,
  onRelease,
}: AmbientModeProps) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  const stateLabel = coreState === 'listening' ? '● LISTENING'
    : coreState === 'thinking' ? '// PROCESSING'
    : coreState === 'speaking' ? '▶ SPEAKING'
    : 'TAP ORB OR SPACEBAR TO WAKE';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-vic-accent/40 blur-[1px]"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Time */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-12 text-center z-10"
      >
        <div className="text-4xl font-thin tracking-[0.2em] text-white/80">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-[10px] font-mono tracking-widest text-vic-muted mt-1 uppercase">
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </motion.div>

      {/* VicOrb — PTT */}
      <div
        className="scale-125 z-10 cursor-pointer select-none"
        onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); onPress?.(); }}
        onPointerUp={(e) => { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); onRelease?.(); }}
      >
        <VicOrb
          coreState={coreState}
          holding={holding}
          latestReply={reply}
          micLevel={micLevel}
          outputLevel={outputLevel}
          thinkingIntensity={thinkingIntensity}
        />
      </div>

      {/* State label */}
      <div className={`z-10 mt-4 text-[10px] font-mono tracking-widest uppercase transition-colors ${
        coreState === 'listening' ? 'text-red-400 animate-pulse' :
        coreState === 'thinking' || coreState === 'speaking' ? 'text-teal-400' :
        'text-vic-muted/60'
      }`}>
        {stateLabel}
      </div>

      {/* Latest reply */}
      {reply && reply !== 'Standing by.' && (
        <div className="z-10 mt-2 text-xs text-white/60 max-w-sm text-center leading-snug">
          {reply}
        </div>
      )}

      {/* Music Player */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 glass-panel p-4 rounded-3xl flex items-center gap-6 w-full max-w-md z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 flex items-center justify-center shadow-lg">
          <Music size={24} className="text-white/50" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white mb-1">Midnight Drive</div>
          <div className="text-[10px] text-vic-muted tracking-wider uppercase">Synthwave FM</div>
          <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-vic-accent w-1/3 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-3 pr-2">
          <button className="text-vic-muted hover:text-white transition-colors"><SkipBack size={18} /></button>
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/5">
            <Play size={18} className="ml-1" />
          </button>
          <button className="text-vic-muted hover:text-white transition-colors"><SkipForward size={18} /></button>
        </div>
      </motion.div>
    </div>
  );
}
