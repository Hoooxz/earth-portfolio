'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import EarthGlobe from './EarthGlobe';
import ParticleBackground from './ParticleBackground';
import Text3D from './Text3D';
import TimeController from './TimeController';

function NorthPoleIndicator({ position, scale }: { position: [number, number, number]; scale: number }) {
  const radius = 2 * scale;
  const poleTop = position[1] + radius + 3;
  const poleBottom = position[1] - radius - 0.5;

  return (
    <group>
      <mesh position={[position[0], (position[1] + radius + poleTop) / 2, position[2]]}>
        <cylinderGeometry args={[0.15, 0.15, poleTop - position[1] - radius, 8]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={5}
          transparent
          opacity={0.9}
        />
      </mesh>

      <mesh position={[position[0], (position[1] + radius + poleTop) / 2, position[2]]}>
        <cylinderGeometry args={[0.25, 0.25, poleTop - position[1] - radius, 8]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={3}
          transparent
          opacity={0.3}
        />
      </mesh>

      <mesh position={[position[0], (position[1] - radius + poleBottom) / 2, position[2]]}>
        <cylinderGeometry args={[0.12, 0.12, position[1] - radius - poleBottom, 8]} />
        <meshStandardMaterial
          color="#ff6b6b"
          emissive="#ff6b6b"
          emissiveIntensity={4}
          transparent
          opacity={0.8}
        />
      </mesh>

      <mesh position={[position[0], (position[1] - radius + poleBottom) / 2, position[2]]}>
        <cylinderGeometry args={[0.2, 0.2, position[1] - radius - poleBottom, 8]} />
        <meshStandardMaterial
          color="#ff6b6b"
          emissive="#ff6b6b"
          emissiveIntensity={2.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      <mesh position={[position[0], poleTop, position[2]]}>
        <coneGeometry args={[0.12, 0.25, 8]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={6}
        />
      </mesh>

      <mesh position={[position[0], poleBottom, position[2]]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial
          color="#ff6b6b"
          emissive="#ff6b6b"
          emissiveIntensity={5}
        />
      </mesh>

      <pointLight position={[position[0], poleTop + 0.3, position[2]]} color="#00d4ff" intensity={2.0} distance={3} />
      <pointLight position={[position[0], poleTop + 0.5, position[2]]} color="#00d4ff" intensity={1.5} distance={4} />
      <pointLight position={[position[0], poleBottom - 0.3, position[2]]} color="#ff6b6b" intensity={2.0} distance={2} />
      <pointLight position={[position[0], poleBottom - 0.5, position[2]]} color="#ff6b6b" intensity={1.5} distance={3} />

      <Text
        position={[position[0] + 0.35, poleTop, position[2]]}
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
        position={[position[0] + 0.35, poleBottom, position[2]]}
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

export default function Scene() {
  const [isMobile, setIsMobile] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Time animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTime(prev => new Date(prev.getTime() + 60000 * speed));
    }, 16);
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleSpeedChange = (newSpeed: number) => setSpeed(newSpeed);
  const handleTimeChange = (newTime: Date) => {
    setTime(newTime);
    if (isPlaying) setIsPlaying(false);
  };

  return (
    <div className="canvas-container" style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, isMobile ? 10 : 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <color attach="background" args={['#0a0e27']} />
        <fog attach="fog" args={['#0a0e27', 10, 30]} />

        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />

          <ParticleBackground count={isMobile ? 1500 : 3000} spread={isMobile ? 40 : 60} />
          
          <EarthGlobe 
            position={isMobile ? [0, -0.8, 0] : [3.5, 0, 0]} 
            scale={isMobile ? 1.3 : 0.9}
            time={time}
          />

          {!isMobile && (
            <>
              <Text3D
                text="CREATIVE"
                position={[-4, 1.5, 0]}
                fontSize={0.6}
                color="#00d4ff"
              />
              <Text3D
                text="DEVELOPER"
                position={[-4, 0.5, 0]}
                fontSize={0.6}
                color="#ffffff"
              />
            </>
          )}
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>
      
      <TimeController
        time={time}
        isPlaying={isPlaying}
        speed={speed}
        onTimeChange={handleTimeChange}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
      />
    </div>
  );
}
