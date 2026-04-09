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

/* ── LED Modular Wall ───────────────────────────────────────── */
const GRID_COLS = 8;
const GRID_ROWS = 5;
const PANEL_W = 0.9;
const PANEL_H = 0.9;
const GAP = 0.08;
const CYCLE_DURATION = 5; // seconds per assemble→hold→split cycle

function LEDPanel({ col, row, totalCols, totalRows }) {
    const meshRef = useRef();
    const matRef = useRef();

    // Target assembled position (centered grid)
    const targetX = (col - (totalCols - 1) / 2) * (PANEL_W + GAP);
    const targetY = (row - (totalRows - 1) / 2) * (PANEL_H + GAP);

    // Random scattered position
    const scatter = useMemo(() => ({
        x: (Math.random() - 0.5) * 18,
        y: (Math.random() - 0.5) * 12,
        z: (Math.random() - 0.5) * 14,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
    }), []);

    // Unique color per panel — subtle LED-like hues
    const panelColor = useMemo(() => {
        const hue = (col * totalRows + row) / (totalCols * totalRows);
        return new THREE.Color().setHSL(0.7 + hue * 0.15, 0.6, 0.35);
    }, [col, row, totalCols, totalRows]);

    const emissiveColor = useMemo(() => {
        const hue = (col * totalRows + row) / (totalCols * totalRows);
        return new THREE.Color().setHSL(0.7 + hue * 0.15, 0.8, 0.5);
    }, [col, row, totalCols, totalRows]);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const t = clock.getElapsedTime();
        const cycle = t % CYCLE_DURATION;
        const phase = cycle / CYCLE_DURATION;

        // Phase timeline:
        //  0.00–0.35  → assemble (scattered → grid)
        //  0.35–0.60  → hold (assembled wall, glow pulse)
        //  0.60–0.95  → split (grid → scattered)
        //  0.95–1.00  → brief pause scattered

        let lerp = 0; // 0 = scattered, 1 = assembled
        if (phase < 0.35) {
            // Ease in: smooth assemble
            const p = phase / 0.35;
            lerp = p * p * (3 - 2 * p); // smoothstep
        } else if (phase < 0.60) {
            lerp = 1;
        } else if (phase < 0.95) {
            // Ease out: smooth split
            const p = (phase - 0.60) / 0.35;
            const s = p * p * (3 - 2 * p);
            lerp = 1 - s;
        } else {
            lerp = 0;
        }

        // Position
        meshRef.current.position.x = scatter.x + (targetX - scatter.x) * lerp;
        meshRef.current.position.y = scatter.y + (targetY - scatter.y) * lerp;
        meshRef.current.position.z = scatter.z + (0 - scatter.z) * lerp;

        // Rotation — tumble when scattered, flat when assembled
        meshRef.current.rotation.x = scatter.rx * (1 - lerp);
        meshRef.current.rotation.y = scatter.ry * (1 - lerp);
        meshRef.current.rotation.z = scatter.rz * (1 - lerp);

        // Emissive glow pulse when assembled
        if (matRef.current) {
            const glowIntensity = lerp * (0.4 + 0.3 * Math.sin(t * 3 + col + row));
            matRef.current.emissiveIntensity = glowIntensity;
        }
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[PANEL_W, PANEL_H, 0.08]} />
            <meshStandardMaterial
                ref={matRef}
                color={panelColor}
                emissive={emissiveColor}
                emissiveIntensity={0}
                metalness={0.7}
                roughness={0.3}
            />
        </mesh>
    );
}

function LEDWall() {
    const panels = useMemo(() => {
        const arr = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                arr.push({ row: r, col: c });
            }
        }
        return arr;
    }, []);

    return (
        <group>
            {panels.map(({ row, col }) => (
                <LEDPanel
                    key={`${row}-${col}`}
                    row={row}
                    col={col}
                    totalRows={GRID_ROWS}
                    totalCols={GRID_COLS}
                />
            ))}
        </group>
    );
}

/* ── Ambient Particles (background depth) ───────────────────── */
function BackgroundParticles() {
    const ref = useRef();
    const count = 200;

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
        }
        return pos;
    }, []);

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.rotation.y = clock.getElapsedTime() * 0.01;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={positions}
                    count={count}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.04}
                color="#7c3aed"
                transparent
                opacity={0.4}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

/* ── Main Loading Screen ────────────────────────────────────── */
export default function LoadingScreen({ progress, exiting }) {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [quoteFade, setQuoteFade] = useState(true);

    // Cycle through quotes
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
            {/* WebGL Background — LED Wall + ambient particles */}
            <div className="loader-canvas-wrap">
                <Canvas
                    camera={{ position: [0, 0, 7], fov: 55 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: 'transparent' }}
                >
                    <ambientLight intensity={0.3} />
                    <pointLight position={[5, 5, 5]} intensity={0.8} color="#a78bfa" />
                    <pointLight position={[-5, -3, 3]} intensity={0.4} color="#6d28d9" />
                    <LEDWall />
                    <BackgroundParticles />
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
