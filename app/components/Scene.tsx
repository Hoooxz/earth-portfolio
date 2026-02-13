'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import EarthGlobe from './EarthGlobe';
import ParticleBackground from './ParticleBackground';
import Text3D from './Text3D';

function NorthPoleIndicator({ position, scale }: { position: [number, number, number]; scale: number }) {
  const radius = 2 * scale;
  const polePosition: [number, number, number] = [position[0], position[1] + radius, position[2]];
  
  return (
    <group>
      <Line
        points={[
          [position[0], position[1], position[2]],
          [polePosition[0], polePosition[1] + 0.3, polePosition[2]]
        ]}
        color="#00d4ff"
        lineWidth={2}
        transparent
        opacity={0.6}
      />
      <mesh position={polePosition}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>
      <Text
        position={[polePosition[0] + 0.25, polePosition[1], polePosition[2]]}
        fontSize={0.2}
        color="#00d4ff"
        anchorX="left"
        anchorY="middle"
      >
        N
      </Text>
    </group>
  );
}

export default function Scene() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          <ambientLight intensity={0.2} />
          
          <ParticleBackground count={isMobile ? 1500 : 3000} spread={isMobile ? 40 : 60} />
          
          <EarthGlobe 
            position={isMobile ? [0, -0.8, 0] : [3.5, 0, 0]} 
            scale={isMobile ? 1.3 : 0.9} 
          />
          
          <NorthPoleIndicator 
            position={isMobile ? [0, -0.8, 0] : [3.5, 0, 0]} 
            scale={isMobile ? 1.3 : 0.9} 
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
    </div>
  );
}
