import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── Timing Helpers ──────────────────────────────────── */
const SCENE_DUR = 7;
const NUM_SCENES = 3;
export const TOTAL_CYCLE = SCENE_DUR * NUM_SCENES;
const FADE = 0.8;
const smooth = (t) => t * t * (3 - 2 * t);

export function getSceneState(elapsed, idx) {
    const ct = elapsed % TOTAL_CYCLE;
    const s = idx * SCENE_DUR;
    if (ct < s || ct >= s + SCENE_DUR) return null;
    const local = ct - s;
    const fi = Math.min(local / FADE, 1);
    const fo = Math.min((SCENE_DUR - local) / FADE, 1);
    return { t: local, fade: Math.min(fi, fo) };
}

/* ═══════════════════════════════════════════════════════
   Scene 1: LED Wall Assembly
   Panels scatter → assemble → glow → split
   ═══════════════════════════════════════════════════════ */
export function LEDWallScene() {
    const groupRef = useRef();
    const meshRefs = useRef([]);
    const matRefs = useRef([]);
    const COLS = 8, ROWS = 5, PW = 0.9, GAP = 0.08;

    const panels = useMemo(() => {
        const a = [];
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                a.push({
                    tx: (c - (COLS - 1) / 2) * (PW + GAP),
                    ty: (r - (ROWS - 1) / 2) * (PW + GAP),
                    sx: (Math.random() - 0.5) * 18, sy: (Math.random() - 0.5) * 12,
                    sz: (Math.random() - 0.5) * 14,
                    srx: Math.random() * Math.PI * 2, sry: Math.random() * Math.PI * 2,
                    srz: Math.random() * Math.PI * 2,
                    hue: 0.7 + ((c * ROWS + r) / (COLS * ROWS)) * 0.15,
                    c, r,
                });
        return a;
    }, []);

    useFrame(({ clock }) => {
        const st = getSceneState(clock.getElapsedTime(), 0);
        if (!groupRef.current) return;
        if (!st) { groupRef.current.visible = false; return; }
        groupRef.current.visible = true;
        groupRef.current.scale.setScalar(st.fade);

        const { t } = st;
        let lp = 0;
        if (t < 0.8) lp = 0;
        else if (t < 2.8) lp = smooth(Math.min((t - 0.8) / 2, 1));
        else if (t < 4.2) lp = 1;
        else if (t < 6.2) lp = 1 - smooth(Math.min((t - 4.2) / 2, 1));

        panels.forEach((p, i) => {
            const m = meshRefs.current[i], mt = matRefs.current[i];
            if (!m || !mt) return;
            m.position.set(
                p.sx + (p.tx - p.sx) * lp,
                p.sy + (p.ty - p.sy) * lp,
                p.sz * (1 - lp)
            );
            m.rotation.set(p.srx * (1 - lp), p.sry * (1 - lp), p.srz * (1 - lp));
            mt.emissiveIntensity = lp * (0.4 + 0.3 * Math.sin(t * 3 + p.c + p.r));
        });
    });

    return (
        <group ref={groupRef}>
            {panels.map((p, i) => (
                <mesh key={i} ref={el => meshRefs.current[i] = el}>
                    <boxGeometry args={[PW, PW, 0.08]} />
                    <meshStandardMaterial
                        ref={el => matRefs.current[i] = el}
                        color={new THREE.Color().setHSL(p.hue, 0.6, 0.35)}
                        emissive={new THREE.Color().setHSL(p.hue, 0.8, 0.5)}
                        emissiveIntensity={0} metalness={0.7} roughness={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   Scene 2: Billboard Drop
   Drops from sky → screen flickers → shows LOOFIX in retro style
   ═══════════════════════════════════════════════════════ */
export function BillboardScene() {
    const groupRef = useRef();
    const screenRef = useRef();
    const textRef = useRef();
    const textMatRef = useRef();

    const loofixTex = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 128;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#080810';
        ctx.fillRect(0, 0, 512, 128);
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 30;
        ctx.font = 'bold 56px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00ffff';
        ctx.fillText('LOOFIX', 256, 64);
        ctx.shadowBlur = 60;
        ctx.fillStyle = 'rgba(0,255,255,0.4)';
        ctx.fillText('LOOFIX', 256, 64);
        ctx.shadowBlur = 0;
        for (let y = 0; y < 128; y += 3) {
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(0, y, 512, 1);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }, []);

    useFrame(({ clock }) => {
        const st = getSceneState(clock.getElapsedTime(), 1);
        if (!groupRef.current) return;
        if (!st) { groupRef.current.visible = false; return; }
        groupRef.current.visible = true;
        const { t } = st;

        // Drop in / fall out
        let y = 0;
        if (t < 1.2) {
            y = 8 * (1 - (1 - Math.pow(1 - t / 1.2, 3)));
        } else if (t > 5.8) {
            const p = (t - 5.8) / 1.2;
            y = -10 * p * p;
        }
        groupRef.current.position.y = y;

        // Screen glow
        if (screenRef.current) {
            if (t > 1.5 && t < 3.0)
                screenRef.current.emissiveIntensity = Math.random() > 0.35 ? Math.random() * 0.5 : 0;
            else if (t >= 3.0 && t < 5.8)
                screenRef.current.emissiveIntensity = 0.3 + 0.1 * Math.sin(t * 2);
            else
                screenRef.current.emissiveIntensity = 0;
        }

        // Text overlay
        if (textMatRef.current && textRef.current) {
            if (t > 3.3 && t < 5.8) {
                textMatRef.current.opacity = Math.min((t - 3.3) / 0.5, 1);
                if (Math.random() > 0.93) {
                    textRef.current.position.x = (Math.random() - 0.5) * 0.15;
                    textMatRef.current.color.setHex(Math.random() > 0.5 ? 0xff0044 : 0x00ffff);
                } else {
                    textRef.current.position.x = 0;
                    textMatRef.current.color.setHex(0xffffff);
                }
            } else {
                textMatRef.current.opacity = 0;
            }
        }
    });

    const SW = 5, SH = 1.5;
    return (
        <group ref={groupRef}>
            {/* Poles */}
            <mesh position={[-SW / 2 - 0.15, -2.5, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 4, 8]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[SW / 2 + 0.15, -2.5, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 4, 8]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Top bar */}
            <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.06, 0.06, SW + 0.5, 8]} />
                <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Screen */}
            <mesh position={[0, -1.2, 0]}>
                <boxGeometry args={[SW, SH, 0.12]} />
                <meshStandardMaterial ref={screenRef} color="#0a0a12"
                    emissive="#00aacc" emissiveIntensity={0} metalness={0.5} roughness={0.4} />
            </mesh>
            {/* LOOFIX text plane */}
            <mesh ref={textRef} position={[0, -1.2, 0.08]}>
                <planeGeometry args={[SW * 0.9, SH * 0.85]} />
                <meshBasicMaterial ref={textMatRef} map={loofixTex}
                    transparent opacity={0} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   Scene 3: LED Wave Grid
   Mesmerizing ripple of LED pixel cubes — like a display test
   ═══════════════════════════════════════════════════════ */
export function WaveGridScene() {
    const meshRef = useRef();
    const groupRef = useRef();
    const COLS = 16, ROWS = 10;
    const count = COLS * ROWS;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    useEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < count; i++) {
            tempColor.setHSL(0.7, 0.5, 0.3);
            meshRef.current.setColorAt(i, tempColor);
        }
        meshRef.current.instanceColor.needsUpdate = true;
    }, []);

    useFrame(({ clock }) => {
        const st = getSceneState(clock.getElapsedTime(), 2);
        if (!groupRef.current) return;
        if (!st) { groupRef.current.visible = false; return; }
        groupRef.current.visible = true;
        groupRef.current.scale.setScalar(st.fade);

        const mesh = meshRef.current;
        if (!mesh) return;
        const { t } = st;

        let idx = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = (c - (COLS - 1) / 2) * 0.55;
                const z = (r - (ROWS - 1) / 2) * 0.55;
                const w1 = Math.sin(x * 0.8 + t * 2) * 0.5;
                const w2 = Math.sin(z * 0.6 + t * 1.5 + 1) * 0.3;
                const w3 = Math.sin((x + z) * 0.4 + t * 1.2) * 0.2;
                const y = w1 + w2 + w3;

                dummy.position.set(x, y, z);
                dummy.scale.setScalar(0.4);
                dummy.updateMatrix();
                mesh.setMatrixAt(idx, dummy.matrix);

                const hue = (0.7 + y * 0.12 + t * 0.05) % 1;
                tempColor.setHSL(hue, 0.85, 0.35 + y * 0.15);
                mesh.setColorAt(idx, tempColor);
                idx++;
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor.needsUpdate = true;
    });

    return (
        <group ref={groupRef} rotation={[0.5, 0.4, 0]}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
                <boxGeometry args={[0.4, 0.4, 0.12]} />
                <meshStandardMaterial metalness={0.6} roughness={0.3} />
            </instancedMesh>
        </group>
    );
}

/* ─── Background Particles (always visible) ──────────── */
export function BackgroundParticles() {
    const ref = useRef();
    const count = 150;
    const positions = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 30;
            p[i * 3 + 1] = (Math.random() - 0.5) * 20;
            p[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
        }
        return p;
    }, []);

    useFrame(({ clock }) => {
        if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.01;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.04} color="#7c3aed" transparent opacity={0.4}
                sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
}
