import { useEffect, useRef, useState } from 'react';
import './App.css';

const FRAME_COUNT = 192; // frame_0000.jpg to frame_0191.jpg

function App() {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    const loadedImages = [];
    let loadedCount = 0;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const frameNumber = i.toString().padStart(4, '0');
      img.src = `/frames/frame_${frameNumber}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          setLoaded(true);
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

    const render = (frameIndex) => {
      if (images[frameIndex]) {
        const img = images[frameIndex];

        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio);

        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, img.width, img.height,
          centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
      }
    };

    render(0);

    const handleScroll = () => {
      // Calculate scroll fraction
      const scrollTop = document.documentElement.scrollTop;
      const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
      const scrollFraction = scrollTop / maxScrollTop;

      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(scrollFraction * FRAME_COUNT)
      );

      requestAnimationFrame(() => render(frameIndex));
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      handleScroll();
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
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
