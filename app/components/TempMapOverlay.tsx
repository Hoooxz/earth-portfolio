'use client';

import { useMemo } from 'react';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export interface TempMapOverlayProps {
  url: string;
  opacity?: number;
  visible?: boolean;
}

const EARTH_RADIUS = 2;
const TEMP_OFFSET = 0.02;

// Temperature to color mapping (blue -> green -> yellow -> red)
const TEMP_COLORS = [
  { temp: -40, color: new THREE.Color('#0066ff') }, // Deep blue (extreme cold)
  { temp: -20, color: new THREE.Color('#00ccff') }, // Light blue (very cold)
  { temp: 0, color: new THREE.Color('#00ffcc') },   // Cyan (freezing)
  { temp: 10, color: new THREE.Color('#66ff00') },  // Green (cool)
  { temp: 20, color: new THREE.Color('#ffff00') },  // Yellow (mild)
  { temp: 30, color: new THREE.Color('#ff9900') },  // Orange (warm)
  { temp: 40, color: new THREE.Color('#ff3300') },  // Red (hot)
  { temp: 50, color: new THREE.Color('#990000') },  // Dark red (extreme heat)
];

export default function TempMapOverlay({
  url,
  opacity = 0.6,
  visible = true,
}: TempMapOverlayProps) {
  const texture = useTexture(url);

  const configuredTexture = useMemo(() => {
    const t = texture.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
    return t;
  }, [texture]);

  const normalizedOpacity = useMemo(() => {
    return Math.min(1, Math.max(0, opacity));
  }, [opacity]);

  if (!url) {
    return null;
  }

  return (
    <Sphere
      args={[EARTH_RADIUS + TEMP_OFFSET, 64, 64]}
      visible={visible}
      renderOrder={3}
    >
      <meshPhongMaterial
        map={configuredTexture}
        transparent
        opacity={normalizedOpacity}
        depthWrite={false}
        blending={THREE.NormalBlending}
        side={THREE.FrontSide}
      />
    </Sphere>
  );
}

// Utility function to get color for a specific temperature
export function getTemperatureColor(tempCelsius: number): THREE.Color {
  // Find the two colors to interpolate between
  let lower = TEMP_COLORS[0];
  let upper = TEMP_COLORS[TEMP_COLORS.length - 1];

  for (let i = 0; i < TEMP_COLORS.length - 1; i++) {
    if (tempCelsius >= TEMP_COLORS[i].temp && tempCelsius <= TEMP_COLORS[i + 1].temp) {
      lower = TEMP_COLORS[i];
      upper = TEMP_COLORS[i + 1];
      break;
    }
  }

  // Calculate interpolation factor
  const range = upper.temp - lower.temp;
  const factor = range === 0 ? 0 : (tempCelsius - lower.temp) / range;

  // Interpolate color
  return lower.color.clone().lerp(upper.color, factor);
}

// Temperature legend data for UI
export const TEMPERATURE_LEGEND = [
  { label: 'Extreme Cold (< -40°C)', color: '#0066ff' },
  { label: 'Very Cold (-40 to -20°C)', color: '#00ccff' },
  { label: 'Freezing (-20 to 0°C)', color: '#00ffcc' },
  { label: 'Cool (0 to 10°C)', color: '#66ff00' },
  { label: 'Mild (10 to 20°C)', color: '#ffff00' },
  { label: 'Warm (20 to 30°C)', color: '#ff9900' },
  { label: 'Hot (30 to 40°C)', color: '#ff3300' },
  { label: 'Extreme Heat (> 40°C)', color: '#990000' },
];
