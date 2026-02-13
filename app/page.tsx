'use client';

import { useState, useEffect } from 'react';
import Scene from './components/Scene';
import Navigation from './components/Navigation';

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
    <main className={isMobile ? 'mobile-layout' : ''}>
      <Navigation />
      <div className="content-section">
        <div className="content">
          <h1 className="content-title">
            <span>Creative</span> Developer
          </h1>
          <p className="content-subtitle">Building immersive digital experiences</p>
          <div className="content-cta">
            <a href="#projects" className="cta-button cta-primary">
              View Work
            </a>
            <a href="#contact" className="cta-button cta-secondary">
              Contact Me
            </a>
          </div>
        </div>
      </div>
      <div className="scene-section">
        <Scene />
      </div>
      {!isMobile && <div className="hint">Drag the globe to rotate</div>}
    </main>
  );
}
