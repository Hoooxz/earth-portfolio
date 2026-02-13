'use client';

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useTexture, Html, Text } from '@react-three/drei';
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
  
  const touchState = useRef({
    initialDistance: 0,
    initialScale: 1,
    currentScale: 1,
    targetScale: 1,
    isPinching: false,
  });
  
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
    
    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        touchState.current.isPinching = true;
        touchState.current.initialDistance = getTouchDistance(e.touches);
        touchState.current.initialScale = touchState.current.currentScale;
        isDragging.current = false;
      } else if (e.touches.length === 1) {
        isDragging.current = true;
        previousMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        velocity.current = { x: 0, y: 0 };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchState.current.isPinching) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        if (touchState.current.initialDistance > 0) {
          const scaleFactor = currentDistance / touchState.current.initialDistance;
          const newScale = touchState.current.initialScale * scaleFactor;
          touchState.current.targetScale = Math.max(0.5, Math.min(3, newScale));
        }
      } else if (e.touches.length === 1 && isDragging.current && !touchState.current.isPinching && globeRef.current) {
        const deltaX = e.touches[0].clientX - previousMouse.current.x;
        const deltaY = e.touches[0].clientY - previousMouse.current.y;
        
        if (previousMouse.current.x !== 0) {
          const rotationX = deltaX * 0.005;
          const rotationY = deltaY * 0.005;
          
          globeRef.current.rotation.y += rotationX;
          globeRef.current.rotation.x += rotationY;
          
          velocity.current.x = rotationX;
          velocity.current.y = rotationY;
        }
        
        previousMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchState.current.isPinching = false;
        touchState.current.currentScale = touchState.current.targetScale;
      }
      if (e.touches.length === 0) {
        isDragging.current = false;
      } else if (e.touches.length === 1) {
        previousMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
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
      
      const targetScale = isHovered.current ? scale * touchState.current.targetScale * 1.05 : scale * touchState.current.targetScale;
      globeRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      );
      touchState.current.currentScale += (touchState.current.targetScale - touchState.current.currentScale) * 0.15;
      
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

  // Calculate pole positions for axis indicator
  const radius = 2 * scale;
  const poleTop = position[1] + radius + 3;
  const poleBottom = position[1] - radius - 0.5;

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
        <cylinderGeometry args={[0.12, 0.12, radius + poleBottom, 8]} />
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
        <cylinderGeometry args={[0.2, 0.2, radius + poleBottom, 8]} />
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
