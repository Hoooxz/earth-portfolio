'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import EarthGlobe from './EarthGlobe';
import ParticleBackground from './ParticleBackground';
import Text3D from './Text3D';

export default function Scene() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0a0e27']} />
        <fog attach="fog" args={['#0a0e27', 10, 30]} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          
          <ParticleBackground count={3000} spread={60} />
          
          <EarthGlobe position={[3.5, 0, 0]} scale={0.9} />
          
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
        </Suspense>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
