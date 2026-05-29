import { useEffect, useRef } from 'react';

export type VisualizerMode = 'standby' | 'loading' | 'listening' | 'thinking' | 'working' | 'talking';

interface SoundVisualizerProps {
  baseRadius?: number;
  lineCount?: number;
  colors?: string[];
  mode?: VisualizerMode;
  micLevel?: number;
  outputLevel?: number;
  thinkingIntensity?: number;
}

const DEFAULT_COLORS = ['#00f3ff', '#4d00ff', '#ff00c8'];

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export const SoundVisualizer: React.FC<SoundVisualizerProps> = ({
  baseRadius = 150,
  lineCount = 40,
  colors = DEFAULT_COLORS,
  mode = 'standby',
  micLevel = 0,
  outputLevel = 0,
  thinkingIntensity = 0.35,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const micLevelRef = useRef(micLevel);
  const outputLevelRef = useRef(outputLevel);
  const thinkingIntensityRef = useRef(thinkingIntensity);
  const colorsRef = useRef(colors);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    micLevelRef.current = clamp01(micLevel);
  }, [micLevel]);

  useEffect(() => {
    outputLevelRef.current = clamp01(outputLevel);
  }, [outputLevel]);

  useEffect(() => {
    thinkingIntensityRef.current = clamp01(thinkingIntensity);
  }, [thinkingIntensity]);

  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let time = 0;
    let currentSpikeAmp = 30;
    let currentWobbleAmp = 15;
    let currentSpeedMult = 1;
    let currentBeatMult = 1;
    let currentHighlightIndex = 1;
    let currentHighlightIntensity = 0;
    let currentTunnelEffect = 1;
    let currentAudioLevel = 0;
    let smoothMicLevel = 0;
    let smoothOutputLevel = 0;
    let smoothThinkingIntensity = 0.35;
    let previousMode = modeRef.current;

    let talkingFlourish = 0;
    let talkingVelocity = 0;
    let thinkingFlourish = 0;
    let thinkingVelocity = 0;
    let listeningFlourish = 0;
    let listeningVelocity = 0;
    let standbyFlourish = 0;
    let standbyVelocity = 0;
    let workingFlourish = 0;
    let workingVelocity = 0;
    let loadingFlourish = 0;
    let loadingVelocity = 0;
    let wakeUpFlourish = 0;
    let wakeUpVelocity = 0;

    let resizeFrame = 0;
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const scheduleResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resizeCanvas);
    };

    const parent = canvas.parentElement;
    const observer = parent && 'ResizeObserver' in window
      ? new ResizeObserver(scheduleResize)
      : null;
    if (parent) observer?.observe(parent);

    window.addEventListener('resize', scheduleResize);
    scheduleResize();
    const settleTimers = [
      window.setTimeout(scheduleResize, 80),
      window.setTimeout(scheduleResize, 250),
      window.setTimeout(scheduleResize, 700),
    ];

    const getColor = (normalizedIndex: number) => {
      const rgbColors = colorsRef.current.map(hexToRgb);
      const scaledIndex = normalizedIndex * (rgbColors.length - 1);
      const index1 = Math.floor(scaledIndex);
      const index2 = Math.min(index1 + 1, rgbColors.length - 1);
      const t = scaledIndex - index1;
      const c1 = rgbColors[index1];
      const c2 = rgbColors[index2];
      const r = Math.round(c1.r + (c2.r - c1.r) * t);
      const g = Math.round(c1.g + (c2.g - c1.g) * t);
      const b = Math.round(c1.b + (c2.b - c1.b) * t);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const updateSpring = (value: number, velocity: number) => {
      let nextVelocity = velocity - value * 0.05;
      nextVelocity *= 0.85;
      return {
        value: value + nextVelocity,
        velocity: nextVelocity,
      };
    };

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const currentMode = modeRef.current;
      const sizeScale = Math.min(1, Math.max(0.2, Math.min(width, height) / 760));
      const effectiveBaseRadius = baseRadius * sizeScale;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      smoothMicLevel += (micLevelRef.current - smoothMicLevel) * 0.16;
      smoothOutputLevel += (outputLevelRef.current - smoothOutputLevel) * 0.16;
      smoothThinkingIntensity += (thinkingIntensityRef.current - smoothThinkingIntensity) * 0.08;

      if (previousMode !== currentMode) {
        if (currentMode === 'talking') talkingVelocity += 0.35;
        if (currentMode === 'thinking') thinkingVelocity += 0.35;
        if (currentMode === 'listening') listeningVelocity += 0.35;
        if (currentMode === 'standby') standbyVelocity += 0.35;
        if (currentMode === 'working') workingVelocity += 0.35;
        if (currentMode === 'loading') loadingVelocity += 0.35;
        if (previousMode === 'standby' && currentMode !== 'standby') wakeUpVelocity += 0.5;
        previousMode = currentMode;
      }

      const talkingSpring = updateSpring(talkingFlourish, talkingVelocity);
      talkingFlourish = talkingSpring.value;
      talkingVelocity = talkingSpring.velocity;

      const thinkingSpring = updateSpring(thinkingFlourish, thinkingVelocity);
      thinkingFlourish = thinkingSpring.value;
      thinkingVelocity = thinkingSpring.velocity;

      const listeningSpring = updateSpring(listeningFlourish, listeningVelocity);
      listeningFlourish = listeningSpring.value;
      listeningVelocity = listeningSpring.velocity;

      const standbySpring = updateSpring(standbyFlourish, standbyVelocity);
      standbyFlourish = standbySpring.value;
      standbyVelocity = standbySpring.velocity;

      const workingSpring = updateSpring(workingFlourish, workingVelocity);
      workingFlourish = workingSpring.value;
      workingVelocity = workingSpring.velocity;

      const loadingSpring = updateSpring(loadingFlourish, loadingVelocity);
      loadingFlourish = loadingSpring.value;
      loadingVelocity = loadingSpring.velocity;

      const wakeSpring = updateSpring(wakeUpFlourish, wakeUpVelocity);
      wakeUpFlourish = wakeSpring.value;
      wakeUpVelocity = wakeSpring.velocity;

      const speechEnvelope = Math.max(
        0,
        Math.sin(time * 7) * Math.sin(time * 2.8) * Math.sin(time * 16.1),
      );
      currentAudioLevel += (Math.random() * speechEnvelope - currentAudioLevel) * 0.3;

      const listeningLevel = Math.max(smoothMicLevel, currentMode === 'listening' ? currentAudioLevel * 0.18 : 0);
      const talkingLevel = Math.max(smoothOutputLevel, currentMode === 'talking' ? currentAudioLevel : 0);
      const thinkIntensity = Math.max(0.18, smoothThinkingIntensity);
      const extraSpikes = Math.max(0, talkingFlourish) * 100;
      const extraGlow =
        Math.max(0, talkingFlourish) * 60 +
        Math.max(0, wakeUpFlourish) * 80 +
        Math.max(0, loadingFlourish) * 100;
      const extraRotationSpeed = Math.max(0, thinkingFlourish) * 20;
      const extraRadiusOffset =
        Math.max(0, standbyFlourish) * 120 -
        Math.max(0, listeningFlourish) * 100 +
        Math.max(0, wakeUpFlourish) * 50 +
        Math.sin(Math.max(0, workingFlourish) * Math.PI) * 60;
      const spikeSuppression = Math.max(0, 1 - listeningFlourish * 2);

      const targetSpikeAmp =
        currentMode === 'standby' ? 0 :
        currentMode === 'loading' ? 4 :
        currentMode === 'listening' ? 2 + listeningLevel * 35 :
        currentMode === 'thinking' ? 8 + thinkIntensity * 14 :
        currentMode === 'working' ? 15 + thinkIntensity * 16 :
        18 + talkingLevel * 40;

      const targetWobbleAmp =
        currentMode === 'standby' ? 2 :
        currentMode === 'loading' ? 8 :
        currentMode === 'listening' ? 5 + listeningLevel * 15 :
        currentMode === 'thinking' ? 18 + thinkIntensity * 24 :
        currentMode === 'working' ? 28 + thinkIntensity * 20 :
        12 + talkingLevel * 22;

      const targetSpeedMult =
        currentMode === 'standby' ? 0.05 :
        currentMode === 'loading' ? 2.5 :
        currentMode === 'listening' ? 0.2 + listeningLevel * 0.5 :
        currentMode === 'thinking' ? 0.9 + thinkIntensity * 1.4 :
        currentMode === 'working' ? 0.6 + thinkIntensity :
        0.8 + talkingLevel;

      const targetBeatMult =
        currentMode === 'standby' ? 0 :
        currentMode === 'loading' ? 2.5 :
        currentMode === 'listening' ? 0.2 + listeningLevel * 1.5 :
        currentMode === 'thinking' ? 0.3 + thinkIntensity :
        currentMode === 'working' ? 1 + thinkIntensity :
        1 + talkingLevel * 2;

      let targetHighlightIndex =
        currentMode === 'listening' ? 0 :
        currentMode === 'working' ? 0.75 :
        currentMode === 'talking' ? 1 :
        0.5;
      if (currentMode === 'loading') targetHighlightIndex = (time * 0.8) % 1;

      const targetHighlightIntensity = currentMode === 'standby' ? 0 : 1;
      const targetTunnelEffect = currentMode === 'standby' ? 1 : 0;
      const tunnelLerpSpeed = targetTunnelEffect === 0 ? 0.15 : 0.025;

      currentSpikeAmp += (targetSpikeAmp - currentSpikeAmp) * 0.06;
      currentWobbleAmp += (targetWobbleAmp - currentWobbleAmp) * 0.06;
      currentSpeedMult += (targetSpeedMult - currentSpeedMult) * 0.06;
      currentBeatMult += (targetBeatMult - currentBeatMult) * 0.06;
      currentHighlightIndex += (targetHighlightIndex - currentHighlightIndex) * (currentMode === 'loading' ? 0.2 : 0.06);
      currentHighlightIntensity += (targetHighlightIntensity - currentHighlightIntensity) * 0.06;
      currentTunnelEffect += (targetTunnelEffect - currentTunnelEffect) * tunnelLerpSpeed;

      const beatPulse = Math.sin(time * 2 * currentSpeedMult) * 0.5 + 0.5;
      const currentBaseRadius =
        effectiveBaseRadius + beatPulse * 10 * currentBeatMult * sizeScale + extraRadiusOffset * sizeScale;

      for (let j = 0; j < lineCount; j++) {
        ctx.beginPath();

        const normalizedIndex = j / lineCount;
        const color = getColor(normalizedIndex);
        const phaseOffset = normalizedIndex * Math.PI * 2;
        const workingComplexity = currentMode === 'working' ? 2 : 1;
        const lineWobbleFreq = (2 + (j % 4)) * workingComplexity;
        const lineSpikeFreq = 8 + (j % 6);
        const lineSpeed = (1 + normalizedIndex * 2) * currentSpeedMult;
        const thinkingRotation = currentMode === 'thinking' ? time * (0.3 + thinkIntensity * 0.8) : 0;
        const transitionRotation = time * extraRotationSpeed;
        const lineRotation = normalizedIndex * Math.PI + thinkingRotation + transitionRotation;

        let audioMultiplier = 0;
        if (currentMode === 'listening') {
          const dist = Math.abs(normalizedIndex);
          audioMultiplier = Math.max(0, 1 - dist * 3) * listeningLevel;
        } else if (currentMode === 'talking') {
          const dist = Math.abs(normalizedIndex - 1);
          audioMultiplier = Math.max(0, 1 - dist * 3) * talkingLevel;
        } else if (currentMode === 'thinking' || currentMode === 'working') {
          const dist = Math.abs(normalizedIndex - 0.5);
          audioMultiplier = Math.max(0, 1 - dist * 3) * thinkIntensity * 0.55;
        }

        const breathCycle = Math.sin(time * 0.4) * 1.5;
        const wakeUpPush = Math.max(0, wakeUpFlourish) * 2;
        let tunnelProgress = (normalizedIndex + breathCycle - wakeUpPush) % 1;
        if (tunnelProgress < 0) tunnelProgress += 1;
        const tunnelBaseSize = Math.max(22, effectiveBaseRadius * 0.28) + Math.sin(time * 0.4) * 8 * sizeScale;
        const tunnelR = tunnelBaseSize + tunnelProgress * effectiveBaseRadius * 1.65;
        const tunnelAlpha = Math.sin(tunnelProgress * Math.PI);

        for (let i = 0; i <= Math.PI * 2 + 0.1; i += 0.05) {
          const angle = i + lineRotation;
          const wobble =
            Math.sin(angle * lineWobbleFreq + time * lineSpeed + phaseOffset) *
            (currentWobbleAmp * (0.5 + normalizedIndex));
          const spikeModulator = Math.sin(i * 2) * Math.cos(i * 2);
          const spikes =
            Math.sin(angle * lineSpikeFreq - time * 3 * lineSpeed) *
            ((currentSpikeAmp + extraSpikes) * (0.5 + (j % 3) * 0.5)) *
            Math.abs(spikeModulator) *
            (1 + beatPulse * currentBeatMult) *
            spikeSuppression;
          const audioSpikes = Math.sin(angle * 30 - time * 20) * audioMultiplier * 80;
          const depthOffset = Math.sin(normalizedIndex * Math.PI * 4 + time * currentSpeedMult) * 20;
          const normalR = currentBaseRadius + wobble + spikes + audioSpikes + depthOffset;
          const radius = normalR * (1 - currentTunnelEffect) + tunnelR * currentTunnelEffect;
          const x = centerX + radius * Math.cos(i);
          const y = centerY + radius * Math.sin(i);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.closePath();
        const dist = Math.abs(normalizedIndex - currentHighlightIndex);
        const highlightMultiplier = Math.max(0, 1 - dist * 3.5) * currentHighlightIntensity;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1 + highlightMultiplier * 2 + audioMultiplier * 4;
        ctx.shadowBlur = 10 + highlightMultiplier * 15 + currentTunnelEffect * 10 + extraGlow + audioMultiplier * 25;
        ctx.shadowColor = color;

        const baseAlpha = 0.3 + highlightMultiplier * 0.5 + audioMultiplier * 0.5;
        const normalAlpha = baseAlpha + Math.sin(time * 3 + normalizedIndex * 10) * 0.1;
        ctx.globalAlpha = normalAlpha * (1 - currentTunnelEffect) + tunnelAlpha * 0.6 * currentTunnelEffect;
        ctx.stroke();
      }

      time += 0.011;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', scheduleResize);
      observer?.disconnect();
      cancelAnimationFrame(resizeFrame);
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      cancelAnimationFrame(animationFrameId);
    };
  }, [baseRadius, lineCount]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full"
      style={{ background: 'transparent' }}
    />
  );
};
