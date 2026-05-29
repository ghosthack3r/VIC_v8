import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Activity,
  CheckCircle2,
  Battery,
  Thermometer,
  Gauge } from
'lucide-react';
interface DiagnosticsAppProps {
  onClose: () => void;
}
export function DiagnosticsApp({ onClose }: DiagnosticsAppProps) {
  // Simulate live data updates
  const [rpm, setRpm] = useState(700);
  const [maf, setMaf] = useState(3.2);
  useEffect(() => {
    const interval = setInterval(() => {
      setRpm((prev) => prev + (Math.random() * 20 - 10));
      setMaf((prev) => prev + (Math.random() * 0.2 - 0.1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.95
      }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      exit={{
        opacity: 0,
        scale: 0.95
      }}
      transition={{
        duration: 0.3,
        ease: 'easeOut'
      }}
      className="absolute inset-0 z-50 bg-[#06090e] flex flex-col">
      
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-white/5">
        <div className="flex items-center gap-3">
          <Activity className="text-vic-accent" size={20} />
          <span className="text-sm font-medium tracking-[0.2em] text-white">
            DIAGNOSTICS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 size={14} />
            <span>OBD-II CONNECTED</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-vic-muted hover:text-white transition-colors">
            
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-6 overflow-hidden">
        {/* LEFT COLUMN: Live OBD-II Readouts */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] uppercase tracking-widest text-vic-muted font-medium mb-2">
            Live Sensor Data
          </h2>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gauge className="text-vic-accent" size={24} />
              <div>
                <div className="text-xs text-vic-muted">Engine RPM</div>
                <div className="text-2xl font-mono text-white">
                  {Math.round(rpm)}
                </div>
              </div>
            </div>
            {/* Mini Arc Gauge */}
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
                strokeDasharray="100, 100" />
              
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#4fd1c5"
                strokeWidth="3"
                strokeDasharray={`${rpm / 7000 * 100}, 100`} />
              
            </svg>
          </div>

          <SensorCard
            label="Coolant Temperature"
            value="192"
            unit="°F"
            status="normal" />
          
          <SensorCard
            label="Intake Air Temp"
            value="85"
            unit="°F"
            status="normal" />
          
          <SensorCard
            label="Mass Air Flow"
            value={maf.toFixed(1)}
            unit="g/s"
            status="normal" />
          
          <SensorCard
            label="Throttle Position"
            value="12"
            unit="%"
            status="normal" />
          

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-[9px] text-vic-muted mb-1">STFT Bank 1</div>
              <div className="text-lg font-mono text-emerald-400">+2.3%</div>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-[9px] text-vic-muted mb-1">LTFT Bank 1</div>
              <div className="text-lg font-mono text-emerald-400">-1.1%</div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Diagnostic Tools */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] uppercase tracking-widest text-vic-muted font-medium mb-2">
            Diagnostic Tools
          </h2>

          {/* DTC Scanner */}
          <div className="glass-panel p-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-lg font-medium text-white">
                  No Active Codes
                </div>
                <div className="text-xs text-emerald-400/80">
                  System operating normally
                </div>
              </div>
            </div>
            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors">
              Scan for Codes
            </button>
          </div>

          {/* O2 Sensors */}
          <div className="glass-panel p-5 rounded-2xl mt-2">
            <h3 className="text-xs text-vic-muted mb-4">O2 Sensor Voltage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white">Bank 1 Sensor 1</span>
                  <span className="font-mono text-vic-accent">0.45V</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-vic-accent"
                    animate={{
                      width: ['40%', '60%', '45%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }} />
                  
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white">Bank 1 Sensor 2</span>
                  <span className="font-mono text-vic-accent">0.72V</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-vic-accent w-[72%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex justify-between items-center">
            <div>
              <div className="text-xs text-vic-muted">Catalyst Temp</div>
              <div className="text-xl font-mono text-amber-400">1,200°F</div>
            </div>
            <Thermometer className="text-amber-400/50" size={24} />
          </div>
        </div>

        {/* RIGHT COLUMN: System Health & Logs */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] uppercase tracking-widest text-vic-muted font-medium mb-2">
            System Health & Logs
          </h2>

          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <Battery className="text-vic-accent" size={20} />
              <span className="text-sm text-white">Battery Health</span>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-mono text-white">12.6V</span>
              <span className="text-xs text-emerald-400">Good</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-[85%]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-[9px] text-vic-muted mb-1">
                Alternator Output
              </div>
              <div className="text-lg font-mono text-white">14.2V</div>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-[9px] text-vic-muted mb-1">Trans Temp</div>
              <div className="text-lg font-mono text-white">175°F</div>
            </div>
          </div>

          {/* Event Log */}
          <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col overflow-hidden mt-2">
            <h3 className="text-xs text-vic-muted mb-4 shrink-0">
              Recent Events
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
              <LogEntry time="09:02 AM" msg="OBD Connected" type="info" />
              <LogEntry
                time="09:01 AM"
                msg="DTC Scan Complete - No Codes"
                type="success" />
              
              <LogEntry
                time="Yesterday"
                msg="Coolant Temp Warning Cleared"
                type="warning" />
              
              <LogEntry time="Yesterday" msg="System Boot" type="info" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>);

}
function SensorCard({
  label,
  value,
  unit,
  status





}: {label: string;value: string;unit: string;status: 'normal' | 'warning' | 'critical';}) {
  const color =
  status === 'normal' ?
  'text-white' :
  status === 'warning' ?
  'text-amber-400' :
  'text-red-400';
  const barColor =
  status === 'normal' ?
  'bg-vic-accent' :
  status === 'warning' ?
  'bg-amber-400' :
  'bg-red-400';
  return (
    <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
      <div className="text-xs text-vic-muted">{label}</div>
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-mono ${color}`}>{value}</span>
          <span className="text-[10px] text-vic-muted">{unit}</span>
        </div>
        <div className="w-1 h-6 bg-white/10 rounded-full overflow-hidden flex items-end">
          <div
            className={`w-full ${barColor}`}
            style={{
              height: '60%'
            }} />
          
        </div>
      </div>
    </div>);

}
function LogEntry({
  time,
  msg,
  type




}: {time: string;msg: string;type: 'info' | 'success' | 'warning';}) {
  const color =
  type === 'success' ?
  'text-emerald-400' :
  type === 'warning' ?
  'text-amber-400' :
  'text-vic-accent';
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="text-vic-muted/60 font-mono shrink-0 w-16">{time}</span>
      <span className={`${color} font-medium`}>{msg}</span>
    </div>);

}
