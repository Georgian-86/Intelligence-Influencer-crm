"use client";

/**
 * Hero WebGL object: a glossy cobalt planet wrapped in ice/lilac orbit rings, with a V-rocket
 * (the logo's right stroke) circling it and leaving a flame→lilac trail. Lit top-left, mint and
 * lilac rim lights from behind. Loaded only through components/three/hero-3d.tsx (ssr:false).
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const COBALT = "#2B4BFF";
const ICE = "#DCE5FF";
const MINT = "#7CF3D6";
const LILAC = "#C3B5FF";
const FLAME = "#FF6B4A";
const RING_R = 2.05;
const TRAIL = 28;

function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
}

function Rocket() {
  const geo = useMemo(() => {
    const pts = [
      [0.0, -0.36], [0.1, -0.34], [0.15, -0.22], [0.165, 0.0], [0.15, 0.22], [0.11, 0.38], [0.05, 0.5], [0.0, 0.55],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  return (
    <group scale={0.62}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#5E78FF" roughness={0.16} metalness={0.15} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh position={[0, 0.18, 0.14]}>
        <sphereGeometry args={[0.05, 24, 24]} />
        <meshPhysicalMaterial color={ICE} roughness={0.05} clearcoat={1} emissive={ICE} emissiveIntensity={0.35} />
      </mesh>
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((r) => (
        <mesh key={r} rotation={[0, r, 0]} position={[0, -0.24, 0]}>
          <boxGeometry args={[0.36, 0.2, 0.025]} />
          <meshPhysicalMaterial color="#1C2F8F" roughness={0.3} clearcoat={0.6} />
        </mesh>
      ))}
      <mesh position={[0, -0.42, 0]}>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshBasicMaterial color={FLAME} />
      </mesh>
    </group>
  );
}

function Orbit({ onReady }: { onReady?: () => void }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const planet = useRef<THREE.Mesh>(null);
  const rocket = useRef<THREE.Group>(null);
  const sats = useRef<THREE.Group>(null);
  const trail = useRef<THREE.InstancedMesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  // Drag-to-spin with inertia, hover glow and click-to-boost.
  const drag = useRef({ down: false, x: 0, y: 0, vx: 0, vy: 0, rotX: 0, rotY: 0 });
  const hover = useRef(false);
  const boost = useRef(0);
  const orbitAngle = useRef(0);
  const ready = useRef(false);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const on = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      const d = drag.current;
      if (!d.down) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      d.x = e.clientX; d.y = e.clientY;
      d.vy = dx * 0.012; d.vx = dy * 0.012;
      d.rotY += d.vy; d.rotX = Math.max(-1.1, Math.min(1.1, d.rotX + d.vx));
    };
    const down = (e: PointerEvent) => {
      const d = drag.current;
      d.down = true; d.x = e.clientX; d.y = e.clientY; d.vx = 0; d.vy = 0;
      el.setPointerCapture?.(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const up = (e: PointerEvent) => {
      drag.current.down = false;
      el.releasePointerCapture?.(e.pointerId);
      el.style.cursor = hover.current ? "pointer" : "grab";
    };
    el.style.cursor = "grab";
    el.style.touchAction = "pan-y";
    window.addEventListener("pointermove", on, { passive: true });
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", on);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useEffect(() => {
    const m = trail.current;
    if (!m) return;
    const a = new THREE.Color(FLAME), b = new THREE.Color(LILAC), c = new THREE.Color();
    for (let i = 0; i < TRAIL; i++) m.setColorAt(i, c.copy(a).lerp(b, i / TRAIL));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const k = Math.min(1, dt * 2.2);
    const g = root.current;
    if (g) {
      // Parallax toward the pointer.
      g.rotation.y += (pointer.current.x * 0.5 - g.rotation.y) * k;
      g.rotation.x += (pointer.current.y * 0.32 - g.rotation.x) * k;
      g.position.y = Math.sin(t * 0.6) * 0.09;
    }
    const d = drag.current;
    if (!d.down) {
      // Inertia after a flick, settling back to a gentle idle spin.
      d.vy *= Math.pow(0.04, dt); d.vx *= Math.pow(0.04, dt);
      d.rotY += d.vy + dt * 0.12;
      d.rotX += d.vx; d.rotX += (0 - d.rotX) * Math.min(1, dt * 0.8);
    }
    if (spin.current) { spin.current.rotation.y = d.rotY; spin.current.rotation.x = d.rotX; }
    if (planet.current) {
      const target = hover.current ? 1.07 : 1;
      const s = planet.current.scale.x + (target - planet.current.scale.x) * Math.min(1, dt * 8);
      planet.current.scale.setScalar(s);
      const m = planet.current.material as THREE.MeshPhysicalMaterial;
      m.emissiveIntensity += ((hover.current ? 0.28 : 0) + boost.current * 0.5 - m.emissiveIntensity) * Math.min(1, dt * 6);
    }
    boost.current = Math.max(0, boost.current - dt * 0.7);
    orbitAngle.current += dt * (0.42 + boost.current * 3.2);
    const a = orbitAngle.current;
    if (rocket.current) {
      rocket.current.position.set(Math.cos(a) * RING_R, Math.sin(a) * RING_R, 0);
      rocket.current.rotation.set(0, 0, a);
    }
    if (trail.current) {
      for (let i = 0; i < TRAIL; i++) {
        const ka = a - 0.11 - i * (0.034 + boost.current * 0.03);
        const s = (1 - i / TRAIL) * (0.07 + boost.current * 0.04);
        tmp.position.set(Math.cos(ka) * RING_R, Math.sin(ka) * RING_R, 0);
        tmp.scale.setScalar(s);
        tmp.updateMatrix();
        trail.current.setMatrixAt(i, tmp.matrix);
      }
      trail.current.instanceMatrix.needsUpdate = true;
    }
    if (sats.current) sats.current.rotation.z -= dt * (0.18 + boost.current * 1.2);
    if (!ready.current) { ready.current = true; onReady?.(); }
  });

  return (
    <group ref={root}>
      <group ref={spin}>
        {/* planet: hover to glow, click or tap to boost the rocket */}
        <mesh
          ref={planet}
          onPointerOver={() => { hover.current = true; if (!drag.current.down) gl.domElement.style.cursor = "pointer"; }}
          onPointerOut={() => { hover.current = false; if (!drag.current.down) gl.domElement.style.cursor = "grab"; }}
          onClick={(e) => { if (e.delta < 6) boost.current = 1; }}
        >
          <sphereGeometry args={[1.22, 96, 96]} />
          <meshPhysicalMaterial color={COBALT} emissive={COBALT} emissiveIntensity={0} roughness={0.14} metalness={0.08} clearcoat={1} clearcoatRoughness={0.06} sheen={0.6} sheenColor={LILAC} />
        </mesh>

        {/* main orbit plane: ring + rocket + trail */}
        <group rotation={[1.15, 0.18, -0.42]}>
          <mesh>
            <torusGeometry args={[RING_R, 0.028, 24, 220]} />
            <meshPhysicalMaterial color={ICE} roughness={0.12} metalness={0.6} clearcoat={1} />
          </mesh>
          <group ref={rocket}><Rocket /></group>
          <instancedMesh ref={trail} args={[undefined, undefined, TRAIL]}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial transparent opacity={0.9} toneMapped={false} />
          </instancedMesh>
        </group>

        {/* secondary ring with satellites */}
        <group rotation={[1.45, -0.5, 0.3]}>
          <mesh>
            <torusGeometry args={[2.7, 0.012, 16, 240]} />
            <meshBasicMaterial color={LILAC} transparent opacity={0.55} />
          </mesh>
          <group ref={sats}>
            <mesh position={[2.7, 0, 0]}>
              <sphereGeometry args={[0.26, 48, 48]} />
              <meshPhysicalMaterial color={ICE} roughness={0.05} transmission={0.6} thickness={0.6} clearcoat={1} ior={1.4} />
            </mesh>
            <mesh position={[-1.9, 1.92, 0]}>
              <sphereGeometry args={[0.15, 40, 40]} />
              <meshPhysicalMaterial color={MINT} roughness={0.12} clearcoat={1} />
            </mesh>
            <mesh position={[-0.6, -2.63, 0]}>
              <sphereGeometry args={[0.1, 32, 32]} />
              <meshPhysicalMaterial color={LILAC} roughness={0.12} clearcoat={1} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function HeroScene({ active, onReady }: { active: boolean; onReady?: () => void }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7.4], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
      aria-hidden
    >
      <Env />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 5, 5]} intensity={2.4} color="#ffffff" />
      <pointLight position={[3.6, -1.2, -2.5]} intensity={38} color={MINT} distance={12} />
      <pointLight position={[-3.8, -2.4, -1.8]} intensity={34} color={LILAC} distance={12} />
      <Orbit onReady={onReady} />
    </Canvas>
  );
}
