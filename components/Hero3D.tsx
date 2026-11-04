/* eslint-disable react-hooks/immutability -- three.js geometry buffers and objects are mutated by design */
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// Simplified outline of mainland Tanzania as [lon, lat].
const OUTLINE: [number, number][] = [
  [30.5, -1.05], [33.9, -1.0], [34.1, -1.0], [37.6, -3.4], [37.8, -3.2], [39.2, -4.7], [39.3, -5.9], [39.3, -6.9],
  [39.5, -8.0], [39.4, -9.5], [40.4, -10.4], [39.2, -10.9], [37.5, -11.6], [35.8, -11.5], [34.7, -11.6], [34.6, -9.9],
  [33.9, -9.7], [32.9, -9.2], [31.2, -8.6], [30.4, -7.0], [29.6, -6.0], [29.4, -4.5], [30.3, -2.6],
];

const K = 0.5;
const toXY = (lon: number, lat: number): [number, number] => [(lon - 35) * K, (lat + 6.2) * K];

function inside(x: number, y: number, poly: [number, number][]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function TanzaniaCloud({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const pts = useRef<THREE.Points>(null);
  const hq = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const moved = useRef(false);
  useEffect(() => {
    const on = () => { moved.current = true; };
    window.addEventListener("pointermove", on, { once: true });
    return () => window.removeEventListener("pointermove", on);
  }, []);

  const { base, geo, ecg } = useMemo(() => {
    const poly = OUTLINE.map(([lo, la]) => toXY(lo, la));
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const arr: number[] = [];
    while (arr.length < 3 * 2600) {
      const x = x0 + r() * (x1 - x0);
      const y = y0 + r() * (y1 - y0);
      if (inside(x, y, poly)) arr.push(x, y, (r() - 0.5) * 0.9);
    }
    const base = new Float32Array(arr);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));

    const line = new THREE.Line(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(160 * 3), 3)),
      new THREE.LineBasicMaterial({ color: "#e8141b", transparent: true, opacity: 0.85 }),
    );
    return { base, geo: g, ecg: line };
  }, []);

  const [hqX, hqY] = toXY(39.28, -6.8);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { pointer } = state;
    const g = group.current;
    if (g) {
      const px = moved.current ? pointer.x : Math.sin(t * 0.4) * 0.5;
      const py = moved.current ? pointer.y : 0;
      g.rotation.y += (px * 0.45 - g.rotation.y) * 0.05;
      g.rotation.x += (-py * 0.25 + Math.sin(t * 0.5) * 0.04 - g.rotation.x) * 0.05;
    }
    // Cursor in the z=0 plane (camera z=9.5, fov 40)
    const halfH = Math.tan((40 * Math.PI) / 360) * 9.5;
    const cx = moved.current ? pointer.x * halfH * state.viewport.aspect : 99;
    const cy = moved.current ? pointer.y * halfH : 99;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const a = pos.array as Float32Array;
    for (let i = 0; i < a.length; i += 3) {
      const bx = base[i], by = base[i + 1], bz = base[i + 2];
      const dx = bx - cx, dy = by - cy;
      const d = Math.hypot(dx, dy);
      const f = d < 1.3 ? (1.3 - d) / 1.3 : 0;
      const wave = Math.sin(t * 1.2 + bx * 1.4 + by) * 0.05;
      a[i] += (bx + (dx / (d || 1)) * f * 0.7 - a[i]) * 0.12;
      a[i + 1] += (by + (dy / (d || 1)) * f * 0.7 - a[i + 1]) * 0.12;
      a[i + 2] += (bz + f * 1.4 + wave - a[i + 2]) * 0.12;
    }
    pos.needsUpdate = true;

    // ECG trace sweeping across the lower third
    const ep = ecg.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 160; i++) {
      const x = -3.4 + (i / 159) * 6.8;
      const ph = (((x + t * 2.2) % 4.4) + 4.4) % 4.4;
      let y = 0;
      if (ph > 1.0 && ph < 1.15) y = (ph - 1.0) * 5;
      else if (ph >= 1.15 && ph < 1.3) y = 0.75 - (ph - 1.15) * 11;
      else if (ph >= 1.3 && ph < 1.45) y = -0.9 + (ph - 1.3) * 6;
      ep.setXYZ(i, x, -2.9 + y * 0.45, -0.5);
    }
    ep.needsUpdate = true;

    if (hq.current) hq.current.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
    if (ring.current) {
      const k = (t % 2) / 2;
      ring.current.scale.setScalar(0.4 + k * 2.2);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.6;
    }
  });

  return (
    <>
      <group ref={group} position={[0, 0.25, 0]}>
        <points ref={pts} geometry={geo}>
          <pointsMaterial color={color} size={0.07} sizeAttenuation transparent opacity={0.95} depthWrite={false} />
        </points>
        <mesh ref={hq} position={[hqX, hqY, 0.1]}>
          <sphereGeometry args={[0.1, 24, 24]} />
          <meshBasicMaterial color="#e8141b" />
        </mesh>
        <mesh ref={ring} position={[hqX, hqY, 0.1]}>
          <ringGeometry args={[0.14, 0.17, 48]} />
          <meshBasicMaterial color="#e8141b" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <primitive object={ecg} />
    </>
  );
}

export default function Hero3D({ color = "#127bc0" }: { color?: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 9.5], fov: 40 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }} style={{ touchAction: "pan-y" }}>
      <TanzaniaCloud color={color} />
    </Canvas>
  );
}
