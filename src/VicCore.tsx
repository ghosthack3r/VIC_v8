import { useEffect, useRef } from 'react';
import { useHudTheme } from './hudTheme';
import type { CoreState, ModeId } from './types';

interface VicCoreProps {
  size?: number;
  state?: CoreState;
  label?: string;
  mode?: ModeId;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

interface ThoughtPulse {
  id: number;
  t: number;
  angle: number;
}

interface Particle {
  a: number;
  r: number;
  speed: number;
  life: number;
}

function useSpeechEnvelope(active: boolean, envRef: React.MutableRefObject<number>) {
  useEffect(() => {
    if (!active) {
      envRef.current = 0;
      return;
    }

    let raf = 0;
    const t0 = performance.now();

    const loop = (time: number) => {
      const dt = (time - t0) / 1000;
      const carrier = 0.5 + 0.5 * Math.sin(dt * 14);
      const wordGate = Math.max(0, Math.sin(dt * 1.4 + Math.sin(dt * 0.6) * 2));
      const jitter = Math.random() * 0.25;
      envRef.current = Math.max(0, Math.min(1, carrier * wordGate * 0.9 + jitter * wordGate));
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, envRef]);
}

function useThoughtPulses(active: boolean, pulsesRef: React.MutableRefObject<ThoughtPulse[]>) {
  useEffect(() => {
    if (!active) {
      pulsesRef.current = [];
      return;
    }

    let id = 0;
    const spawn = () => {
      pulsesRef.current = [...pulsesRef.current, { id: id++, t: performance.now(), angle: Math.random() * Math.PI * 2 }].slice(-12);
    };
    const interval = window.setInterval(spawn, 420);
    spawn();

    const cleanup = window.setInterval(() => {
      pulsesRef.current = pulsesRef.current.filter((pulse) => performance.now() - pulse.t < 2200);
    }, 500);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(cleanup);
    };
  }, [active, pulsesRef]);
}

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const source = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  const value = Number.parseInt(source, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgba(rgb: [number, number, number], alpha: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function VicCore({ size = 280, state = 'idle', label = 'VIC', mode = 'driving', onPointerDown, onPointerUp }: VicCoreProps) {
  const { palette } = useHudTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechEnvRef = useRef(0);
  const pulsesRef = useRef<ThoughtPulse[]>([]);
  
  useSpeechEnvelope(state === 'speaking', speechEnvRef);
  useThoughtPulses(state === 'thinking', pulsesRef);

  const speechHistoryRef = useRef(new Array<number>(96).fill(0));
  const particlesRef = useRef<Particle[] | null>(null);

  if (!particlesRef.current) {
    particlesRef.current = Array.from({ length: 36 }).map(() => ({
      a: Math.random() * Math.PI * 2,
      r: size * (0.2 + Math.random() * 0.22),
      speed: (Math.random() * 0.6 + 0.3) * (Math.random() < 0.5 ? -1 : 1),
      life: Math.random(),
    }));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = size / 2;
    const coreRadius = size * 0.18;
    const primary = parseHex(palette.primary);
    const accent = parseHex(palette.accent);
    const red: [number, number, number] = [255, 74, 61];
    let raf = 0;
    let last = performance.now();

    const drawIdle = (time: number) => {
      const breath = 0.5 + 0.5 * Math.sin(time / 1400);

      for (let index = 3; index >= 0; index--) {
        const radius = coreRadius + index * (size * 0.04 + breath * size * 0.015);
        context.beginPath();
        context.arc(center, center, radius, 0, Math.PI * 2);
        context.strokeStyle = rgba(primary, 0.08 + 0.05 * (3 - index));
        context.lineWidth = 1;
        context.stroke();
      }

      const gradient = context.createRadialGradient(center, center, 0, center, center, coreRadius * 2);
      gradient.addColorStop(0, rgba(primary, 0.35 + breath * 0.1));
      gradient.addColorStop(0.6, rgba(primary, 0.08));
      gradient.addColorStop(1, rgba(primary, 0));
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(center, center, coreRadius * 2, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.arc(center, center, coreRadius + breath * 2, 0, Math.PI * 2);
      context.strokeStyle = rgba(primary, 0.8);
      context.lineWidth = 1.2;
      context.stroke();
    };

    const drawListening = (time: number) => {
      drawIdle(time);
      const pulse = 0.5 + 0.5 * Math.sin(time / 300);
      context.beginPath();
      context.arc(center, center, coreRadius + 6 + pulse * 5, 0, Math.PI * 2);
      context.strokeStyle = rgba(red, 0.65);
      context.lineWidth = 2;
      context.stroke();
    };

    const drawThinking = (time: number, delta: number) => {
      const gradient = context.createRadialGradient(center, center, 0, center, center, coreRadius * 1.6);
      gradient.addColorStop(0, rgba(accent, 0.25));
      gradient.addColorStop(1, rgba(accent, 0));
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(center, center, coreRadius * 2, 0, Math.PI * 2);
      context.fill();

      const spin = (time / 900) % (Math.PI * 2);
      context.beginPath();
      context.arc(center, center, coreRadius + 4, spin, spin + Math.PI * 1.2);
      context.strokeStyle = rgba(accent, 0.8);
      context.lineWidth = 1.8;
      context.stroke();

      const spin2 = (-time / 600) % (Math.PI * 2);
      context.beginPath();
      context.arc(center, center, coreRadius + 10, spin2, spin2 + Math.PI * 0.8);
      context.strokeStyle = rgba(primary, 0.55);
      context.lineWidth = 1;
      context.stroke();

      particlesRef.current?.forEach((particle) => {
        particle.a += particle.speed * delta * 0.001;
        particle.life += delta * 0.0004;
        if (particle.life > 1) {
          particle.life = 0;
        }

        const fade = Math.sin(particle.life * Math.PI);
        const x = center + Math.cos(particle.a) * particle.r;
        const y = center + Math.sin(particle.a) * particle.r;
        const x2 = center + Math.cos(particle.a - 0.08) * particle.r;
        const y2 = center + Math.sin(particle.a - 0.08) * particle.r;

        context.strokeStyle = rgba(primary, 0.15 * fade);
        context.lineWidth = 0.6;
        context.beginPath();
        context.moveTo(x2, y2);
        context.lineTo(x, y);
        context.stroke();

        context.fillStyle = rgba(primary, 0.3 + 0.6 * fade);
        context.beginPath();
        context.arc(x, y, 1.2 + 1.2 * fade, 0, Math.PI * 2);
        context.fill();
      });

      pulsesRef.current.forEach((pulse) => {
        const age = (performance.now() - pulse.t) / 2200;
        if (age > 1) {
          return;
        }

        const radius = size * 0.45 * age;
        for (let branch = 0; branch < 3; branch++) {
          const angle = pulse.angle + (branch - 1) * 0.18;
          context.beginPath();

          for (let segment = 0; segment <= 8; segment++) {
            const t = segment / 8;
            const distance = radius * t;
            const wobble = Math.sin(t * 6 + pulse.id) * size * 0.02 * (1 - t);
            const adjustedAngle = angle + wobble / Math.max(20, distance);
            const x = center + Math.cos(adjustedAngle) * distance;
            const y = center + Math.sin(adjustedAngle) * distance;

            if (segment === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          }

          context.strokeStyle = rgba(accent, 0.45 * (1 - age));
          context.lineWidth = 1;
          context.stroke();

          context.fillStyle = rgba(accent, 0.9 * (1 - age));
          context.beginPath();
          context.arc(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius, 2 * (1 - age) + 1, 0, Math.PI * 2);
          context.fill();
        }
      });

      context.fillStyle = rgba(accent, 0.9);
      context.beginPath();
      context.arc(center, center, 3, 0, Math.PI * 2);
      context.fill();
    };

    const drawSpeaking = (time: number) => {
      const envelope = speechEnvRef.current;
      speechHistoryRef.current.push(envelope);
      speechHistoryRef.current.shift();
      drawIdle(time);

      const history = speechHistoryRef.current;
      history.forEach((value, index) => {
        const angle = (index / history.length) * Math.PI * 2 - Math.PI / 2;
        const inner = coreRadius + 16;
        const outer = inner + value * size * 0.18;
        const x1 = center + Math.cos(angle) * inner;
        const y1 = center + Math.sin(angle) * inner;
        const x2 = center + Math.cos(angle) * outer;
        const y2 = center + Math.sin(angle) * outer;

        context.strokeStyle = rgba(primary, 0.2 + value * 0.55);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
      });

      context.beginPath();
      context.arc(center, center, coreRadius + 12 + envelope * 8, 0, Math.PI * 2);
      context.strokeStyle = rgba(accent, 0.35 + envelope * 0.45);
      context.lineWidth = 1.8;
      context.stroke();
    };

    const loop = (time: number) => {
      const delta = time - last;
      last = time;
      context.clearRect(0, 0, size, size);

      if (state === 'listening') {
        drawListening(time);
      } else if (state === 'thinking') {
        drawThinking(time, delta);
      } else if (state === 'speaking') {
        drawSpeaking(time);
      } else {
        drawIdle(time);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [palette.accent, palette.primary, size, state]);

  return (
    <div
      className={`vic-core vic-core-${state}`}
      style={{ width: size, height: size, cursor: (onPointerDown || onPointerUp) ? 'pointer' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="vic-core-label">
        <span>{state === 'listening' ? 'LISTEN' : state === 'thinking' ? 'THINK' : state === 'speaking' ? 'VOICE' : 'STANDBY'}</span>
        <strong>{label}</strong>
        <em>{mode.toUpperCase()}</em>
      </div>
    </div>
  );
}
