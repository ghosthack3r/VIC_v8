import { motion } from 'framer-motion';
import {
  Terminal,
  Map,
  Music,
  Camera,
  Settings,
  Folder,
  Phone,
  Activity } from
'lucide-react';
interface TaskbarProps {
  onOpenApp: (appId: string) => void;
}
const apps = [
{
  id: 'kali',
  isImage: true,
  src: "/kalisentinel_logo.png",
  label: 'KaliSentinel',
  bg: 'bg-black/50 border-blue-500/30'
},
{
  id: 'diagnostics',
  icon: Activity,
  label: 'Diagnostics',
  color: 'text-emerald-400',
  bg: 'bg-emerald-500/10 border-emerald-500/30'
},
{
  id: 'terminal',
  icon: Terminal,
  label: 'Terminal',
  color: 'text-slate-300',
  bg: 'bg-slate-800/50 border-slate-700/50'
},
{
  id: 'maps',
  icon: Map,
  label: 'Maps',
  color: 'text-blue-400',
  bg: 'bg-blue-500/10 border-blue-500/30'
},
{
  id: 'music',
  icon: Music,
  label: 'Music',
  color: 'text-pink-400',
  bg: 'bg-pink-500/10 border-pink-500/30'
},
{
  id: 'camera',
  icon: Camera,
  label: 'Camera',
  color: 'text-slate-200',
  bg: 'bg-slate-700/50 border-slate-600/50'
},
{
  id: 'files',
  icon: Folder,
  label: 'Files',
  color: 'text-amber-400',
  bg: 'bg-amber-500/10 border-amber-500/30'
},
{
  id: 'phone',
  icon: Phone,
  label: 'Phone',
  color: 'text-green-400',
  bg: 'bg-green-500/10 border-green-500/30'
},
{
  id: 'settings',
  icon: Settings,
  label: 'Settings',
  color: 'text-slate-400',
  bg: 'bg-slate-800/50 border-slate-700/50'
}];

export function Taskbar({ onOpenApp }: TaskbarProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-40 flex justify-center overflow-x-auto px-2 sm:bottom-6">
      <div className="glass-panel pointer-events-auto flex items-end gap-1 rounded-3xl border-white/10 bg-black/40 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:gap-3 sm:p-3">
        {apps.map((app) => {
          return (
            <div
              key={app.id}
              className="flex flex-col items-center gap-2 group">
              
              <motion.button
                onClick={() => onOpenApp(app.id)}
                whileHover={{
                  scale: 1.2,
                  y: -10
                }}
                whileTap={{
                  scale: 0.95
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20
                }}
                className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl ${app.bg}`}>
                
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 z-10 pointer-events-none" />

                {app.isImage ?
                <img
                  src={app.src}
                  alt={app.label}
                  className="z-0 h-6 w-6 object-contain sm:h-10 sm:w-10" /> :


                app.icon &&
                <app.icon
                  size={24}
                  className={`${app.color} z-0`}
                  strokeWidth={1.5} />


                }
              </motion.button>
              <span className="text-[10px] font-medium text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -bottom-5 whitespace-nowrap">
                {app.label}
              </span>
            </div>);

        })}
      </div>
    </div>);

}
