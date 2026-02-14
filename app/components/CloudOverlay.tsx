'use client';

import { useMemo } from 'react';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export interface CloudOverlayProps {
  url: string;
  opacity?: number;
  visible?: boolean;
}

const EARTH_RADIUS = 2;
const CLOUD_OFFSET = 0.03;

export default function CloudOverlay({
  url,
  opacity = 0.45,
  visible = true,
}: CloudOverlayProps) {
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
      args={[EARTH_RADIUS + CLOUD_OFFSET, 64, 64]}
      visible={visible}
      renderOrder={2}
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
