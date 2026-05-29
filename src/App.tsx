import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Taskbar } from './components/Taskbar';
import { ModeNav } from './components/ModeNav';
import { ParkedMode } from './components/modes/ParkedMode';
import { DrivingMode } from './components/modes/DrivingMode';
import { NavigationMode } from './components/modes/NavigationMode';
import { AmbientMode } from './components/modes/AmbientMode';
import { DiagnosticsApp } from './components/DiagnosticsApp';
import { LoadingScreen } from './components/LoadingScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { getBridge } from './pcBridge';
import { useGeminiLive, useObdStream, useSystemTelemetry } from './hooks';
import { getThinkingIntensity } from './components/vicOrbState';
import type { CoreState } from './types';

// Encode raw PCM float32 to base64 PCM16 for Gemini
function encodePcm16Base64(samples: Float32Array): string {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function getAudioContextCtor() {
  return window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

const MIC_WORKLET_NAME = 'vic-mic-capture';
const micWorkletContexts = new WeakSet<AudioContext>();
const MIC_WORKLET_SOURCE = `
class VicMicCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(4096);
    this.offset = 0;
    this.energy = 0;
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;

    let read = 0;
    while (read < input.length) {
      const writable = Math.min(this.buffer.length - this.offset, input.length - read);
      for (let i = 0; i < writable; i++) {
        const sample = input[read + i];
        this.buffer[this.offset + i] = sample;
        this.energy += sample * sample;
      }
      this.offset += writable;
      read += writable;

      if (this.offset === this.buffer.length) {
        const samples = new Float32Array(this.buffer);
        const level = Math.min(1, Math.sqrt(this.energy / samples.length) * 3);
        this.port.postMessage({ samples, level }, [samples.buffer]);
        this.offset = 0;
        this.energy = 0;
      }
    }

    return true;
  }
}

registerProcessor('${MIC_WORKLET_NAME}', VicMicCaptureProcessor);
`;

async function ensureMicWorklet(ctx: AudioContext) {
  if (!ctx.audioWorklet) return false;
  if (micWorkletContexts.has(ctx)) return true;

  const url = URL.createObjectURL(new Blob([MIC_WORKLET_SOURCE], { type: 'text/javascript' }));
  try {
    await ctx.audioWorklet.addModule(url);
    micWorkletContexts.add(ctx);
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [activeMode, setActiveMode] = useState('Parked');
  const [activeApp, setActiveApp] = useState<string | null>(null);

  // === v80 backend state ===
  const [armed, setArmed] = useState(true);
  const [holding, setHolding] = useState(false);
  const [reply, setReply] = useState('Standing by.');
  const [coreState, setCoreState] = useState<CoreState>('idle');
  const [toast, setToast] = useState('');
  const [micLevel, setMicLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioNode | null>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const captureActiveRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const { sendAudio, ensurePlaybackReady, liveCoreState, outputLevel } = useGeminiLive();
  const { status: obdStatus, values: obdValues } = useObdStream();
  const systemTelemetry = useSystemTelemetry(2000);
  const thinkingIntensity = getThinkingIntensity(systemTelemetry);

  // Keep coreState in sync with live Gemini state
  useEffect(() => {
    if (liveCoreState === 'speaking') {
      setCoreState('speaking');
    } else if (coreState === 'speaking' && liveCoreState === 'idle') {
      setCoreState('idle');
    }
  }, [liveCoreState, coreState]);

  const flashToast = useCallback((message: string, duration = 1600) => {
    setToast(message);
    window.setTimeout(() => setToast(''), duration);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setLoadingPhase(4);
    setIsLoading(false);
  }, []);

  const handleLoadingPhaseChange = useCallback((phase: number) => {
    setLoadingPhase(phase);
  }, []);

  // Bridge: command router + mode changes
  useEffect(() => {
    const bridge = getBridge();
    if (!bridge?.command) return;

    const offResponse = bridge.command.onResponse((entry: any) => {
      if (entry?.result?.message) flashToast(`VIC / ${entry.result.message}`, 2200);
      if (entry?.command?.type === 'switch_mode' && entry.result?.success) {
        const modeMap: Record<string, string> = {
          driving: 'Driving', nav: 'Navigation', parked: 'Parked',
          ambient: 'Ambient', diagnostics: 'Driving', system: 'Parked',
        };
        const target = modeMap[entry.command.params?.mode] || 'Parked';
        setActiveMode(target);
      }
    });

    const offMode = bridge.command.onModeChange((data: any) => {
      if (data?.mode) {
        const modeMap: Record<string, string> = {
          driving: 'Driving', nav: 'Navigation', parked: 'Parked', ambient: 'Ambient',
        };
        const target = modeMap[data.mode] || 'Parked';
        setActiveMode(target);
        flashToast(`MODE / ${data.mode.toUpperCase()}`);
      }
    });

    return () => { offResponse(); offMode(); };
  }, [flashToast]);

  // Bridge: Gemini transcription + turn events
  useEffect(() => {
    const bridge = getBridge();
    if (!bridge) return;

    const offTranscription = bridge.gemini.onTranscription((text: string) => {
      setReply((cur) => cur === 'Standing by.' ? text : cur + text);
    });
    const offInterrupted = bridge.gemini.onInterrupted(() => {
      setCoreState('idle');
      setReply('Standing by.');
    });
    const offTurnComplete = bridge.gemini.onTurnComplete(() => {});

    return () => { offTranscription(); offInterrupted(); offTurnComplete(); };
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const stopCapture = useCallback(() => {
    captureActiveRef.current = false;
    setMicLevel(0);
    const processor = processorRef.current;
    if (processor) {
      if ('onaudioprocess' in processor) {
        (processor as ScriptProcessorNode).onaudioprocess = null;
      }
      if ('port' in processor) {
        const worklet = processor as AudioWorkletNode;
        worklet.port.onmessage = null;
        worklet.port.close();
      }
      try { processor.disconnect(); } catch {}
      processorRef.current = null;
    }
    if (audioSourceRef.current) {
      try { audioSourceRef.current.disconnect(); } catch {}
      audioSourceRef.current = null;
    }
    if (monitorGainRef.current) {
      try { monitorGainRef.current.disconnect(); } catch {}
      monitorGainRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const press = useCallback(async () => {
    if (!armed) { flashToast('MIC / DISARMED'); return; }
    if (captureActiveRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) { flashToast('MIC / UNAVAILABLE'); return; }

    clearTimers();
    setReply('');
    setHolding(true);
    setCoreState('listening');
    captureActiveRef.current = true;

    try {
      await ensurePlaybackReady().catch(() => null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      if (!audioContextRef.current) {
        const Ctor = getAudioContextCtor();
        if (!Ctor) throw new Error('Web Audio API unavailable');
        audioContextRef.current = new Ctor({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const monitorGain = ctx.createGain();
      monitorGain.gain.value = 0;
      audioSourceRef.current = source;
      monitorGainRef.current = monitorGain;

      if (await ensureMicWorklet(ctx)) {
        const processor = new AudioWorkletNode(ctx, MIC_WORKLET_NAME, {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        });
        processor.port.onmessage = (event: MessageEvent<{ samples?: Float32Array; level?: number }>) => {
          if (!captureActiveRef.current) return;
          const samples = event.data?.samples;
          if (!(samples instanceof Float32Array)) return;
          setMicLevel(Math.min(1, Math.max(0, event.data.level ?? 0)));
          sendAudio(encodePcm16Base64(samples));
        };
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(monitorGain);
      } else {
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          if (!captureActiveRef.current) return;
          const samples = e.inputBuffer.getChannelData(0);
          let energy = 0;
          for (let i = 0; i < samples.length; i++) {
            energy += samples[i] * samples[i];
          }
          setMicLevel(Math.min(1, Math.sqrt(energy / samples.length) * 3));
          sendAudio(encodePcm16Base64(samples));
        };
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(monitorGain);
      }
      monitorGain.connect(ctx.destination);
    } catch (err) {
      console.error('Failed to start mic capture:', err);
      stopCapture();
      flashToast('MIC / ERROR');
      setHolding(false);
      setCoreState('idle');
    }
  }, [armed, clearTimers, ensurePlaybackReady, flashToast, sendAudio, stopCapture]);

  const release = useCallback(() => {
    if (!holding && !captureActiveRef.current) return;
    setHolding(false);
    stopCapture();
    setCoreState('thinking');
  }, [holding, stopCapture]);

  // Spacebar PTT
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isEditableTarget(e.target)) {
        e.preventDefault();
        press();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isEditableTarget(e.target)) {
        e.preventDefault();
        release();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [press, release]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimers();
    stopCapture();
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    ctx?.close().catch(() => {});
  }, [clearTimers, stopCapture]);

  const renderMode = () => {
    const backendProps = {
      armed,
      holding,
      coreState,
      reply,
      obdValues,
      obdStatus,
      systemTelemetry,
      micLevel,
      outputLevel,
      thinkingIntensity,
      loading: isLoading,
      loadingPhase,
      onPress: press,
      onRelease: release,
    };
    switch (activeMode) {
      case 'Parked': return <ParkedMode {...backendProps} />;
      case 'Driving': return <DrivingMode {...backendProps} />;
      case 'Navigation': return <NavigationMode />;
      case 'Ambient': return <AmbientMode {...backendProps} />;
      default: return <ParkedMode {...backendProps} />;
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-vic-bg relative font-sans select-none">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2 border border-teal-500 bg-black/90 text-teal-400 font-mono text-[11px] tracking-[0.3em] shadow-[0_0_24px_rgba(79,209,197,0.4)]">
            {toast}
          </div>
        )}
      </AnimatePresence>

      {/* Live Stats Bar — wired to OBD + System */}
      <div className={`relative z-40 transition-opacity duration-500 ${isLoading ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <Header obdValues={obdValues} obdStatus={obdStatus} coreState={coreState} armed={armed} onToggleArm={() => setArmed((a) => !a)} />
      </div>

      {/* Mode Switcher */}
      <div className={`relative z-40 transition-opacity duration-500 ${isLoading ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <ModeNav activeMode={activeMode} setMode={setActiveMode} />
      </div>

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden px-3 sm:px-6 pt-2 pb-32">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto relative h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="h-full w-full"
            >
              {renderMode()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* iOS Style Dock */}
      <div className={`transition-opacity duration-500 ${isLoading ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <Taskbar onOpenApp={setActiveApp} />
      </div>

      <AnimatePresence>
        {isLoading && (
          <LoadingScreen
            onComplete={handleLoadingComplete}
            onPhaseChange={handleLoadingPhaseChange}
          />
        )}
      </AnimatePresence>

      {/* App Overlays */}
      <AnimatePresence>
        {activeApp === 'diagnostics' && (
          <DiagnosticsApp onClose={() => setActiveApp(null)} />
        )}
      </AnimatePresence>

      {/* PTT indicator */}
      {(holding || coreState === 'listening') && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 border border-red-500/60 bg-red-500/15 text-red-400 font-mono text-[10px] tracking-widest animate-pulse">
          ● CAPTURING — RELEASE SPACE TO SEND
        </div>
      )}
    </div>
  );
}
