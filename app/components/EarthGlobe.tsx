'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface EarthGlobeProps {
  position?: [number, number, number];
  scale?: number;
}

export default function EarthGlobe({ position = [3, 0, 0], scale = 1 }: EarthGlobeProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const isHovered = useRef(false);
  const isDragging = useRef(false);
  useThree();
  const previousMouse = useRef({ x: 0, y: 0 });

  const textures = useMemo(() => {
    return {
      map: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
      bump: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
      specular: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png',
    };
  }, []);

  const [mapTexture, bumpTexture, specularTexture] = useTexture([
    textures.map,
    textures.bump,
    textures.specular,
  ]);

  useFrame((state, delta) => {
    if (globeRef.current) {
      if (!isDragging.current) {
        globeRef.current.rotation.y += delta * 0.1;
      }
      const targetScale = isHovered.current ? scale * 1.05 : scale;
      globeRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.05;
    }
  });

  const handlePointerDown = useCallback(() => {
    isDragging.current = true;
    previousMouse.current = { x: 0, y: 0 };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handlePointerMove = useCallback((e: { clientX?: number; clientY?: number }) => {
    if (isDragging.current && globeRef.current) {
      const deltaX = (e.clientX ?? 0) - previousMouse.current.x;
      const deltaY = (e.clientY ?? 0) - previousMouse.current.y;
      if (previousMouse.current.x !== 0) {
        globeRef.current.rotation.y += deltaX * 0.005;
        globeRef.current.rotation.x += deltaY * 0.005;
      }
      previousMouse.current = { x: e.clientX ?? 0, y: e.clientY ?? 0 };
    }
  }, []);

  return (
    <group position={position}>
      <Sphere
        ref={globeRef}
        args={[2 * scale, 64, 64]}
        onPointerOver={() => { isHovered.current = true; }}
        onPointerOut={() => { isHovered.current = false; }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
      >
        <meshPhongMaterial
          map={mapTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          specularMap={specularTexture}
          specular={new THREE.Color('#333333')}
          shininess={15}
        />
      </Sphere>
      
      <Sphere ref={atmosphereRef} args={[2.2 * scale, 64, 64]}>
        <meshPhongMaterial
          color="#00d4ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>
      
      <Sphere args={[2.4 * scale, 32, 32]}>
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </Sphere>

      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#00d4ff" />
    </group>
  );
}
