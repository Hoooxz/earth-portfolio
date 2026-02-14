'use client';

import React, { useMemo } from 'react';

interface TimeControllerProps {
  time: Date;
  isPlaying: boolean;
  speed: number;
  onTimeChange: (time: Date) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
}

function getSeason(dayOfYear: number): string {
  if (dayOfYear >= 80 && dayOfYear <= 172) return 'Spring';
  if (dayOfYear >= 173 && dayOfYear <= 264) return 'Summer';
  if (dayOfYear >= 265 && dayOfYear <= 354) return 'Fall';
  return 'Winter';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export default function TimeController({
  time,
  isPlaying,
  speed,
  onTimeChange,
  onPlayPause,
  onSpeedChange
}: TimeControllerProps) {
  const dayOfYear = useMemo(() => {
    const start = new Date(time.getFullYear(), 0, 0);
    const diff = time.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [time]);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const totalHours = hours + minutes / 60;

  const season = getSeason(dayOfYear);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDayOfYear = parseInt(e.target.value, 10);
    const currentYear = time.getFullYear();
    const newDate = new Date(currentYear, 0, newDayOfYear);
    newDate.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
    onTimeChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hourValue = parseFloat(e.target.value);
    const newHours = Math.floor(hourValue);
    const newMinutes = Math.floor((hourValue - newHours) * 60);
    const newDate = new Date(time);
    newDate.setHours(newHours, newMinutes, 0);
    onTimeChange(newDate);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(20px + env(safe-area-inset-top, 0px))',
        right: 'calc(20px + env(safe-area-inset-right, 0px))',
        background: 'rgba(10, 14, 39, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '16px',
        padding: '16px',
        width: 'min(90vw, 280px)',
        color: '#fff',
        fontFamily: 'JetBrains Mono, monospace',
        zIndex: 1000,
        boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)'
      }}
    >
      {/* Date and Season Display */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(0, 212, 255, 0.2)'
        }}
      >
        <div>
          <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>DATE</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#00d4ff' }}>
            {formatDate(time)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>SEASON</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#00d4ff' }}>{season}</div>
        </div>
      </div>

      {/* Time Display */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#00d4ff', textShadow: '0 0 15px rgba(0, 212, 255, 0.5)' }}>
          {formatTime(time)}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>
            <span>DAY</span>
            <span>{dayOfYear}/365</span>
          </div>
          <input
            type="range"
            min={1}
            max={365}
            value={dayOfYear}
            onChange={handleDayChange}
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(0, 212, 255, 0.2)',
              borderRadius: '3px',
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none'
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>
            <span>HOUR</span>
            <span>{Math.floor(totalHours)}:{String(Math.round((totalHours % 1) * 60)).padStart(2, '0')}</span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            step={0.1}
            value={totalHours}
            onChange={handleTimeChange}
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(0, 212, 255, 0.2)',
              borderRadius: '3px',
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none'
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          style={{
            flex: 1,
            background: isPlaying ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0, 212, 255, 0.2)',
            border: `1px solid ${isPlaying ? '#ff6b6b' : '#00d4ff'}`,
            borderRadius: '6px',
            padding: '6px 8px',
            color: isPlaying ? '#ff6b6b' : '#00d4ff',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        {/* Speed Controls */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1, 10, 100].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                background: speed === s ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${speed === s ? '#00d4ff' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '4px',
                padding: '4px 6px',
                color: speed === s ? '#00d4ff' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
