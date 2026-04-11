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
  const mousePos = useRef({ x: 0, y: 0 });

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

  // Track mouse at window level (Canvas can't see mouse through content overlay)
  useEffect(() => {
    const onMove = (e) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Block scrolling while loading
  useEffect(() => {
    document.body.style.overflow = entered ? '' : 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [entered]);

  // ScrollTrigger for panels entrance
  useEffect(() => {
    if (!entered) return;

    const panels = gsap.utils.toArray('.glass-panel');
    panels.forEach((panel) => {
      gsap.fromTo(panel,
        {
          opacity: 0,
          y: 100,
          rotateX: -15,
          filter: 'blur(10px)'
        },
        {
          scrollTrigger: {
            trigger: panel,
            start: 'top 85%',
            end: 'top 50%',
            scrub: 1,
          },
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 1
        }
      );
    });

    const st = ScrollTrigger.create({
      trigger: '.content-scroll',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { scrollProgress.current = self.progress; }
    });
    return () => {
      st.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
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
          <ScrollScene scrollProgress={scrollProgress} mousePos={mousePos} />
        </Canvas>
      </div>

      {/* Content wrapper for scrolling */}
      <div className="content-scroll">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="cursive-title">Loofix</h1>
            <p className="brand-quote">"Sourcing the world's most immersive LED modular displays for your vision."</p>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel">
            <div className="panel-tag">Curated Selection</div>
            <h2>Modular LED Walls</h2>
            <p>We source ultra-high-definition modular LED walls, handpicked for seamless integration and breathtaking visual impact from top global manufacturers.</p>
            <ul className="spec-list">
              <li><span>Pixel Pitch</span> 1.9mm - 3.9mm</li>
              <li><span>Refresh Rate</span> 3840Hz (Flicker-free)</li>
              <li><span>Service</span> Full Front & Rear Access</li>
              <li><span>Structure</span> Die-cast Aluminum Frames</li>
            </ul>
            <div className="panel-footer">
              <span className="availability">Premium Solutions for Rental & Sales</span>
            </div>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel align-right">
            <div className="panel-tag">Quality Sourcing</div>
            <h2>Global Billboard Solutions</h2>
            <p>Expertly selected outdoor and indoor LED billboards. We find the most robust hardware to ensure maximum visibility, thriving under direct sunlight and harsh weather.</p>
            <div className="spec-grid">
              <div className="spec-item">
                <div className="spec-val">6000+</div>
                <div className="spec-label">Nits Brightness</div>
              </div>
              <div className="spec-item">
                <div className="spec-val">IP65</div>
                <div className="spec-label">Weatherproof</div>
              </div>
              <div className="spec-item">
                <div className="spec-val">Smart</div>
                <div className="spec-label">Cloud Control</div>
              </div>
            </div>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel">
            <div className="panel-tag">Reliable Partner</div>
            <h2>Your Trusted LED Dealer</h2>
            <div className="features-container">
              <div className="feature">
                <h3>Vibrant Color Calibration</h3>
                <p>We ensure every display we supply meets industry-leading color accuracy standards.</p>
              </div>
              <div className="feature">
                <h3>Lightweight Design</h3>
                <p>Sourcing carbon fiber frame technology for rapid deployment and maximum safety.</p>
              </div>
              <div className="feature">
                <h3>Expert Sourcing & Support</h3>
                <p>We don't just sell; we source the exact specs you need and provide full technical operation.</p>
              </div>
            </div>
          </div>
        </section>
      </div>


      {/* Enquiry Section */}
      <section className="enquiry-section">
        <div className="skeuo-panel center-panel">
          <h2 className="engraved-text">Start Your Project</h2>
          <p className="inset-text">Transform your space with Loofix LED solutions. Quick enquiry via WhatsApp.</p>
          <div className="enquiry-options">
            <a
              href="https://wa.me/919400374426?text=hi%20I'm%20interested%20in%20LED%20Wall%20Rental"
              className="skeuo-btn option-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rental Enquiry
            </a>
            <a
              href="https://wa.me/919400374426?text=hi%20I'm%20interested%20in%20Purchasing%20LED%20Displays"
              className="skeuo-btn option-btn highlighted"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sales Enquiry
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}

export default App;
