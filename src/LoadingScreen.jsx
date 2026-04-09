import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { LEDWallScene, BillboardScene, WaveGridScene, BackgroundParticles } from './LoadingScenes';
import './LoadingScreen.css';

const QUOTES = [
    "Illuminating your vision",
    "Redefining digital displays",
    "Where technology meets brilliance",
    "Crafted for impact",
    "Engineered to inspire",
];

export default function LoadingScreen({ progress, exiting }) {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [quoteFade, setQuoteFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteFade(false);
            setTimeout(() => {
                setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
                setQuoteFade(true);
            }, 600);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`loader-overlay ${exiting ? 'loader-exit' : ''}`}>
            {/* WebGL — Three cycling scenes */}
            <div className="loader-canvas-wrap">
                <Canvas
                    camera={{ position: [0, 0, 7], fov: 55 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: 'transparent' }}
                >
                    <ambientLight intensity={0.3} />
                    <pointLight position={[5, 5, 5]} intensity={0.8} color="#a78bfa" />
                    <pointLight position={[-5, -3, 3]} intensity={0.4} color="#6d28d9" />
                    <LEDWallScene />
                    <BillboardScene />
                    <WaveGridScene />
                    <BackgroundParticles />
                </Canvas>
            </div>

            {/* Brand + Quotes Overlay */}
            <div className="loader-content">
                <h1 className="loader-brand">Loofix</h1>
                <p className={`loader-quote ${quoteFade ? 'quote-visible' : 'quote-hidden'}`}>
                    {QUOTES[quoteIndex]}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="loader-progress-wrap">
                <div className="loader-progress-track">
                    <div className="loader-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <span className="loader-progress-text">{Math.round(progress)}%</span>
            </div>
        </div>
    );
}
