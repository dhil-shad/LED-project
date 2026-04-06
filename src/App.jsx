import { useEffect, useRef, useState } from 'react';
import './App.css';

const FRAME_COUNT = 192; // frame_0000.jpg to frame_0191.jpg

function App() {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const currentScrollIndexRef = useRef(0);
  const renderRef = useRef(null);

  // Preload images
  useEffect(() => {
    const loadedImages = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const frameNumber = i.toString().padStart(4, '0');

      if ('fetchPriority' in HTMLImageElement.prototype) {
        img.fetchPriority = i < 15 ? 'high' : 'low';
      }

      img.src = `/frames/frame_${frameNumber}.jpg`;
      img.onload = () => {
        if (i === 0) {
          setLoaded(true);
        }
        if (i === currentScrollIndexRef.current && renderRef.current) {
          renderRef.current(i);
        }
      };
      loadedImages.push(img);
    }
    setImages(loadedImages);
  }, []);

  // Handle Scroll and Draw
  useEffect(() => {
    if (!loaded || !canvasRef.current || images.length === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let lastDrawnIndex = -1;

    const render = (frameIndex) => {
      let targetIndex = frameIndex;
      while (targetIndex >= 0 && (!images[targetIndex] || !images[targetIndex].complete)) {
        targetIndex--;
      }

      if (targetIndex < 0) {
        targetIndex = frameIndex + 1;
        while (targetIndex < FRAME_COUNT && (!images[targetIndex] || !images[targetIndex].complete)) {
          targetIndex++;
        }
      }

      if (targetIndex < 0 || targetIndex >= FRAME_COUNT || targetIndex === lastDrawnIndex || !images[targetIndex].complete) {
        return;
      }

      const img = images[targetIndex];

      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);

      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

      lastDrawnIndex = targetIndex;
    };

    renderRef.current = render;
    render(0);

    const handleScroll = () => {
      // Calculate scroll fraction
      const scrollTop = document.documentElement.scrollTop;
      const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
      const scrollFraction = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;

      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(scrollFraction * FRAME_COUNT)
      );

      currentScrollIndexRef.current = frameIndex;
      requestAnimationFrame(() => render(frameIndex));
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      lastDrawnIndex = -1;
      handleScroll();
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      renderRef.current = null;
    };
  }, [loaded, images]);

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="scroll-canvas" />

      {!loaded && (
        <div className="loading-screen">
          <div className="spinner"></div>
          <h2>Loading Experience...</h2>
        </div>
      )}

      {/* Content wrapper for scrolling */}
      <div className="content-scroll">
        <section className="scroll-section">
          <div className="glass-panel">
            <h1>NEON Interactive</h1>
            <p>Scroll down to explore the immersive 3D animation sequence.</p>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel align-right">
            <h2>Seamless Integration</h2>
            <p>192 high-quality frames loaded seamlessly via background prefetching to deliver an unparalleled smooth scrolling experience.</p>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel">
            <h2>Modern Aesthetics</h2>
            <p>Incorporating glassmorphism, precise typography, and dynamic canvas rendering for cutting-edge web design.</p>
          </div>
        </section>

        <section className="scroll-section">
          <div className="glass-panel center-panel">
            <h2>Journey Complete</h2>
            <p>You have reached the end of the interactive sequence.</p>
            <button className="premium-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to Top</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
