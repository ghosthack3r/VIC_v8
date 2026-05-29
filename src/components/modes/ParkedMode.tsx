import { ClockDisplay } from '../ClockDisplay';
import { VicOrb } from '../VicOrb';
import type { CoreState } from '../../types';

interface ParkedModeProps {
  coreState?: CoreState;
  armed?: boolean;
  holding?: boolean;
  reply?: string;
  micLevel?: number;
  outputLevel?: number;
  thinkingIntensity?: number;
  loading?: boolean;
  loadingPhase?: number;
  onPress?: () => void;
  onRelease?: () => void;
  [key: string]: any; // accept extra props gracefully
}

export function ParkedMode({
  coreState,
  armed,
  holding,
  reply,
  micLevel,
  outputLevel,
  thinkingIntensity,
  loading,
  loadingPhase,
  onPress,
  onRelease,
}: ParkedModeProps) {
  const stateLabel = coreState === 'listening' ? '● CAPTURING — RELEASE TO SEND'
    : coreState === 'thinking' ? '// PROCESSING...'
    : coreState === 'speaking' ? '▶ SPEAKING'
    : armed ? 'SPACEBAR OR HOLD MIC TO TALK' : 'MIC DISARMED';

  return (
    <div className="relative h-full w-full">
      <div className={`pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <ClockDisplay />
      </div>

      {/* VicOrb acts as PTT when clicked */}
      <div
        className="absolute inset-0 flex cursor-pointer select-none items-center justify-center"
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
          loading={loading}
          loadingPhase={loadingPhase}
        />
      </div>

      {/* State hint */}
      <div
        className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-xs font-mono tracking-widest uppercase transition-colors ${
        coreState === 'listening' ? 'text-red-400 animate-pulse' :
        coreState === 'thinking' || coreState === 'speaking' ? 'text-teal-400' :
        'text-vic-muted'
      } ${loading ? 'opacity-0' : 'opacity-100'}`}
        style={{ top: 'calc(50% + min(330px, 32vh))' }}
      >
        {stateLabel}
      </div>
    </div>
  );
}
