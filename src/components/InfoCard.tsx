import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
interface InfoCardProps {
  label: string;
  content: string;
  subtext?: string;
  delay?: number;
}
export function InfoCard({
  label,
  content,
  subtext,
  delay = 0
}: InfoCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.6,
        delay,
        ease: 'easeOut'
      }}
      className="w-full glass-panel glass-panel-hover rounded-xl p-4 flex flex-col items-center justify-center text-center group cursor-default">
      
      <div className="text-[9px] uppercase tracking-[0.2em] text-vic-muted font-medium mb-1.5 group-hover:text-vic-accent/70 transition-colors duration-300">
        {label}
      </div>

      <div className="text-sm md:text-base font-light text-white tracking-wide leading-tight">
        {content}
      </div>

      {subtext &&
      <div className="flex items-center gap-1.5 text-[10px] text-vic-muted/80 mt-1.5">
          <Clock size={10} className="text-vic-accent/70" />
          <span className="tracking-wider uppercase">{subtext}</span>
        </div>
      }
    </motion.div>);

}
