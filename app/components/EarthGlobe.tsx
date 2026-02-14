'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, Html, Text } from '@react-three/drei';
import * as THREE from 'three';

interface EarthGlobeProps {
  position?: [number, number, number];
  scale?: number;
  time?: Date;
}

function cartesianToLatLng(x: number, y: number, z: number): { lat: number; lng: number } {
  const r = Math.sqrt(x * x + y * y + z * z);
  const lat = Math.asin(y / r) * (180 / Math.PI);
  const lng = Math.atan2(z, x) * (180 / Math.PI);
  return { lat, lng };
}

export default function EarthGlobe({ position = [3, 0, 0], scale = 1, time: _time }: EarthGlobeProps) {
  void _time;
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const latitudeRef = useRef<HTMLDivElement>(null);
  const longitudeRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastFrameTime = useRef(0);
  const lastPointerHitPoint = useRef<THREE.Vector3 | null>(null);
  const activeTouchPointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  
  const touchState = useRef({
    initialDistance: 0,
    initialScale: 1,
    currentScale: 1,
    targetScale: 1,
    isPinching: false,
  });
  
  const textures = useMemo(() => {
    return {
      map: '/textures/earth-blue-marble.svg',
      bump: '/textures/earth-topology.svg',
      specular: '/textures/earth-water.svg',
    };
  }, []);

  const [mapTexture, bumpTexture, specularTexture] = useTexture([
    textures.map,
    textures.bump,
    textures.specular,
  ]);

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
      
      const targetScale = isHovered.current ? scale * touchState.current.targetScale * 1.05 : scale * touchState.current.targetScale;
      globeRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      );
      touchState.current.currentScale += (touchState.current.targetScale - touchState.current.currentScale) * 0.15;
      
      if (lastPointerHitPoint.current) {
        const localPoint = globeRef.current.worldToLocal(lastPointerHitPoint.current.clone());
        const { lat, lng } = cartesianToLatLng(localPoint.x, localPoint.y, localPoint.z);
        const latText = `${lat.toFixed(4)}°`;
        const lngText = `${lng.toFixed(4)}°`;
        if (latitudeRef.current && latitudeRef.current.textContent !== latText) {
          latitudeRef.current.textContent = latText;
        }
        if (longitudeRef.current && longitudeRef.current.textContent !== lngText) {
          longitudeRef.current.textContent = lngText;
        }
      }
    }
    
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.05;
    }
  });

  const getPointerDistance = useCallback(() => {
    const pointers = Array.from(activeTouchPointers.current.values());
    if (pointers.length < 2) return 0;
    const dx = pointers[0].x - pointers[1].x;
    const dy = pointers[0].y - pointers[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const updatePointerCoordinates = useCallback((point?: THREE.Vector3) => {
    if (!point) return;
    lastPointerHitPoint.current = point.clone();
  }, []);

  const handlePointerDown = useCallback((e: { clientX: number; clientY: number; pointerType?: string; pointerId?: number; stopPropagation?: () => void; target?: EventTarget | null; point?: THREE.Vector3 }) => {
    updatePointerCoordinates(e.point);
    if (e.pointerType === 'touch' && typeof e.pointerId === 'number') {
      activeTouchPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activeTouchPointers.current.size === 2) {
        touchState.current.isPinching = true;
        touchState.current.initialDistance = getPointerDistance();
        touchState.current.initialScale = touchState.current.currentScale;
        isDragging.current = false;
      } else if (activeTouchPointers.current.size === 1) {
        isDragging.current = true;
        previousMouse.current = { x: e.clientX, y: e.clientY };
        velocity.current = { x: 0, y: 0 };
      }
    } else {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: 0, y: 0 };
    }

    const target = e.target as { setPointerCapture?: (pointerId: number) => void } | null;
    if (target && typeof e.pointerId === 'number') {
      target.setPointerCapture?.(e.pointerId);
    }
    e.stopPropagation?.();
  }, [getPointerDistance, updatePointerCoordinates]);

  const handlePointerMove = useCallback((e: { clientX: number; clientY: number; pointerType?: string; pointerId?: number; point?: THREE.Vector3 }) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    updatePointerCoordinates(e.point);

    if (e.pointerType === 'touch' && typeof e.pointerId === 'number') {
      activeTouchPointers.current.set(e.pointerId, { x: clientX, y: clientY });
      if (touchState.current.isPinching && activeTouchPointers.current.size >= 2) {
        const currentDistance = getPointerDistance();
        if (touchState.current.initialDistance > 0) {
          const scaleFactor = currentDistance / touchState.current.initialDistance;
          const newScale = touchState.current.initialScale * scaleFactor;
          touchState.current.targetScale = Math.max(0.5, Math.min(3, newScale));
        }
        return;
      }
    }

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
  }, [getPointerDistance, updatePointerCoordinates]);

  const handlePointerUp = useCallback((e?: { pointerType?: string; pointerId?: number; target?: EventTarget | null }) => {
    if (e?.pointerType === 'touch' && typeof e.pointerId === 'number') {
      activeTouchPointers.current.delete(e.pointerId);
      if (activeTouchPointers.current.size < 2) {
        touchState.current.isPinching = false;
        touchState.current.currentScale = touchState.current.targetScale;
      }
      if (activeTouchPointers.current.size === 0) {
        isDragging.current = false;
      } else if (activeTouchPointers.current.size === 1) {
        const [pointer] = activeTouchPointers.current.values();
        previousMouse.current = { x: pointer.x, y: pointer.y };
      }
    } else {
      isDragging.current = false;
    }

    const target = e?.target as { releasePointerCapture?: (pointerId: number) => void } | undefined;
    if (target && typeof e?.pointerId === 'number') {
      target.releasePointerCapture?.(e.pointerId);
    }
  }, []);

  return (
    <group position={position}>
      <group ref={globeRef}>
        <Sphere
          args={[2 * scale, 64, 64]}
          onPointerOver={() => { isHovered.current = true; }}
          onPointerOut={() => { isHovered.current = false; }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
        <meshPhongMaterial
          map={mapTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          specularMap={specularTexture}
          specular={new THREE.Color('#666666')}
          shininess={30}
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
            <div ref={latitudeRef} style={{ fontWeight: 600 }}>0.0000°</div>
            <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '8px', marginBottom: '4px' }}>LONGITUDE</div>
            <div ref={longitudeRef} style={{ fontWeight: 600 }}>0.0000°</div>
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

      <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00d4ff" />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
      
      {/* Axis indicator - as child of rotating group so it rotates with Earth */}
      <AxisIndicator scale={scale} />
    </group>
    </group>
  );
}

// Axis indicator component that rotates with the Earth
function AxisIndicator({ scale }: { scale: number }) {
  const radius = 2 * scale;
  const poleTop = radius + 3;
  const poleBottom = -radius - 0.5;
  
  return (
    <group>
      {/* North pole line */}
      <mesh position={[0, (radius + poleTop) / 2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, poleTop - radius, 8]} />
        <meshStandardMaterial 
          color="#00d4ff" 
          emissive="#00d4ff"
          emissiveIntensity={5}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* North pole outer glow */}
      <mesh position={[0, (radius + poleTop) / 2, 0]}>
        <cylinderGeometry args={[0.25, 0.25, poleTop - radius, 8]} />
        <meshStandardMaterial 
          color="#00d4ff" 
          emissive="#00d4ff"
          emissiveIntensity={3}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* South pole line */}
      <mesh position={[0, (-radius + poleBottom) / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, Math.abs(radius + poleBottom), 8]} />
        <meshStandardMaterial 
          color="#ff6b6b" 
          emissive="#ff6b6b"
          emissiveIntensity={4}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* South pole outer glow */}
      <mesh position={[0, (-radius + poleBottom) / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, Math.abs(radius + poleBottom), 8]} />
        <meshStandardMaterial 
          color="#ff6b6b" 
          emissive="#ff6b6b"
          emissiveIntensity={2.5}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* North cone */}
      <mesh position={[0, poleTop, 0]}>
        <coneGeometry args={[0.12, 0.25, 8]} />
        <meshStandardMaterial 
          color="#00d4ff" 
          emissive="#00d4ff"
          emissiveIntensity={6}
        />
      </mesh>
      
      {/* South cone */}
      <mesh position={[0, poleBottom, 0]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial 
          color="#ff6b6b" 
          emissive="#ff6b6b"
          emissiveIntensity={5}
        />
      </mesh>
      
      {/* Point lights */}
      <pointLight position={[0, poleTop + 0.3, 0]} color="#00d4ff" intensity={2} distance={3} />
      <pointLight position={[0, poleTop + 0.5, 0]} color="#00d4ff" intensity={1.5} distance={4} />
      <pointLight position={[0, poleBottom - 0.3, 0]} color="#ff6b6b" intensity={2} distance={2} />
      <pointLight position={[0, poleBottom - 0.5, 0]} color="#ff6b6b" intensity={1.5} distance={3} />
      
      {/* Labels */}
      <Text
        position={[0.35, poleTop, 0]}
        fontSize={0.25}
        color="#00d4ff"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#003344"
      >
        N
      </Text>
      
      <Text
        position={[0.35, poleBottom, 0]}
        fontSize={0.25}
        color="#ff6b6b"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#441111"
      >
        S
      </Text>
    </group>
  );
}
