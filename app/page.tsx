'use client';

import { useState, useEffect } from 'react';
import Scene from './components/Scene';

export default function Home() {
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
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Scene />
    </main>
  );
}
