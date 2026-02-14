'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import EarthGlobe from './EarthGlobe';
import ParticleBackground from './ParticleBackground';
import Text3D from './Text3D';
import TimeController from './TimeController';
import LayerControlPanel from './LayerControlPanel';
import { useWeatherData } from '@/app/hooks/useWeatherData';

interface LayerState {
  id: string;
  label: string;
  visible: boolean;
  opacity: number;
  url: string;
}

export default function Scene() {
  const [isMobile, setIsMobile] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  
  // Weather data hook
  const { 
    current: weatherData, 
    loading: weatherLoading, 
    error: weatherError,
    refresh: refreshWeather,
    getCloudTileUrl,
    getTempTileUrl 
  } = useWeatherData({
    refreshInterval: 10 * 60 * 1000, // 10 minutes
  });

  // Layer states
  const [layers, setLayers] = useState<LayerState[]>([
    {
      id: 'clouds',
      label: '☁️ 云层覆盖',
      visible: false,
      opacity: 0.6,
      url: '',
    },
    {
      id: 'temp',
      label: '🌡️ 温度热力图',
      visible: false,
      opacity: 0.5,
      url: '',
    },
  ]);

  // Update layer URLs when weather data changes
  useEffect(() => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === 'clouds') {
        return { ...layer, url: getCloudTileUrl(1, 0, 0) };
      }
      if (layer.id === 'temp') {
        return { ...layer, url: getTempTileUrl(1, 0, 0) };
      }
      return layer;
    }));
  }, [getCloudTileUrl, getTempTileUrl, weatherData]);

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

  // Layer control handlers
  const handleToggleLayer = (id: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handleOpacityChange = (id: string, opacity: number) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, opacity } : layer
      )
    );
  };

  const activeLayers = {
    clouds: layers.find(l => l.id === 'clouds'),
    temp: layers.find(l => l.id === 'temp'),
  };

  return (
    <div className="canvas-container" style={{ touchAction: 'none', position: 'relative' }}>
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
            layers={activeLayers}
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

      <LayerControlPanel
        layers={layers}
        onToggleLayer={handleToggleLayer}
        onOpacityChange={handleOpacityChange}
        onRefresh={refreshWeather}
        loading={weatherLoading}
      />
    </div>
  );
}
