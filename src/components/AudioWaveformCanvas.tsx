import React, { useRef, useEffect, useState, useMemo } from 'react';
import { getRealtimeWaveformData, getPlaybackProgress, seekPlayback } from '../services/audioSynth';

interface AudioWaveformCanvasProps {
  soundId: string;
  soundType: string;
  duration?: string;
  isPlaying: boolean;
  theme?: 'light' | 'dark';
  height?: number;
  barWidth?: number;
  barGap?: number;
  leftLocatorRatio?: number; // 0..1
  rightLocatorRatio?: number; // 0..1
  onSeek?: (ratio: number) => void;
  className?: string;
}

// Deterministic pseudo-random number generator for realistic static waveform profile
function generateWaveformProfile(id: string, soundType: string, count: number = 60): number[] {
  let hash = 0;
  const str = `${id}-${soundType}-humason-maghreb`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  const result: number[] = [];
  let prev = 0.4;

  for (let i = 0; i < count; i++) {
    const x = Math.sin((i + Math.abs(hash % 100)) * 0.25) * 0.35 + 0.5;
    const noise = (((Math.abs(hash * (i + 13)) % 1000) / 1000) - 0.5) * 0.4;
    
    // Create organic musical phrasing (intros, peaks, fades)
    const envelope = Math.sin((i / (count - 1)) * Math.PI) * 0.4 + 0.6;
    let val = (prev * 0.35 + x * 0.45 + noise * 0.2) * envelope;
    val = Math.max(0.12, Math.min(0.96, val));
    prev = val;
    result.push(val);
  }

  return result;
}

export const AudioWaveformCanvas: React.FC<AudioWaveformCanvasProps> = ({
  soundId,
  soundType,
  duration = '04:22',
  isPlaying,
  theme = 'dark',
  height = 32,
  barWidth = 3,
  barGap = 2,
  leftLocatorRatio,
  rightLocatorRatio,
  onSeek,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [hoverTimeStr, setHoverTimeStr] = useState<string>('');

  const isLight = theme === 'light';

  // Generate deterministic base profile for this sound
  const baseProfile = useMemo(() => {
    return generateWaveformProfile(soundId, soundType, 80);
  }, [soundId, soundType]);

  // Main Canvas render & animation routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const displayWidth = Math.max(120, rect.width);
    const displayHeight = height;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const drawWaveform = (liveProgressRatio: number, liveAmps?: number[]) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Scaled bar dimensions for high-DPI
      const scaledBarWidth = Math.max(2, barWidth * dpr);
      const scaledBarGap = Math.max(1.5, barGap * dpr);
      const step = scaledBarWidth + scaledBarGap;
      const totalBars = Math.floor(w / step);

      if (totalBars <= 0) return;

      const centerY = h / 2;

      for (let i = 0; i < totalBars; i++) {
        const x = i * step;
        const barRatio = i / totalBars;

        // Base amplitude interpolated from sound profile
        const profileIdx = Math.floor((i / totalBars) * baseProfile.length);
        let amp = baseProfile[profileIdx % baseProfile.length] || 0.4;

        // Modulate with real-time Web Audio data if currently playing
        if (isPlaying && liveAmps && liveAmps.length > 0) {
          const liveIdx = i % liveAmps.length;
          const liveBoost = liveAmps[liveIdx] || 0;
          amp = Math.min(0.98, amp * 0.6 + liveBoost * 0.7);
        }

        const barHeight = Math.max(4 * dpr, amp * (h * 0.88));
        const topY = centerY - barHeight / 2;

        const isPlayed = barRatio <= liveProgressRatio;
        const isHovered = hoverRatio !== null && barRatio <= hoverRatio;

        // Color selection: Sidi Bou Saïd Blue to Terracotta to Ocre Gold
        if (isPlayed) {
          const gradient = ctx.createLinearGradient(0, topY, 0, topY + barHeight);
          gradient.addColorStop(0, '#00A6D6'); // Sidi Bou Saïd Blue
          gradient.addColorStop(0.5, '#D9532F'); // Terracotta
          gradient.addColorStop(1, '#C99738'); // Sand Gold
          ctx.fillStyle = gradient;

          if (isPlaying) {
            ctx.shadowColor = 'rgba(0, 166, 214, 0.4)';
            ctx.shadowBlur = 4 * dpr;
          } else {
            ctx.shadowBlur = 0;
          }
        } else if (isHovered) {
          ctx.fillStyle = isLight ? '#007A9E' : '#00A6D6';
          ctx.shadowBlur = 0;
        } else {
          // Unplayed / idle state
          ctx.fillStyle = isLight
            ? 'rgba(148, 163, 184, 0.55)'
            : 'rgba(100, 116, 139, 0.35)';
          ctx.shadowBlur = 0;
        }

        // Draw rounded rectangle bar
        const radius = Math.min(scaledBarWidth / 2, 2 * dpr);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, topY, scaledBarWidth, barHeight, radius);
        } else {
          ctx.rect(x, topY, scaledBarWidth, barHeight);
        }
        ctx.fill();
      }

      // Draw Left and Right Locators Trimming Overlay if provided
      if (leftLocatorRatio !== undefined || rightLocatorRatio !== undefined) {
        const lRatio = Math.max(0, Math.min(1, leftLocatorRatio ?? 0));
        const rRatio = Math.max(lRatio, Math.min(1, rightLocatorRatio ?? 1));
        const leftX = lRatio * w;
        const rightX = rRatio * w;

        // Dark dim overlay outside trim locators
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        if (leftX > 0) {
          ctx.fillRect(0, 0, leftX, h);
        }
        if (rightX < w) {
          ctx.fillRect(rightX, 0, w - rightX, h);
        }

        // Left locator boundary needle (Sidi Bou Saïd Blue)
        if (leftLocatorRatio !== undefined && leftLocatorRatio > 0) {
          ctx.fillStyle = '#00A6D6';
          ctx.fillRect(leftX - 1.5 * dpr, 0, 3 * dpr, h);
          // Top locator flag
          ctx.beginPath();
          ctx.moveTo(leftX, 0);
          ctx.lineTo(leftX + 8 * dpr, 0);
          ctx.lineTo(leftX, 8 * dpr);
          ctx.closePath();
          ctx.fillStyle = '#00A6D6';
          ctx.fill();
        }

        // Right locator boundary needle (Ocre Gold)
        if (rightLocatorRatio !== undefined && rightLocatorRatio < 1) {
          ctx.fillStyle = '#C99738';
          ctx.fillRect(rightX - 1.5 * dpr, 0, 3 * dpr, h);
          // Top locator flag
          ctx.beginPath();
          ctx.moveTo(rightX, 0);
          ctx.lineTo(rightX - 8 * dpr, 0);
          ctx.lineTo(rightX, 8 * dpr);
          ctx.closePath();
          ctx.fillStyle = '#C99738';
          ctx.fill();
        }
      }

      // Draw Playhead cursor needle if played
      if (liveProgressRatio > 0 && liveProgressRatio <= 1) {
        const cursorX = Math.min(w - 2, liveProgressRatio * w);
        ctx.shadowColor = '#00A6D6';
        ctx.shadowBlur = 6 * dpr;

        ctx.fillStyle = '#00A6D6';
        ctx.fillRect(cursorX - dpr, 0, 2 * dpr, h);

        // Glowing needle head dot
        ctx.beginPath();
        ctx.arc(cursorX, centerY, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#00A6D6';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }

      // Draw Hover Indicator if active
      if (hoverRatio !== null && hoverRatio > 0 && hoverRatio <= 1) {
        const hX = hoverRatio * w;
        ctx.shadowBlur = 0;
        ctx.fillStyle = isLight ? 'rgba(0, 122, 158, 0.6)' : 'rgba(0, 166, 214, 0.6)';
        ctx.fillRect(hX - 0.5 * dpr, 0, 1 * dpr, h);
      }
    };

    // Animation Loop
    const renderLoop = () => {
      let progress = 0;
      let amps: number[] | undefined;

      if (isPlaying) {
        progress = getPlaybackProgress().progressRatio;
        amps = getRealtimeWaveformData();
      }

      drawWaveform(progress, amps);

      if (isPlaying) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    isPlaying,
    baseProfile,
    hoverRatio,
    height,
    barWidth,
    barGap,
    isLight,
    leftLocatorRatio,
    rightLocatorRatio
  ]);

  // Handle seeking interaction
  const handleSeekInteraction = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = Math.max(0, Math.min(1, x / rect.width));

    seekPlayback(ratio);
    if (onSeek) {
      onSeek(ratio);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setHoverRatio(ratio);

    // Calculate hover timestamp
    const parts = duration.split(':').map(Number);
    const totalSecs = parts.length === 2 ? parts[0] * 60 + parts[1] : 240;
    const currentSecs = ratio * totalSecs;
    const m = Math.floor(currentSecs / 60);
    const s = Math.floor(currentSecs % 60);
    setHoverTimeStr(`${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`);
  };

  const handleMouseLeave = () => {
    setHoverRatio(null);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full cursor-pointer select-none group ${className}`}
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block rounded-lg"
        onClick={(e) => handleSeekInteraction(e.clientX)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Floating Hover Time Tooltip */}
      {hoverRatio !== null && hoverTimeStr && (
        <div 
          className="absolute -top-7 pointer-events-none px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#131822] text-[#00A6D6] border border-[#222B3D] shadow-md -translate-x-1/2 z-20"
          style={{ left: `${hoverRatio * 100}%` }}
        >
          {hoverTimeStr}
        </div>
      )}
    </div>
  );
};
