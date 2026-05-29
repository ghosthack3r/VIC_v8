import { useCallback, useEffect, useRef, useState } from 'react';
import { getBridge, isBridgeAvailable, type ObdStatus, type ObdTelemetry, type SystemTelemetry } from './pcBridge';
import type { CoreState } from './types';

export function useTacClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

export function useTacBins(active: boolean, bins = 48) {
  const [data, setData] = useState(() => new Array<number>(bins).fill(0.08));

  useEffect(() => {
    const id = window.setInterval(() => {
      setData((previous) =>
        previous.map((_, index) => {
          if (!active) {
            return 0.06 + 0.05 * Math.abs(Math.sin(Date.now() / 800 + index / 2.4));
          }

          const base = 0.22 + 0.5 * Math.abs(Math.sin(Date.now() / 180 + index / 3));
          return Math.min(1, base + 0.22 * Math.random());
        }),
      );
    }, 70);

    return () => window.clearInterval(id);
  }, [active, bins]);

  return data;
}

export function useTickingValue(start: number, rate = 0.2, range = 0.06) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    const id = window.setInterval(() => {
      setValue((current) => {
        const delta = (Math.random() - 0.5) * range * rate * 4;
        return Math.max(0, current + delta);
      });
    }, 900);

    return () => window.clearInterval(id);
  }, [rate, range, start]);

  return value;
}

export function useSystemTelemetry(intervalMs = 1500): SystemTelemetry | null {
  const [data, setData] = useState<SystemTelemetry | null>(null);

  useEffect(() => {
    const bridge = getBridge();
    if (!bridge) return;

    let unsub = () => {};
    let cancelled = false;

    bridge.system.startStream(intervalMs).then(() => {
      if (cancelled) return;
      unsub = bridge.system.onTelemetry((snapshot) => setData(snapshot));
    });

    return () => {
      cancelled = true;
      unsub();
      bridge.system.stopStream().catch(() => {});
    };
  }, [intervalMs]);

  return data;
}

export function useObdStream(): { status: ObdStatus; values: ObdTelemetry['values'] } {
  const [status, setStatus] = useState<ObdStatus>({ connected: false });
  const [values, setValues] = useState<ObdTelemetry['values']>({});

  useEffect(() => {
    const bridge = getBridge();
    if (!bridge) return;

    let cancelled = false;
    bridge.obd.status().then((s) => !cancelled && setStatus(s));

    const offTelemetry = bridge.obd.onTelemetry((data) => setValues(data.values));
    const offStatus = bridge.obd.onStatus((s) => setStatus(s));

    return () => {
      cancelled = true;
      offTelemetry();
      offStatus();
    };
  }, []);

  return { status, values };
}

export function useBridgeAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(isBridgeAvailable());
  }, []);
  return available;
}

export function useGeminiLive() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [liveCoreState, setLiveCoreState] = useState<CoreState>('idle');
  const [outputLevel, setOutputLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getOrCreatePlaybackContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      return audioContextRef.current;
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      throw new Error('Web Audio API unavailable');
    }

    const ctx = new AudioContextCtor({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    setAudioContext(ctx);
    return ctx;
  }, []);

  const ensurePlaybackReady = useCallback(async () => {
    const ctx = getOrCreatePlaybackContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }, [getOrCreatePlaybackContext]);

  useEffect(() => {
    const decay = window.setInterval(() => {
      setOutputLevel((current) => (current < 0.01 ? 0 : current * 0.82));
    }, 120);

    return () => window.clearInterval(decay);
  }, []);

  useEffect(() => {
    const bridge = getBridge();
    if (!bridge) return;

    const offStatus = bridge.gemini.onStatus((s) => {
      setConnected(s.connected);
      setError(s.error || null);
    });

    let nextStartTime = 0;
    const activeSources: AudioBufferSourceNode[] = [];

    const offAudio = bridge.gemini.onAudio((base64) => {
      let ctx: AudioContext;
      try {
        ctx = getOrCreatePlaybackContext();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return;
      }
      if (ctx.state === 'closed') return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => {
          console.warn('[useGeminiLive] failed to resume audio context:', err);
        });
      }
      setLiveCoreState('speaking');
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const pcm16 = new Int16Array(bytes.buffer);
        if (pcm16.length === 0) return;
        const float32 = new Float32Array(pcm16.length);
        let energy = 0;
        for (let i = 0; i < pcm16.length; i++) {
          const sample = pcm16[i] / 32768;
          float32[i] = sample;
          energy += sample * sample;
        }
        const level = Math.min(1, Math.sqrt(energy / pcm16.length) * 3);
        setOutputLevel((current) => Math.max(current * 0.65, level));

        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const startTime = Math.max(ctx.currentTime, nextStartTime);
        source.start(startTime);
        nextStartTime = startTime + buffer.duration;

        activeSources.push(source);
        source.onended = () => {
          const index = activeSources.indexOf(source);
          if (index > -1) activeSources.splice(index, 1);
          try { source.disconnect(); } catch {}
          
          // If no more sources are playing, return to idle
          if (activeSources.length === 0) {
            setLiveCoreState('idle');
          }
        };
      } catch (err) {
        console.warn('[useGeminiLive] failed to play audio chunk:', err);
      }
    });

    const offInterrupted = bridge.gemini.onInterrupted(() => {
      activeSources.forEach((s) => {
        try { s.stop(); } catch {}
      });
      activeSources.length = 0;
      setLiveCoreState('idle');
      setOutputLevel(0);
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') nextStartTime = ctx.currentTime;
    });

    const offTurnComplete = bridge.gemini.onTurnComplete(() => {
        // Turn complete handled by audio queue drainage
    });

    // === Auto-route transcriptions to Command Router (v1.1) ===
    const offTranscription = bridge.gemini.onTranscription?.((text: string) => {
      if (!text || !bridge.command) return;
      bridge.command.parseAndExecute({ transcript: text, source: 'voice' }).catch(() => {});
    });

    // Handle function calls from real Gemini Live
    const offFunctionCall = bridge.gemini.onFunctionCall?.(async (call: { name: string; args: any }) => {
      if (!bridge.command) return;

      try {
        const result = await bridge.command.parseAndExecute({
          transcript: `${call.name} ${JSON.stringify(call.args || {})}`,
          source: 'gemini-function',
        });

        // Send function response back to Gemini
        bridge.gemini.sendFunctionResponse?.({
          name: call.name,
          response: result?.result || { success: true },
        });
      } catch (err) {
        console.warn('[useGeminiLive] function call handling failed:', err);
      }
    });

    bridge.gemini.connect().then((result) => {
      if (result && typeof result === 'object' && 'error' in result) {
        setError(result.error);
      }
    }).catch((err) => setError(err?.message || String(err)));

    return () => {
      offStatus();
      offAudio();
      offInterrupted();
      offTurnComplete();
      offTranscription?.();
      offFunctionCall?.();
      bridge.gemini.disconnect().catch(() => {});
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      setAudioContext(null);
      setOutputLevel(0);
      ctx?.close().catch(() => {});
    };
  }, [getOrCreatePlaybackContext]);

  const sendAudio = (base64: string) => {
    getBridge()?.gemini.sendAudio(base64);
  };

  return { connected, error, sendAudio, audioContext, ensurePlaybackReady, liveCoreState, outputLevel };
}

/**
 * Persistent vehicle data (notes, tasks, parts, vehicle info)
 * Loads from bridge on mount, saves on change. Falls back to localStorage.
 */
export function usePersistentVehicleData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bridge = getBridge();

  useEffect(() => {
    const load = async () => {
      if (bridge?.vehicleData) {
        try {
          const saved = await bridge.vehicleData.load();
          setData(saved);
        } catch {
          // fallback
          const local = localStorage.getItem('vic-vehicle-data');
          setData(local ? JSON.parse(local) : null);
        }
      } else {
        const local = localStorage.getItem('vic-vehicle-data');
        setData(local ? JSON.parse(local) : null);
      }
      setLoading(false);
    };
    load();
  }, [bridge]);

  const save = async (newData: any) => {
    setData(newData);
    localStorage.setItem('vic-vehicle-data', JSON.stringify(newData));
    if (bridge?.vehicleData) {
      await bridge.vehicleData.save(newData);
    }
  };

  const updateMileage = async (miles: number) => {
    if (data) {
      const updated = { ...data, vehicle: { ...data.vehicle, mileage: miles } };
      await save(updated);
    }
  };

  return { data, loading, save, updateMileage };
}
