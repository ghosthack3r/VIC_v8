import { motion } from 'framer-motion';
interface ModeNavProps {
  activeMode: string;
  setMode: (mode: string) => void;
}
const modes = ['Parked', 'Driving', 'Navigation', 'Ambient'];
export function ModeNav({ activeMode, setMode }: ModeNavProps) {
  return (
    <div className="z-20 mt-6 flex justify-start overflow-x-auto px-3 sm:justify-center">
      <div className="glass-panel flex w-max items-center gap-1.5 rounded-full p-1.5">
        {modes.map((mode) => {
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`relative rounded-full px-7 py-2 text-sm font-medium tracking-wider transition-colors duration-300 sm:px-9 sm:text-base ${isActive ? 'text-white' : 'text-vic-muted hover:text-white/80'}`}>
              
              {isActive &&
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 bg-vic-accent/20 border border-vic-accent/30 rounded-full"
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }} />

              }
              <span className="relative z-10 uppercase">{mode}</span>
            </button>);

        })}
      </div>
    </div>);

}
