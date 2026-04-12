import { useEffect, useRef, useState } from 'react';
import './App.css';
import './Components.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import ScrollScene from './ScrollScene';
import LoadingScreen from './LoadingScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import TestimonialsMarquee from './components/TestimonialsMarquee';
import ContactModal from './components/ContactModal';

gsap.registerPlugin(ScrollTrigger);

// Helper for splitting text into spanned chars for animation
const SplitTextHeading = ({ children, className }) => {
  return (
    <h2 className={className}>
      {children.split('').map((char, i) => (
        <span key={i} className="heading-split-char" style={{ display: char === ' ' ? 'inline' : 'inline-block' }}>
          {char}
        </span>
      ))}
    </h2>
  );
};

function App() {
  const containerRef = useRef(null);
  const scrollProgress = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });

  // Loading states
  const initEntered = useRef(typeof window !== 'undefined' && !!sessionStorage.getItem('loofix_visited')).current;
  const [progress, setProgress] = useState(initEntered ? 100 : 0);
  const [glReady, setGlReady] = useState(false);
  const [exiting, setExiting] = useState(initEntered);
  const [entered, setEntered] = useState(initEntered);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const glowRef = useRef(null);

  // Smooth progress over 21s — ensures user sees all 3 loading animations
  useEffect(() => {
    if (initEntered) return;
    let raf;
    const start = performance.now();
    const dur = 21000;
    const tick = () => {
      const t = Math.min((performance.now() - start) / dur, 1);
      setProgress(t * (2 - t) * 100); // ease-out quad
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    sessionStorage.setItem('loofix_visited', 'true');
    return () => cancelAnimationFrame(raf);
  }, [initEntered]);

  // Trigger exit animation when progress done + WebGL ready
  useEffect(() => {
    if (progress < 100 || !glReady) return;
    const t1 = setTimeout(() => setExiting(true), 400);
    const t2 = setTimeout(() => setEntered(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [progress, glReady]);

  // Track mouse at window level (Canvas can't see mouse through content overlay)
  useEffect(() => {
    let xTo = gsap.quickTo(glowRef.current, "x", { duration: 0.8, ease: "power3" });
    let yTo = gsap.quickTo(glowRef.current, "y", { duration: 0.8, ease: "power3" });

    const onMove = (e) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Block scrolling while loading
  useEffect(() => {
    document.body.style.overflow = entered ? '' : 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [entered]);

  // ScrollTrigger for panels entrance & interactive tilt
  useEffect(() => {
    if (!entered) return;

    const panels = gsap.utils.toArray('.glass-panel');
    panels.forEach((panel) => {
      // 1. Scroll Entrance
      gsap.fromTo(panel,
        { opacity: 0, y: 100, rotateX: -15, filter: 'blur(10px)' },
        {
          scrollTrigger: { trigger: panel, start: 'top 85%', end: 'top 50%', scrub: 1 },
          opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', duration: 1
        }
      );

      // 2. Text Reveal Stagger for Headings
      const chars = panel.querySelectorAll('.heading-split-char');
      if (chars.length) {
        gsap.fromTo(chars,
          { opacity: 0, y: 20 },
          {
            scrollTrigger: { trigger: panel, start: 'top 75%' },
            opacity: 1, y: 0, duration: 0.5, stagger: 0.02, ease: 'back.out(2)'
          }
        );
      }

      // 3. 3D Tilt Effect on mousemove
      const onMouseMove = (e) => {
        const rect = panel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        gsap.to(panel, { rotateX, rotateY, duration: 0.5, ease: 'power2.out', transformPerspective: 1000 });
      };
      const onMouseLeave = () => {
        gsap.to(panel, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
      };
      panel.addEventListener('mousemove', onMouseMove);
      panel.addEventListener('mouseleave', onMouseLeave);

      panel._cleanupTilt = () => {
        panel.removeEventListener('mousemove', onMouseMove);
        panel.removeEventListener('mouseleave', onMouseLeave);
      };
    });

    const st = ScrollTrigger.create({
      trigger: '.content-scroll',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { scrollProgress.current = self.progress; }
    });
    return () => {
      panels.forEach(p => p._cleanupTilt && p._cleanupTilt());
      st.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [entered]);

  return (
    <div className="app-container" ref={containerRef}>
      <div className="glow-cursor" ref={glowRef}></div>
      {entered && <Header />}
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
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
      <div className={`content-scroll ${entered ? 'page-enter' : ''}`}>
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="cursive-title">Loofix</h1>
            <p className="brand-quote">"Sourcing the world's most immersive LED modular displays for your vision."</p>
          </div>
        </section>

        <section className="scroll-section" id="products">
          <div className="glass-panel">
            <div className="panel-tag">Curated Selection</div>
            <SplitTextHeading>Modular LED Walls</SplitTextHeading>
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
            <SplitTextHeading>Global Billboard Solutions</SplitTextHeading>
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

        <section className="scroll-section" id="specs">
          <div className="glass-panel">
            <div className="panel-tag">Reliable Partner</div>
            <SplitTextHeading>Your Trusted LED Dealer</SplitTextHeading>
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

      <TestimonialsMarquee />      {/* Enquiry Section */}
      <section className="enquiry-section" id="enquiry">
        <div className="skeuo-panel center-panel">
          <h2 className="engraved-text">Start Your Project</h2>
          <p className="inset-text">Transform your space with Loofix LED solutions. Quick enquiry via WhatsApp or Email.</p>
          <div className="enquiry-options">
            <a
              href="https://wa.me/919400374426?text=hi%20I'm%20interested%20in%20LED%20Wall%20Rental"
              className="skeuo-btn option-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rental Enquiry
            </a>
            <button
              className="skeuo-btn option-btn highlighted"
              onClick={() => setIsContactOpen(true)}
            >
              Email Us Directly
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div >
  );
}

export default App;
