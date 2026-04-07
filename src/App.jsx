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
      const startAnimScroll = window.innerHeight * 0.8; // Start animation after scrolling down 80% of viewport

      const contentWrapper = document.querySelector('.content-scroll');
      const contentHeight = contentWrapper ? contentWrapper.offsetHeight : document.documentElement.scrollHeight;
      const maxScrollTop = contentHeight - window.innerHeight;
      const animScrollRange = maxScrollTop - startAnimScroll;

      let scrollFraction = 0;
      if (animScrollRange > 0) {
        scrollFraction = Math.max(0, (scrollTop - startAnimScroll) / animScrollRange);
        if (scrollFraction > 1) scrollFraction = 1;
      }

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

      {/* Normal Background Enquiry Section after scrolling finishes */}
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
