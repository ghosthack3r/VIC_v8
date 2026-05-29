import { useCallback, useEffect, useRef, useState } from 'react';
import { useVicMockData } from './data';
import { HudThemeProvider } from './hudTheme';
import { Icon } from './icons';
import { useTacBins, useTacClock, useGeminiLive } from './hooks';
import { getPalette, hudCssVars } from './palettes';
import { getBridge } from './pcBridge';
import { cut } from './primitives';
import { AmbientScreen, DiagnosticsScreen, DrivingScreen, ParkedScreen } from './screens';
import { NavScreen } from './NavScreen';
import { SystemScreen } from './SystemScreen';
import { TweaksPanel, useTweaks } from './TweaksPanel';
import type { CoreState, ModeId } from './types';
import type { VicWindowControls } from './pcBridge';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
}

function getAudioContextCtor() {
  return window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function encodePcm16Base64(samples: Float32Array) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export function HudShell() {
  const data = useVicMockData();
  const now = useTacClock();
  const { tweaks, setTweak } = useTweaks();
  const palette = getPalette(tweaks.palette);
  const [mode, setMode] = useState<ModeId>('driving');
  const [armed, setArmed] = useState(true);
  const [holding, setHolding] = useState(false);
  const [reply, setReply] = useState('Standing by.');
  const [lastInput, setLastInput] = useState('AWAITING INPUT');
  const [toast, setToast] = useState('');
  const [coreState, setCoreState] = useState<CoreState>('idle');
  const [showTweaks, setShowTweaks] = useState(false);
  const { sendAudio, ensurePlaybackReady, liveCoreState } = useGeminiLive();
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const captureActiveRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const bins = useTacBins(holding || coreState === 'speaking', 96);

  const flashToast = useCallback((message: string, duration = 1600) => {
    setToast(message);
    window.setTimeout(() => setToast(''), duration);
  }, []);

  useEffect(() => {
    if (liveCoreState === 'speaking') {
      setCoreState('speaking');
    } else if (coreState === 'speaking' && liveCoreState === 'idle') {
      setCoreState('idle');
    }
  }, [liveCoreState, coreState]);

  // === Command Router Integration (new in v1.1) ===
  useEffect(() => {
    const bridge = getBridge();
    if (!bridge?.command) return;

    const offResponse = bridge.command.onResponse((entry) => {
      if (entry?.result?.message) {
        flashToast(`VIC / ${entry.result.message}`, 2200);
      }
      if (entry?.command?.type === 'switch_mode' && entry.result?.success) {
        const target = entry.command.params?.mode as ModeId;
        if (target) setMode(target);
      }
    });

    const offMode = bridge.command.onModeChange((data) => {
      if (data?.mode) {
        const target = data.mode as ModeId;
        setMode(target);
        flashToast(`MODE / ${target.toUpperCase()}`);
      }
    });

    return () => {
      offResponse();
      offMode();
    };
  }, [flashToast, setMode]);

  const time = now.toLocaleTimeString([], { hour12: false });
  const date = now.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const stopCapture = useCallback(() => {
    captureActiveRef.current = false;

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try { processorRef.current.disconnect(); } catch {}
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
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const press = useCallback(async () => {
    if (!armed) {
      flashToast('MIC / DISARMED');
      return;
    }

    if (captureActiveRef.current) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      flashToast('MIC / UNAVAILABLE');
      return;
    }

    clearTimers();
    setReply('');
    setHolding(true);
    setCoreState('listening');
    setLastInput('// CAPTURING...');
    captureActiveRef.current = true;

    try {
      await ensurePlaybackReady().catch(() => null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Initialize or reuse capture context
      if (!audioContextRef.current) {
        const AudioContextCtor = getAudioContextCtor();
        if (!AudioContextCtor) {
          throw new Error('Web Audio API unavailable');
        }
        audioContextRef.current = new AudioContextCtor({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const monitorGain = audioContext.createGain();
      monitorGain.gain.value = 0;
      audioSourceRef.current = source;
      processorRef.current = processor;
      monitorGainRef.current = monitorGain;

      processor.onaudioprocess = (e) => {
        if (!captureActiveRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        sendAudio(encodePcm16Base64(inputData));
      };

      source.connect(processor);
      processor.connect(monitorGain);
      monitorGain.connect(audioContext.destination);
    } catch (err) {
      console.error('Failed to start mic capture:', err);
      stopCapture();
      flashToast('MIC / ERROR');
      setHolding(false);
      setCoreState('idle');
      setLastInput('AWAITING INPUT');
    }
  }, [armed, clearTimers, ensurePlaybackReady, flashToast, sendAudio, stopCapture]);

  const release = useCallback(() => {
    if (!holding && !captureActiveRef.current) {
      return;
    }

    setHolding(false);
    stopCapture();

    setCoreState('thinking');
  }, [holding, stopCapture]);

  useEffect(() => {
    const bridge = getBridge();
    if (!bridge) return;

    const offTranscription = bridge.gemini.onTranscription((text) => {
      setReply((current) => current === 'Standing by.' ? text : current + text);
    });

    const offInterrupted = bridge.gemini.onInterrupted(() => {
      setCoreState('idle');
      setReply('Standing by.');
    });

    const offTurnComplete = bridge.gemini.onTurnComplete(() => {
      // Transition handled by liveCoreState hook
    });

    return () => {
      offTranscription();
      offInterrupted();
      offTurnComplete();
    };
  }, []);

  useEffect(() => () => {
    clearTimers();
    stopCapture();
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    ctx?.close().catch(() => {});
  }, [clearTimers, stopCapture]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.code === 'KeyT') {
        event.preventDefault();
        setShowTweaks((visible) => !visible);
        return;
      }

      if (event.code === 'Space' && !event.repeat && !isEditableTarget(event.target)) {
        event.preventDefault();
        press();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isEditableTarget(event.target)) {
        event.preventDefault();
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

  const setModeWithToast = (nextMode: ModeId) => {
    setMode(nextMode);
    flashToast(`MODE / ${nextMode.toUpperCase()}`);
  };

  const handleWindowAction = (action: keyof VicWindowControls) => {
    window.vicWindow?.[action]();
  };

  const screenProps = {
    data,
    armed,
    holding,
    coreState,
    reply,
    lastInput,
    onPress: press,
    onRelease: release,
  };

  return (
    <HudThemeProvider paletteId={tweaks.palette}>
      <main
        className={`hud-shell${tweaks.chrome ? '' : ' hud-shell-no-chrome'}`}
        style={{
          ...hudCssVars(palette),
          '--hud-scale': tweaks.tabletMode ? 1.4 : 1,
        } as any}
      >
        {tweaks.grid ? <div className="hud-grid-overlay" aria-hidden="true" /> : null}
        {tweaks.scanlines ? <div className="hud-scanlines" aria-hidden="true" /> : null}

        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => (
          <div key={corner} className={`corner-tick ${corner}`} aria-hidden="true" />
        ))}

        {tweaks.chrome ? (
          <header className="top-bar">
            <div className="brand-mark" aria-hidden="true" />
            <div className="brand-copy">
              <strong>V.I.C / TAC-01</strong>
              <span>CROWN.VIC.P71 / {data.vehicle.plate} / {data.vehicle.mileage.toLocaleString()}MI</span>
            </div>
            <div className="top-spacer" />
            <div className="status-cluster">
              <span>[SYS.ONLINE]</span>
              <span>[MIC.RDY]</span>
              <span className="warn-text">[OBD.OFFLINE]</span>
            </div>
            <div className="top-spacer" />
            <time>{date} / {time}</time>
            <button className="dev-lab-button" onClick={() => setShowTweaks((visible) => !visible)} title="Open tweaks panel" aria-label="Open tweaks panel">
              <Icon name="sparkles" width={12} height={12} />
              DEV LAB
            </button>
            <button
              className="icon-button"
              onClick={() => handleWindowAction('minimize')}
              aria-label="Minimize shell"
              title="Minimize shell"
            >
              <Icon name="min" width={13} height={13} />
            </button>
            <button
              className="icon-button"
              onClick={() => handleWindowAction('toggleFullscreen')}
              aria-label="Toggle fullscreen shell"
              title="Toggle fullscreen shell"
            >
              <Icon name="max" width={13} height={13} />
            </button>
            <button
              className="icon-button icon-button-warn"
              onClick={() => handleWindowAction('close')}
              aria-label="Close shell"
              title="Close shell"
            >
              <Icon name="close" width={13} height={13} />
            </button>
          </header>
        ) : null}

        <section className="mode-bar" aria-label="VIC mode selector">
          {data.modes.map((option) => (
            <button
              key={option.id}
              className={mode === option.id ? 'active' : ''}
              onClick={() => setModeWithToast(option.id)}
              style={{ clipPath: cut(8) }}
            >
              <span>{option.glyph}</span>
              {option.label}
            </button>
          ))}
          <div className="mode-spacer" />
          <div className="issue-chip" style={{ clipPath: cut(6) }}>
            <span />
            {data.counts.openIssues} OPEN / {data.counts.pendingTasks} TASKS
          </div>
          <button
            className={`arm-button${armed ? ' active' : ''}`}
            onClick={() => setArmed((current) => !current)}
            style={{ clipPath: cut(6) }}
          >
            <Icon name="power" width={12} height={12} />
            {armed ? 'ARMED' : 'DISARMED'}
          </button>
        </section>

        <section className="hud-body" aria-live="polite">
          {mode === 'driving' ? <DrivingScreen {...screenProps} /> : null}
          {mode === 'nav' ? <NavScreen /> : null}
          {mode === 'parked' ? <ParkedScreen {...screenProps} /> : null}
          {mode === 'diagnostics' ? <DiagnosticsScreen {...screenProps} /> : null}
          {mode === 'system' ? <SystemScreen /> : null}
          {mode === 'ambient' ? <AmbientScreen {...screenProps} /> : null}
        </section>

        <footer className="bottom-dock">
          <button
            className={`ptt-button${holding ? ' active' : ''}`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              press();
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              release();
            }}
            onPointerCancel={release}
            onPointerLeave={() => holding && release()}
            style={{ clipPath: cut(8) }}
          >
            <Icon name="mic" width={16} height={16} sw={1.8} />
            {holding ? 'LIVE' : 'PTT'}
          </button>

          <div className="audio-bars" aria-hidden="true">
            {bins.slice(0, 48).map((value, index) => (
              <span key={index} style={{ height: `${value * 100}%`, opacity: 0.3 + value * 0.7 }} />
            ))}
          </div>

          <div className="input-status">{holding ? 'CAPTURING...' : lastInput}</div>
          <div className="dock-spacer" />
          <div className="quick-actions">
            {data.quickActions.map((action) => (
              <button key={action.id} onClick={() => flashToast(`${action.label} / READY`)} style={{ clipPath: cut(6) }}>
                <Icon name={action.icon} width={14} height={14} />
                <span>{action.label}</span>
                <em>{action.hotkey}</em>
              </button>
            ))}
          </div>
        </footer>

        {toast ? (
          <div className="hud-toast" style={{ clipPath: cut(6) }}>
            {toast}
          </div>
        ) : null}

        <TweaksPanel visible={showTweaks} tweaks={tweaks} onChange={setTweak} onClose={() => setShowTweaks(false)} />
      </main>
    </HudThemeProvider>
  );
}
