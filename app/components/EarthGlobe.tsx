'use client';

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

interface EarthGlobeProps {
  position?: [number, number, number];
  scale?: number;
}

function cartesianToLatLng(x: number, y: number, z: number): { lat: number; lng: number } {
  const r = Math.sqrt(x * x + y * y + z * z);
  const lat = Math.asin(z / r) * (180 / Math.PI);
  const lng = Math.atan2(y, x) * (180 / Math.PI);
  return { lat, lng };
}

export default function EarthGlobe({ position = [3, 0, 0], scale = 1 }: EarthGlobeProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const isHovered = useRef(false);
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastFrameTime = useRef(0);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const screenCenter = useMemo(() => new THREE.Vector2(0, 0), []);

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

  useEffect(() => {
    const handlePointerUp = () => {
      isDragging.current = false;
    };
    
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  useFrame(() => {
    const now = performance.now();
    const delta = Math.min((now - lastFrameTime.current) / 1000, 0.1);
    lastFrameTime.current = now;

    if (globeRef.current) {
      if (!isDragging.current) {
        velocity.current.x *= 0.95;
        velocity.current.y *= 0.95;
        
        if (Math.abs(velocity.current.x) > 0.0001 || Math.abs(velocity.current.y) > 0.0001) {
          globeRef.current.rotation.y += velocity.current.x;
          globeRef.current.rotation.x += velocity.current.y;
        } else {
          globeRef.current.rotation.y += delta * 0.1;
        }
      }
      
      const targetScale = isHovered.current ? scale * 1.05 : scale;
      globeRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
      
      raycaster.setFromCamera(screenCenter, camera);
      const intersects = raycaster.intersectObject(globeRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const localPoint = globeRef.current.worldToLocal(point.clone());
        const { lat, lng } = cartesianToLatLng(localPoint.x, localPoint.y, localPoint.z);
        setCoordinates({ lat, lng });
      }
    }
    
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.05;
    }
  });

  const handlePointerDown = useCallback((e: { clientX: number; clientY: number; stopPropagation?: () => void }) => {
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    e.stopPropagation?.();
  }, []);

  const handlePointerMove = useCallback((e: { clientX: number; clientY: number }) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    if (isDragging.current && globeRef.current) {
      const deltaX = clientX - previousMouse.current.x;
      const deltaY = clientY - previousMouse.current.y;
      
      if (previousMouse.current.x !== 0) {
        const rotationX = deltaX * 0.005;
        const rotationY = deltaY * 0.005;
        
        globeRef.current.rotation.y += rotationX;
        globeRef.current.rotation.x += rotationY;
        
        velocity.current.x = rotationX;
        velocity.current.y = rotationY;
      }
      
      previousMouse.current = { x: clientX, y: clientY };
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
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
        <Html
          position={[0, 0, 0]}
          center
          style={{
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              color: '#00d4ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              background: 'rgba(10, 14, 39, 0.8)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ opacity: 0.7, fontSize: '10px', marginBottom: '4px' }}>LATITUDE</div>
            <div style={{ fontWeight: 600 }}>{coordinates.lat.toFixed(4)}°</div>
            <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '8px', marginBottom: '4px' }}>LONGITUDE</div>
            <div style={{ fontWeight: 600 }}>{coordinates.lng.toFixed(4)}°</div>
          </div>
        </Html>
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
