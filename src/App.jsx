import { useEffect, useRef, useState } from 'react';
import './App.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import ScrollScene from './ScrollScene';
import LoadingScreen from './LoadingScreen';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const containerRef = useRef(null);
  const scrollProgress = useRef(0);

  // Loading states
  const [progress, setProgress] = useState(0);
  const [glReady, setGlReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);

  // Smooth progress over 21s — ensures user sees all 3 loading animations
  useEffect(() => {
    let raf;
    const start = performance.now();
    const dur = 21000;
    const tick = () => {
      const t = Math.min((performance.now() - start) / dur, 1);
      setProgress(t * (2 - t) * 100); // ease-out quad
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Trigger exit animation when progress done + WebGL ready
  useEffect(() => {
    if (progress < 100 || !glReady) return;
    const t1 = setTimeout(() => setExiting(true), 400);
    const t2 = setTimeout(() => setEntered(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [progress, glReady]);

  // Block scrolling while loading
  useEffect(() => {
    document.body.style.overflow = entered ? '' : 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [entered]);

  // ScrollTrigger → drives WebGL scroll animation
  useEffect(() => {
    if (!entered) return;
    const st = ScrollTrigger.create({
      trigger: '.content-scroll',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { scrollProgress.current = self.progress; }
    });
    return () => st.kill();
  }, [entered]);

  return (
    <div className="app-container" ref={containerRef}>
      {!entered && <LoadingScreen progress={progress} exiting={exiting} />}

      {/* WebGL Scroll Background */}
      <div className="scroll-canvas-wrap">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={() => setGlReady(true)}
          style={{ background: 'transparent' }}
        >
          <ScrollScene scrollProgress={scrollProgress} />
        </Canvas>
      </div>

      {/* Content wrapper for scrolling */}
      <div className="content-scroll">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="cursive-title">Loofix</h1>
            <p className="brand-quote">"Illuminating your vision with cutting-edge LED modular displays."</p>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel">
            <h2>Next-Gen LED Walls</h2>
            <p>Experience ultra-high-definition modular LED walls, designed to deliver stunning visual clarity and seamless integration for any environment. Perfect for exhibitions, corporate events, and virtual production.</p>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel align-right">
            <h2>Premium Billboards</h2>
            <p>Our robust and dynamic outdoor and indoor LED billboards ensure maximum visibility and reliability. Stand out from the crowd with vibrant colors and unmatched brightness, day or night.</p>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel">
            <h2>Rental & Sales</h2>
            <p>Whether you need a permanent installation or a temporary rental, Loofix provides flexible and scalable LED solutions tailored to your unique requirements. We manage everything from setup to operation.</p>
          </div>
        </section>
      </div>

      {/* Enquiry Section */}
      <section className="enquiry-section">
        <div className="skeuo-panel center-panel">
          <h2 className="engraved-text">Ready to Elevate Your Display?</h2>
          <p className="inset-text">Contact us today and let's bring your vision to life.</p>
          <a
            href="https://wa.me/919400374426?text=hi%20iam%20intrest%20about%20knowing%20the%20product"
            className="skeuo-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Enquire Now
          </a>
        </div>
      </section>
    </div>
  );
}

export default App;
