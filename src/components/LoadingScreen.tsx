import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
  onPhaseChange?: (phase: number) => void;
}

const BOOT_LINES = [
  'Initializing VIC system...',
  'OBD-II interface primed',
  'Audio subsystem ready',
  'KaliSentinel active',
  'All systems nominal',
];

export function LoadingScreen({ onComplete, onPhaseChange }: LoadingScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase(1), 700),
      window.setTimeout(() => setPhase(2), 1500),
      window.setTimeout(() => setPhase(3), 2200),
      window.setTimeout(() => setPhase(4), 3600),
      window.setTimeout(() => onComplete(), 4100),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onComplete]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeIn' }}
          className="pointer-events-none absolute inset-0 z-[100] overflow-hidden"
        >
          <motion.div
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
            className="absolute left-0 right-0 z-50 h-[2px] bg-gradient-to-r from-transparent via-vic-accent to-transparent shadow-[0_0_15px_rgba(79,209,197,1)]"
          />

          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-[#06090e]/25"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0,transparent_260px,rgba(6,9,14,0.45)_520px)]" />
            </motion.div>
          )}

          {phase >= 3 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.16 } },
              }}
              className="absolute bottom-24 left-12 z-10 flex flex-col gap-1"
            >
              {BOOT_LINES.map((line) => (
                <motion.div
                  key={line}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  className="font-mono text-[10px] tracking-wider text-vic-accent"
                >
                  &gt; {line}
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
