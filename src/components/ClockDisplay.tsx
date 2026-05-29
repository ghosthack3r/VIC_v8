import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
export function ClockDisplay() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  const formatDate = (date: Date) => {
    return date.
    toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).
    toUpperCase();
  };
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
        duration: 0.8,
        delay: 0.2
      }}
      className="flex flex-col items-center justify-center mb-2 sm:mb-4 shrink-0">
      
      <div className="mb-1 text-5xl font-light tracking-wider text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] sm:text-7xl">
        {formatTime(time)}
      </div>
      <div className="text-xs font-medium tracking-[0.26em] text-vic-muted sm:text-base sm:tracking-[0.42em]">
        {formatDate(time)}
      </div>
    </motion.div>);

}
