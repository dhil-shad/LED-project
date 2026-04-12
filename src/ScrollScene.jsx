import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COLS = 8, ROWS = 5, PW = 0.92, GAP = 0.08;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ss = (t) => t * t * (3 - 2 * t);
const ease = (t, s, d) => ss(clamp((t - s) / d, 0, 1));
const lerp = (a, b, f) => a + (b - a) * f;

export default function ScrollScene({ scrollProgress, mousePos }) {
    const smoothP = useRef(0);
    const meshRefs = useRef([]);
    const matRefs = useRef([]);
    const groupRef = useRef();
    const gridRef = useRef();
    const scanRef = useRef();
    const scanMatRef = useRef();
    const orbRefs = useRef([]);
    const orbMatRefs = useRef([]);
    const sparkRef = useRef();
    const dustRef = useRef();
    const light1 = useRef();
    const light2 = useRef();
    const light3 = useRef();

    // Mouse interaction refs
    const cursorLightRef = useRef();
    const cursorOrbRef = useRef();
    const cursorOrbMatRef = useRef();
    const cursorTrailRefs = useRef([]);
    const cursorTrailMatRefs = useRef([]);
    const smoothMouse = useRef({ x: 0, y: 0 });
    const trailPositions = useRef(
        Array.from({ length: 6 }, () => ({ x: 0, y: 0 }))
    );

    /* ── Panel data ─────────────────────────────────── */
    const panels = useMemo(() => {
        const a = [];
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                a.push({
                    tx: (c - (COLS - 1) / 2) * (PW + GAP),
                    ty: (r - (ROWS - 1) / 2) * (PW + GAP),
                    sx: (Math.random() - 0.5) * 14 + Math.cos(c + r) * 2,
                    sy: (Math.random() - 0.5) * 10 + Math.sin(c * r) * 1.5,
                    sz: (Math.random() - 0.5) * 12,
                    srx: Math.random() * Math.PI * 2, sry: Math.random() * Math.PI * 2,
                    srz: Math.random() * Math.PI * 2,
                    ex: (c - (COLS - 1) / 2) * 2.2 + (Math.random() - 0.5) * 2,
                    ey: (r - (ROWS - 1) / 2) * 2.0 + (Math.random() - 0.5) * 2,
                    ez: (Math.random() - 0.5) * 8,
                    hue: 0.7 + ((c * ROWS + r) / (COLS * ROWS)) * 0.15,
                    c, r,
                });
        return a;
    }, []);

    /* ── Grid floor geometry ───────────────────────── */
    const gridGeo = useMemo(() => {
        const pts = [];
        const size = 14, divs = 28, step = (size * 2) / divs;
        for (let i = 0; i <= divs; i++) {
            const p = -size + i * step;
            pts.push(new THREE.Vector3(p, 0, -size), new THREE.Vector3(p, 0, size));
            pts.push(new THREE.Vector3(-size, 0, p), new THREE.Vector3(size, 0, p));
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, []);

    /* ── Particle positions ────────────────────────── */
    const dustPos = useMemo(() => {
        const p = new Float32Array(150 * 3);
        for (let i = 0; i < 150; i++) {
            p[i * 3] = (Math.random() - 0.5) * 28;
            p[i * 3 + 1] = (Math.random() - 0.5) * 18;
            p[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
        }
        return p;
    }, []);

    const SPARK_COUNT = 70;
    const sparkPos = useMemo(() => {
        const p = new Float32Array(SPARK_COUNT * 3);
        for (let i = 0; i < SPARK_COUNT; i++) {
            p[i * 3] = (Math.random() - 0.5) * 16;
            p[i * 3 + 1] = Math.random() * 14 - 5;
            p[i * 3 + 2] = (Math.random() - 0.5) * 12;
        }
        return p;
    }, []);

    /* ── Orb configs ───────────────────────────────── */
    const orbs = useMemo(() => [
        { radius: 5.5, speed: 0.18, height: 1.5, size: 0.35, hueOff: 0 },
        { radius: 3.8, speed: -0.14, height: -0.5, size: 0.25, hueOff: 0.33 },
        { radius: 4.5, speed: 0.22, height: 0.5, size: 0.3, hueOff: 0.66 },
    ], []);

    /* ── Trail configs ─────────────────────────────── */
    const TRAIL_COUNT = 6;
    const trailSizes = useMemo(
        () => Array.from({ length: TRAIL_COUNT }, (_, i) => 0.15 - i * 0.02), []
    );

    /* ═══ ANIMATION FRAME ═════════════════════════════ */
    useFrame(({ clock }) => {
        smoothP.current += (scrollProgress.current - smoothP.current) * 0.08;
        const t = smoothP.current;
        const time = clock.getElapsedTime();

        // ── Smooth mouse tracking (window-level, works over content overlay) ──
        const rawMX = mousePos.current.x;
        const rawMY = mousePos.current.y;
        const targetMX = rawMX * 6;
        const targetMY = rawMY * 4;
        smoothMouse.current.x = lerp(smoothMouse.current.x, targetMX, 0.08);
        smoothMouse.current.y = lerp(smoothMouse.current.y, targetMY, 0.08);
        const mx = smoothMouse.current.x;
        const my = smoothMouse.current.y;

        // Mouse reactivity fades as user scrolls past hero
        const mouseInfluence = 1 - ease(t, 0.0, 0.25);

        // ── Cursor-following light ──
        if (cursorLightRef.current) {
            cursorLightRef.current.position.set(mx, my, 4);
            cursorLightRef.current.intensity = 1.5 * mouseInfluence;
            const pulseHue = (0.75 + Math.sin(time * 0.8) * 0.08) % 1;
            cursorLightRef.current.color.setHSL(pulseHue, 0.9, 0.6);
        }

        // ── Cursor glow orb ──
        if (cursorOrbRef.current && cursorOrbMatRef.current) {
            cursorOrbRef.current.position.set(mx, my, 3.5);
            const pulse = 0.2 + Math.sin(time * 3) * 0.05;
            cursorOrbRef.current.scale.setScalar(pulse * mouseInfluence);
            cursorOrbMatRef.current.opacity = 0.5 * mouseInfluence;
        }

        // ── Cursor trail ──
        trailPositions.current[0] = { x: mx, y: my };
        for (let i = TRAIL_COUNT - 1; i > 0; i--) {
            const prev = trailPositions.current[i - 1];
            const cur = trailPositions.current[i];
            trailPositions.current[i] = {
                x: lerp(cur.x, prev.x, 0.15),
                y: lerp(cur.y, prev.y, 0.15),
            };
        }
        for (let i = 0; i < TRAIL_COUNT; i++) {
            const tr = cursorTrailRefs.current[i];
            const mat = cursorTrailMatRefs.current[i];
            if (!tr || !mat) continue;
            const tp = trailPositions.current[i];
            tr.position.set(tp.x, tp.y, 3.2 - i * 0.15);
            tr.scale.setScalar(trailSizes[i] * mouseInfluence);
            mat.opacity = (0.35 - i * 0.05) * mouseInfluence;
        }

        // Mouse parallax
        const mouseX = rawMX * 0.2;
        const mouseY = rawMY * 0.2;

        // Derived animation values
        const assemble = ease(t, 0.08, 0.32);
        const wallHold = 1 - ease(t, 0.65, 0.28);
        const wallPhase = Math.min(assemble, wallHold);
        const disperse = ease(t, 0.68, 0.30);
        const glow = ease(t, 0.15, 0.25) * (1 - ease(t, 0.85, 0.15));

        // ── Group rotation (cinematic orbit + mouse parallax) ──
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.45 + mouseX * (1 - disperse);
            groupRef.current.rotation.x = Math.sin(t * Math.PI) * 0.12 - mouseY * (1 - disperse);
        }

        // ── Grid floor ──
        if (gridRef.current) {
            gridRef.current.material.opacity = 0.08 + glow * 0.35;
            gridRef.current.material.color.setHSL((0.72 + t * 0.2) % 1, 0.7, 0.4);
        }

        // ── Scan beam ──
        if (scanRef.current && scanMatRef.current) {
            const scanActive = wallPhase > 0.85;
            scanRef.current.visible = scanActive;
            if (scanActive) {
                scanRef.current.position.set(0, Math.sin(time * 2.5) * 2, 0.12);
                scanMatRef.current.opacity = (wallPhase - 0.85) * 6 * 0.5;
            }
        }

        // ── Dynamic lights ──
        const hueBase = (0.7 + t * 0.3) % 1;
        if (light1.current) {
            light1.current.color.setHSL(hueBase, 0.8, 0.5);
            light1.current.position.set(Math.sin(time * 0.3) * 7, 4 + Math.cos(time * 0.2) * 2, Math.cos(time * 0.3) * 7);
            light1.current.intensity = 0.3 + glow * 1.0;
        }
        if (light2.current) {
            light2.current.color.setHSL((hueBase + 0.15) % 1, 0.7, 0.5);
            light2.current.position.set(Math.cos(time * 0.25) * 5, -2, Math.sin(time * 0.25) * 5);
            light2.current.intensity = 0.2 + glow * 0.6;
        }
        if (light3.current) {
            light3.current.color.setHSL((hueBase + 0.4) % 1, 0.6, 0.5);
            light3.current.position.set(-3, Math.sin(time * 0.4) * 3, -5);
            light3.current.intensity = 0.15 + glow * 0.4;
        }

        // ── Floating orbs (attracted toward cursor in hero) ──
        orbs.forEach((cfg, i) => {
            const orb = orbRefs.current[i], mat = orbMatRefs.current[i];
            if (!orb || !mat) return;
            const angle = time * cfg.speed + i * 2.1;
            let ox = Math.cos(angle) * cfg.radius;
            let oy = cfg.height + Math.sin(time * 0.5 + i * 1.5) * 0.8;
            let oz = Math.sin(angle) * cfg.radius;

            // Subtle attraction toward cursor
            if (mouseInfluence > 0.1) {
                const attract = 0.15 * mouseInfluence;
                ox = lerp(ox, mx * 0.6, attract);
                oy = lerp(oy, my * 0.6, attract);
            }

            orb.position.set(ox, oy, oz);
            orb.scale.setScalar(cfg.size * (1 + Math.sin(time * 2 + i) * 0.25));
            mat.color.setHSL((hueBase + cfg.hueOff) % 1, 0.85, 0.55);
            mat.opacity = 0.25 + glow * 0.45;
        });

        // ── LED Panels (react to cursor proximity) ──
        panels.forEach((p, i) => {
            const mesh = meshRefs.current[i], mat = matRefs.current[i];
            if (!mesh || !mat) return;

            let fX = p.sx + (p.tx - p.sx) * wallPhase;
            let fY = p.sy + (p.ty - p.sy) * wallPhase;
            let fZ = p.sz * (1 - wallPhase);
            fX = fX + (p.ex - fX) * disperse;
            fY = fY + (p.ey - fY) * disperse;
            fZ = fZ + (p.ez - fZ) * disperse;

            // Mouse proximity displacement (hero phase only)
            if (mouseInfluence > 0.05) {
                const dx = fX - mx;
                const dy = fY - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 4) {
                    const force = (1 - dist / 4) * 0.8 * mouseInfluence;
                    fX += dx * force * 0.3;
                    fY += dy * force * 0.3;
                    fZ += force * 0.5;
                    // Extra glow for nearby panels
                    mat.emissiveIntensity += force * 1.5;
                }
            }

            mesh.position.set(fX, fY, fZ);

            const rot = 1 - wallPhase + disperse * 0.5;
            mesh.rotation.set(p.srx * rot, p.sry * rot, p.srz * rot);

            const breathe = wallPhase > 0.9 ? 1 + Math.sin(time * 1.5 + p.c * 0.5 + p.r * 0.3) * 0.04 : 1;
            mesh.scale.setScalar(breathe);

            const hue = (p.hue + t * 0.3 + Math.sin(time * 0.5 + p.c * 0.3 + p.r * 0.2) * 0.06) % 1;
            mat.emissive.setHSL(hue, 0.8, 0.5);
            mat.emissiveIntensity = glow * (0.5 + 0.35 * Math.sin(time * 2 + p.c + p.r));
        });

        // ── Rising sparks (displaced by cursor) ──
        if (sparkRef.current) {
            const arr = sparkRef.current.geometry.attributes.position.array;
            for (let i = 0; i < SPARK_COUNT; i++) {
                arr[i * 3 + 1] += 0.015 + Math.sin(i) * 0.005;
                if (arr[i * 3 + 1] > 9) { arr[i * 3 + 1] = -5; arr[i * 3] = (Math.random() - 0.5) * 16; }

                // Push sparks away from cursor
                if (mouseInfluence > 0.1) {
                    const sdx = arr[i * 3] - mx;
                    const sdy = arr[i * 3 + 1] - my;
                    const sd = Math.sqrt(sdx * sdx + sdy * sdy);
                    if (sd < 6) {
                        // increased radius to 6, force to 0.15 for dramatic immersion
                        const sf = (1 - sd / 6) * 0.15 * mouseInfluence;
                        arr[i * 3] += sdx * sf;
                        arr[i * 3 + 1] += sdy * sf;
                    }
                }
            }
            sparkRef.current.geometry.attributes.position.needsUpdate = true;
            sparkRef.current.material.opacity = 0.15 + glow * 0.55;
        }

        // ── Ambient dust ──
        if (dustRef.current) {
            dustRef.current.rotation.y = time * 0.008 + t * 0.2;
            dustRef.current.material.opacity = 0.15 + glow * 0.25;
        }
    });

    /* ═══ JSX ═════════════════════════════════════════ */
    return (
        <>
            {/* Dynamic colored lights */}
            <ambientLight intensity={0.15} />
            <pointLight ref={light1} intensity={0.5} distance={20} />
            <pointLight ref={light2} intensity={0.3} distance={15} />
            <pointLight ref={light3} intensity={0.2} distance={12} />

            {/* ★ Cursor-following light */}
            <pointLight ref={cursorLightRef} intensity={0} distance={10} decay={2} />

            {/* ★ Cursor glow orb */}
            <mesh ref={cursorOrbRef}>
                <sphereGeometry args={[1, 24, 24]} />
                <meshBasicMaterial ref={cursorOrbMatRef}
                    color="#b794f6" transparent opacity={0}
                    blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            {/* ★ Cursor trail */}
            {trailSizes.map((_, i) => (
                <mesh key={`trail-${i}`} ref={el => (cursorTrailRefs.current[i] = el)}>
                    <sphereGeometry args={[1, 12, 12]} />
                    <meshBasicMaterial ref={el => (cursorTrailMatRefs.current[i] = el)}
                        color="#a78bfa" transparent opacity={0}
                        blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            ))}

            {/* Neon grid floor */}
            <lineSegments ref={gridRef} geometry={gridGeo} position={[0, -3.5, 0]}>
                <lineBasicMaterial color="#7c3aed" transparent opacity={0.1} />
            </lineSegments>

            {/* LED Panels */}
            <group ref={groupRef}>
                {panels.map((p, i) => (
                    <mesh key={i} ref={el => (meshRefs.current[i] = el)}>
                        <boxGeometry args={[PW, PW, 0.08]} />
                        <meshStandardMaterial
                            ref={el => (matRefs.current[i] = el)}
                            color={new THREE.Color().setHSL(p.hue, 0.5, 0.2)}
                            emissive={new THREE.Color().setHSL(p.hue, 0.8, 0.5)}
                            emissiveIntensity={0} metalness={0.7} roughness={0.3}
                        />
                    </mesh>
                ))}
            </group>

            {/* Scan beam */}
            <mesh ref={scanRef} visible={false}>
                <planeGeometry args={[8, 0.06]} />
                <meshBasicMaterial ref={scanMatRef} color="#00ffcc" transparent opacity={0}
                    side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Floating orbs */}
            {orbs.map((_, i) => (
                <mesh key={i} ref={el => (orbRefs.current[i] = el)}>
                    <sphereGeometry args={[1, 20, 20]} />
                    <meshBasicMaterial ref={el => (orbMatRefs.current[i] = el)}
                        color="#a78bfa" transparent opacity={0.3}
                        blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            ))}

            {/* Ambient dust */}
            <points ref={dustRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" array={dustPos} count={150} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.04} color="#7c3aed" transparent opacity={0.2}
                    sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            {/* Rising spark particles */}
            <points ref={sparkRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" array={sparkPos} count={SPARK_COUNT} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.06} color="#c4b5fd" transparent opacity={0.2}
                    sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>
        </>
    );
}
