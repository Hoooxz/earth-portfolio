import Scene from './components/Scene';
import Navigation from './components/Navigation';

export default function Home() {
  return (
    <main>
      <Scene />
      <Navigation />
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
      <div className="hint">Drag the globe to rotate</div>
    </main>
  );
}
