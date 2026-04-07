import { useEffect, useRef, useState } from 'react';
import './App.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Create the hidden video element
    const video = document.createElement('video');
    video.src = '/reencoded_newsinan.mp4';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    videoRef.current = video;

    video.addEventListener('loadeddata', () => {
      setLoaded(true);
      // Draw the first frame
      drawFrame();
    });

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, []);

  const drawFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const hRatio = canvas.width / video.videoWidth;
    const vRatio = canvas.height / video.videoHeight;
    const ratio = Math.max(hRatio, vRatio);

    const cx = (canvas.width - video.videoWidth * ratio) / 2;
    const cy = (canvas.height - video.videoHeight * ratio) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight,
      cx, cy, video.videoWidth * ratio, video.videoHeight * ratio);
  };

  // Set up GSAP ScrollTrigger to scrub video
  useEffect(() => {
    if (!loaded || !videoRef.current) return;

    const video = videoRef.current;

    const ctx = gsap.context(() => {
      gsap.to(video, {
        currentTime: video.duration || 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.content-scroll',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
        }
      });
    }, containerRef);

    // Use requestAnimationFrame to continuously draw the current video frame
    let rafId;
    const tick = () => {
      drawFrame();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        drawFrame();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      ctx.revert();
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [loaded]);

  return (
    <div className="app-container" ref={containerRef}>
      {/* Native 2D Canvas for video frames */}
      <canvas ref={canvasRef} className="scroll-canvas" />

      {!loaded && (
        <div className="loading-screen">
          <div className="spinner"></div>
          <h2 className="cursive-title" style={{ fontSize: '2rem' }}>LooFix</h2>
          <p>Loading Experience...</p>
        </div>
      )}

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
