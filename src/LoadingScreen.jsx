import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './LoadingScreen.css';

const QUOTES = [
    "Illuminating your vision",
    "Redefining digital displays",
    "Where technology meets brilliance",
    "Crafted for impact",
    "Engineered to inspire",
];

/* ── WebGL Particle Field ───────────────────────────────────── */
function ParticleField() {
    const meshRef = useRef();
    const count = 600;

    const [positions, sizes, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const col = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
            siz[i] = Math.random() * 3 + 0.5;

            // Soft purple / silver palette
            const t = Math.random();
            col[i * 3] = 0.5 + t * 0.3;   // R
            col[i * 3 + 1] = 0.3 + t * 0.15;  // G
            col[i * 3 + 2] = 0.7 + t * 0.3;   // B
        }
        return [pos, siz, col];
    }, []);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const time = clock.getElapsedTime();
        const geo = meshRef.current.geometry;
        const posAttr = geo.attributes.position;
        const arr = posAttr.array;

        for (let i = 0; i < count; i++) {
            arr[i * 3 + 1] += Math.sin(time * 0.3 + i * 0.1) * 0.003;
            arr[i * 3] += Math.cos(time * 0.2 + i * 0.05) * 0.002;
        }
        posAttr.needsUpdate = true;
        meshRef.current.rotation.y = time * 0.02;
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={positions}
                    count={count}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    array={sizes}
                    count={count}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-color"
                    array={colors}
                    count={count}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.08}
                vertexColors
                transparent
                opacity={0.7}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

/* ── Glowing Orb (ambient light source) ─────────────────────── */
function GlowOrb() {
    const ref = useRef();
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        ref.current.position.x = Math.sin(t * 0.15) * 3;
        ref.current.position.y = Math.cos(t * 0.2) * 2;
        ref.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.3);
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.15} />
        </mesh>
    );
}

/* ── Main Loading Screen ────────────────────────────────────── */
export default function LoadingScreen({ progress, exiting }) {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [quoteFade, setQuoteFade] = useState(true);

    // Cycle through quotes
    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteFade(false); // fade out
            setTimeout(() => {
                setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
                setQuoteFade(true); // fade in
            }, 600);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`loader-overlay ${exiting ? 'loader-exit' : ''}`}>
            {/* WebGL Background */}
            <div className="loader-canvas-wrap">
                <Canvas
                    camera={{ position: [0, 0, 8], fov: 60 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: 'transparent' }}
                >
                    <ambientLight intensity={0.2} />
                    <ParticleField />
                    <GlowOrb />
                </Canvas>
            </div>

            {/* Content Overlay */}
            <div className="loader-content">
                <h1 className="loader-brand">Loofix</h1>
                <p className={`loader-quote ${quoteFade ? 'quote-visible' : 'quote-hidden'}`}>
                    {QUOTES[quoteIndex]}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="loader-progress-wrap">
                <div className="loader-progress-track">
                    <div
                        className="loader-progress-fill"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                <span className="loader-progress-text">{Math.round(progress)}%</span>
            </div>
        </div>
    );
}
