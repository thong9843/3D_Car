import { Component, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type {
  Car,
  CarBody,
  Hotspot,
  LeatherColor,
  LightsState,
  OpenableKey,
  OpenablesState,
  PaintOption,
  ViewMode,
  WheelStyle,
} from '../../types/automotive';
import { useComponentHover } from '../../hooks/useComponentHover';

/* ---------------------------------------------------------------- */
/* Hình học thân xe sinh theo thông số từng dòng xe                  */
/* ---------------------------------------------------------------- */

function buildLowerBody(b: CarBody): THREE.BufferGeometry {
  const L = b.length / 2;
  const g = b.ground;
  const R = b.wheelR;
  const ar = R + 0.07; // bán kính vòm bánh
  const a0 = Math.asin((g - R) / ar);
  const floorY = 0.32;
  const sh = new THREE.Shape();
  const arch = (cx: number) => {
    sh.lineTo(cx + ar * Math.cos(a0), g);
    sh.absarc(cx, R, ar, a0, Math.PI - a0, false);
  };
  sh.moveTo(L, g);
  arch(b.axleF);
  arch(b.axleR);
  sh.lineTo(-L, g);
  sh.lineTo(-L, b.belt - 0.14);
  sh.quadraticCurveTo(-L, b.belt, -L + 0.22, b.belt);
  sh.lineTo(b.trunkEnd, b.belt);
  // Khoang cabin lõm xuống sàn để thấy nội thất
  sh.lineTo(b.trunkEnd, floorY);
  sh.lineTo(b.hoodStart, floorY);
  sh.lineTo(b.hoodStart, b.belt);
  sh.lineTo(b.hoodStart + 0.3, b.belt - 0.06);
  sh.lineTo(L - 0.35, b.belt - 0.1);
  sh.quadraticCurveTo(L, b.belt - 0.12, L, b.noseH);
  sh.lineTo(L, g);
  const bt = 0.15;
  const depth = b.width - bt * 2;
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.07, bevelSegments: 8, curveSegments: 28,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildGreenhouse(b: CarBody): THREE.BufferGeometry {
  const sh = new THREE.Shape();
  const y0 = b.belt - 0.02;
  sh.moveTo(b.trunkEnd, y0);
  sh.bezierCurveTo(b.trunkEnd + 0.4, b.belt + 0.05, b.roofRear - 0.35, b.roofH, b.roofRear, b.roofH);
  sh.lineTo(b.roofFront, b.roofH);
  sh.bezierCurveTo(b.roofFront + 0.45, b.roofH, b.hoodStart - 0.5, b.belt + 0.04, b.hoodStart, y0);
  sh.lineTo(b.trunkEnd, y0);
  const bt = 0.06;
  const depth = b.width * 0.8 - bt * 2;
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.03, bevelSegments: 5, curveSegments: 32,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

/* ---------------------------------------------------------------- */
/* Vật liệu                                                          */
/* ---------------------------------------------------------------- */

function makePaintMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0.9,
    roughness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.4,
    transparent: true,
  });
}

function applyPaint(m: THREE.MeshPhysicalMaterial, p: PaintOption) {
  m.color.set(p.hex);
  m.clearcoat = 1.0;
  m.clearcoatRoughness = 0.05;
  if (p.finish === 'metallic') {
    m.metalness = 0.92; m.roughness = 0.3; m.iridescence = 0; m.sheen = 0;
  } else if (p.finish === 'pearl') {
    m.metalness = 0.75; m.roughness = 0.25; m.iridescence = 0.55; m.iridescenceIOR = 1.6; m.sheen = 0.6;
    m.sheenColor.set('#ffffff');
  } else {
    m.metalness = 0.25; m.roughness = 0.38; m.iridescence = 0; m.sheen = 0;
  }
  m.needsUpdate = true;
}

export const LEATHER_PALETTE: Record<LeatherColor, { primary: string; secondary: string }> = {
  black: { primary: '#17171b', secondary: '#24252b' },
  cognac: { primary: '#8b4513', secondary: '#6e350e' },
  cream: { primary: '#e6dcc8', secondary: '#cfc2aa' },
};

const NEON = '#22d3ee';
const mats = {
  glass: new THREE.MeshPhysicalMaterial({
    color: '#0a1520', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.38,
    envMapIntensity: 2, clearcoat: 1, clearcoatRoughness: 0, depthWrite: false,
  }),
  tire: new THREE.MeshStandardMaterial({ color: '#0e0e10', roughness: 0.85, metalness: 0.05 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#d7dbe0', metalness: 1, roughness: 0.15 }),
  darkChrome: new THREE.MeshStandardMaterial({ color: '#2b2f36', metalness: 0.9, roughness: 0.22 }),
  bronze: new THREE.MeshStandardMaterial({ color: '#8a6d3b', metalness: 0.85, roughness: 0.32 }),
  caliperRed: new THREE.MeshStandardMaterial({ color: '#dc2626', metalness: 0.5, roughness: 0.3 }),
  disc: new THREE.MeshStandardMaterial({ color: '#5b5f66', metalness: 0.9, roughness: 0.4 }),
  trim: new THREE.MeshStandardMaterial({ color: '#08090b', metalness: 0.5, roughness: 0.35 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e8f4ff', emissiveIntensity: 2.2, toneMapped: false }),
  drl: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#38bdf8', emissiveIntensity: 2.0, toneMapped: false }),
  hazard: new THREE.MeshStandardMaterial({ color: '#fb923c', emissive: '#ff8800', emissiveIntensity: 0, toneMapped: false }),
  tail: new THREE.MeshStandardMaterial({ color: '#7a0000', emissive: '#ff1a1a', emissiveIntensity: 2, toneMapped: false }),
  leather: new THREE.MeshStandardMaterial({ color: '#17171b', roughness: 0.55, metalness: 0.05 }),
  tan: new THREE.MeshStandardMaterial({ color: '#7a5a3c', roughness: 0.6 }),
  carpet: new THREE.MeshStandardMaterial({ color: '#0c0c0e', roughness: 1 }),
  screen: new THREE.MeshStandardMaterial({ color: '#04202a', emissive: NEON, emissiveIntensity: 1.1, toneMapped: false }),
  metal: new THREE.MeshStandardMaterial({ color: '#2d3139', metalness: 0.9, roughness: 0.35 }),
  steel: new THREE.MeshStandardMaterial({ color: '#9aa1ab', metalness: 1, roughness: 0.3 }),
  cyan: new THREE.MeshStandardMaterial({ color: '#06323c', emissive: NEON, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3, toneMapped: false }),
  orange: new THREE.MeshStandardMaterial({ color: '#4a2000', emissive: '#fb923c', emissiveIntensity: 0.9, toneMapped: false }),
  indigo: new THREE.MeshStandardMaterial({ color: '#16164a', emissive: '#818cf8', emissiveIntensity: 0.9, toneMapped: false }),
  spring: new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#f97316', emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.4 }),
};

/* ---------------------------------------------------------------- */
/* Thành phần phụ (Bánh xe 3 kiểu, Nội thất đổi màu da, Cơ khí)      */
/* ---------------------------------------------------------------- */

type Axis = 'x' | 'y' | 'z';
function Cyl({ pos, axis = 'y', r, len, mat, seg = 24 }: {
  pos: [number, number, number]; axis?: Axis; r: number; len: number; mat: THREE.Material; seg?: number;
}) {
  const rot: [number, number, number] = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return (
    <mesh position={pos} rotation={rot} material={mat}>
      <cylinderGeometry args={[r, r, len, seg]} />
    </mesh>
  );
}

function Wheel({ x, z, R, style }: { x: number; z: number; R: number; style: WheelStyle }) {
  const side = z > 0 ? 1 : -1;
  const spokeCount = style === 'executive' ? 10 : style === 'offroad' ? 6 : 5;
  const spokeWidth = style === 'executive' ? 0.025 : style === 'offroad' ? 0.068 : 0.042;
  const rimMat = style === 'sport' ? mats.darkChrome : style === 'offroad' ? mats.bronze : mats.chrome;
  return (
    <group position={[x, R, z]} userData={{ part: 'wheel' }}>
      <Cyl pos={[0, 0, 0]} axis="z" r={R} len={0.26} mat={mats.tire} seg={48} />
      <Cyl pos={[0, 0, side * 0.01]} axis="z" r={R * 0.72} len={0.27} mat={rimMat} seg={40} />
      <Cyl pos={[0, 0, side * 0.14]} axis="z" r={R * 0.25} len={0.035} mat={style === 'sport' ? mats.caliperRed : mats.trim} />
      {Array.from({ length: spokeCount }).map((_, i) => (
        <mesh key={i} position={[0, 0, side * 0.145]} rotation={[0, 0, (i * Math.PI) / spokeCount]} material={rimMat}>
          <boxGeometry args={[R * 1.38, spokeWidth, 0.024]} />
        </mesh>
      ))}
      {style === 'offroad' && (
        <mesh position={[0, 0, side * 0.142]} material={mats.trim}>
          <torusGeometry args={[R * 0.68, 0.022, 10, 28]} />
        </mesh>
      )}
      {style === 'sport' && (
        <mesh position={[R * 0.35, 0.05, side * 0.06]} material={mats.caliperRed}>
          <boxGeometry args={[0.12, 0.18, 0.08]} />
        </mesh>
      )}
      <Cyl pos={[0, 0, -side * 0.02]} axis="z" r={R * 0.5} len={0.04} mat={mats.disc} />
    </group>
  );
}

function Seat({ x, z, mat }: { x: number; z: number; mat: THREE.Material }) {
  return (
    <group position={[x, 0, z]} userData={{ part: 'seat' }}>
      <RoundedBox args={[0.55, 0.14, 0.5]} radius={0.05} position={[0, 0.6, 0]} material={mat} />
      <RoundedBox args={[0.14, 0.62, 0.5]} radius={0.05} position={[-0.22, 0.95, 0]} rotation={[0, 0, 0.15]} material={mat} />
      <RoundedBox args={[0.1, 0.18, 0.28]} radius={0.04} position={[-0.3, 1.33, 0]} rotation={[0, 0, 0.15]} material={mat} />
    </group>
  );
}

function Interior({ b, leatherMat, rearLeatherMat }: { b: CarBody; leatherMat: THREE.Material; rearLeatherMat: THREE.Material }) {
  const dashX = b.hoodStart - 0.15;
  const seatX = b.roofFront - 0.55 - (b.ladderFrame ? 0.05 : 0);
  const rearX = Math.max(seatX - 0.95, b.trunkEnd + 0.45);
  const len = b.hoodStart - b.trunkEnd - 0.1;
  return (
    <group>
      <mesh position={[(b.hoodStart + b.trunkEnd) / 2, 0.43, 0]} material={mats.carpet}>
        <boxGeometry args={[len, 0.04, b.width * 0.72]} />
      </mesh>
      <Seat x={seatX} z={-0.4} mat={leatherMat} />
      <Seat x={seatX} z={0.4} mat={leatherMat} />
      <Seat x={rearX} z={-0.42} mat={rearLeatherMat} />
      <Seat x={rearX} z={0} mat={rearLeatherMat} />
      <Seat x={rearX} z={0.42} mat={rearLeatherMat} />
      <RoundedBox args={[0.5, 0.2, b.width * 0.74]} radius={0.06} position={[dashX, b.belt - 0.13, 0]} material={leatherMat} />
      <mesh position={[dashX - 0.26, b.belt + 0.06, 0]} material={mats.screen} userData={{ part: 'screen' }}>
        <boxGeometry args={[0.03, 0.2, 0.5]} />
      </mesh>
      <group position={[dashX - 0.46, b.belt - 0.02, -0.4]} rotation={[0, 0, 0.35]} userData={{ part: 'steering' }}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={leatherMat}>
          <torusGeometry args={[0.17, 0.022, 16, 40]} />
        </mesh>
        <Cyl pos={[0.1, 0, 0]} axis="x" r={0.02} len={0.2} mat={mats.metal} />
      </group>
      <mesh position={[dashX - 0.3, b.belt - 0.12, 0]} material={mats.trim}>
        <boxGeometry args={[0.08, 0.04, b.width * 0.6]} />
      </mesh>
    </group>
  );
}

function Spring({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]} userData={{ part: 'suspension' }}>
      <Cyl pos={[0, 0, 0]} r={0.035} len={0.5} mat={mats.steel} seg={12} />
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, -0.18 + i * 0.07, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.spring}>
          <torusGeometry args={[0.085, 0.013, 8, 24]} />
        </mesh>
      ))}
    </group>
  );
}

function Internals({ b }: { b: CarBody }) {
  const mid = (b.axleF + b.axleR) / 2;
  const wb = b.axleF - b.axleR;
  const half = b.width / 2 - 0.4;
  const R = b.wheelR;
  const ice = b.layout !== 'ev';
  const drive = b.layout === 'ice-awd' || b.layout === 'ice-4wd';
  const ex = b.axleF - 0.3;
  return (
    <group userData={{ part: 'powertrain' }}>
      {[b.axleF, b.axleR].map((ax) => (
        <group key={ax}>
          <Cyl pos={[ax, R, 0]} axis="z" r={0.035} len={b.width - 0.5} mat={mats.steel} seg={12} />
          <Spring x={ax} y={R + 0.28} z={half} />
          <Spring x={ax} y={R + 0.28} z={-half} />
        </group>
      ))}
      {b.ladderFrame && (
        <group>
          {[-0.45, 0.45].map((z) => (
            <mesh key={z} position={[0.05, 0.42, z]} material={mats.orange}>
              <boxGeometry args={[b.length - 0.7, 0.1, 0.08]} />
            </mesh>
          ))}
          {[-1.6, -0.6, 0.4, 1.4].map((x) => (
            <mesh key={x} position={[x, 0.42, 0]} material={mats.orange}>
              <boxGeometry args={[0.06, 0.07, 0.95]} />
            </mesh>
          ))}
        </group>
      )}
      {!ice && (
        <group>
          <mesh position={[mid, 0.34, 0]} material={mats.cyan}>
            <boxGeometry args={[wb - 0.5, 0.14, b.width * 0.58]} />
          </mesh>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[mid - (wb - 0.5) / 2 + 0.2 + i * ((wb - 0.9) / 5), 0.42, 0]} material={mats.metal}>
              <boxGeometry args={[0.05, 0.03, b.width * 0.58]} />
            </mesh>
          ))}
          <Cyl pos={[b.axleF, R, 0]} axis="z" r={0.16} len={0.5} mat={mats.indigo} />
          <Cyl pos={[b.axleR, R, 0]} axis="z" r={0.16} len={0.5} mat={mats.indigo} />
          <mesh position={[b.axleF - 0.6, 0.5, 0]} material={mats.orange}>
            <boxGeometry args={[0.3, 0.15, 0.3]} />
          </mesh>
        </group>
      )}
      {ice && (
        <group>
          <mesh position={[ex, 0.62, 0]} material={mats.metal}>
            <boxGeometry args={[0.65, 0.45, 0.6]} />
          </mesh>
          <mesh position={[ex, 0.93, 0]} material={mats.cyan}>
            <boxGeometry args={[0.6, 0.16, 0.58]} />
          </mesh>
          {[-0.21, -0.07, 0.07, 0.21].map((z) => (
            <Cyl key={z} pos={[ex + 0.12, 1.1, z]} r={0.045} len={0.22} mat={mats.orange} seg={12} />
          ))}
          <Cyl pos={[ex - 1.0 + 0.3, 0.6, 0]} axis="x" r={0.17} len={0.75} mat={mats.indigo} />
          {drive && (
            <>
              <Cyl pos={[(b.axleF - 1.38 + b.axleR) / 2, 0.45, 0]} axis="x" r={0.05} len={b.axleF - 1.38 - b.axleR} mat={mats.steel} />
              <mesh position={[b.axleR, R, 0]} scale={[1, 0.8, 1]} material={mats.indigo}>
                <sphereGeometry args={[0.2, 24, 16]} />
              </mesh>
            </>
          )}
          <Cyl pos={[(ex + b.axleR - 0.4) / 2, 0.3, 0.28]} axis="x" r={0.04} len={ex - b.axleR + 0.4} mat={mats.steel} />
          <Cyl pos={[b.axleR - 0.3, 0.32, 0.28]} axis="x" r={0.1} len={0.6} mat={mats.steel} />
          <mesh position={[b.axleR + 0.5, 0.42, -0.15]} material={mats.metal}>
            <boxGeometry args={[0.8, 0.2, 0.6]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Mô hình xe (có Đèn pha/DRL/Hazard, Mở Cửa/Ca-pô/Cốp, Rung máy)   */
/* ---------------------------------------------------------------- */

interface Props {
  car: Car;
  paint: PaintOption;
  mode: ViewMode;
  wheelStyle: WheelStyle;
  leatherColor: LeatherColor;
  lights: LightsState;
  openables: OpenablesState;
  engineRevving: boolean;
  onToggleOpenable?: (key: OpenableKey) => void;
}

const LIFT = 1.2; // ΔY khi bóc tách (mét)
const noRaycast: THREE.Object3D['raycast'] = () => undefined;

function ProceduralVehicle({
  car,
  paint,
  mode,
  wheelStyle,
  leatherColor,
  lights,
  openables,
  engineRevving,
  onToggleOpenable,
}: Props) {
  const b = car.body;
  const rootVibRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const internalsRef = useRef<THREE.Group>(null);
  const roofRef = useRef<THREE.Group>(null);
  const doorFLRef = useRef<THREE.Group>(null);
  const doorFRRef = useRef<THREE.Group>(null);
  const doorRLRef = useRef<THREE.Group>(null);
  const doorRRRef = useRef<THREE.Group>(null);
  const hoodRef = useRef<THREE.Group>(null);
  const trunkRef = useRef<THREE.Group>(null);

  const xr = useRef(0);
  const ic = useRef(0);
  const doorProgress = useRef(0);
  const hoodProgress = useRef(0);
  const trunkProgress = useRef(0);

  const lowerGeo = useMemo(() => buildLowerBody(b), [b]);
  const glassGeo = useMemo(() => buildGreenhouse(b), [b]);
  const lowerEdges = useMemo(() => new THREE.EdgesGeometry(lowerGeo, 22), [lowerGeo]);
  const glassEdges = useMemo(() => new THREE.EdgesGeometry(glassGeo, 22), [glassGeo]);
  const paintMat = useMemo(makePaintMaterial, []);
  const roofMat = useMemo(makePaintMaterial, []);
  const glassMat = useMemo(() => mats.glass.clone(), []);
  const lampMat = useMemo(() => mats.lamp.clone(), []);
  const drlMat = useMemo(() => mats.drl.clone(), []);
  const hazardMat = useMemo(() => mats.hazard.clone(), []);
  const tailMat = useMemo(() => mats.tail.clone(), []);
  const leatherMat = useMemo(() => mats.leather.clone(), []);
  const rearLeatherMat = useMemo(() => mats.tan.clone(), []);
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: NEON, transparent: true, opacity: 0, toneMapped: false }),
    [],
  );

  useEffect(() => {
    applyPaint(paintMat, paint);
    applyPaint(roofMat, paint);
  }, [paint, paintMat, roofMat]);

  useEffect(() => {
    const pal = LEATHER_PALETTE[leatherColor];
    leatherMat.color.set(pal.primary);
    rearLeatherMat.color.set(pal.secondary);
    leatherMat.needsUpdate = true;
    rearLeatherMat.needsUpdate = true;
  }, [leatherColor, leatherMat, rearLeatherMat]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-3.6 * Math.min(dt, 0.05));
    xr.current += ((mode === 'xray' ? 1 : 0) - xr.current) * k;
    ic.current += ((mode === 'interior' ? 1 : 0) - ic.current) * k;
    doorProgress.current += ((openables.doors ? 1 : 0) - doorProgress.current) * k;
    hoodProgress.current += ((openables.hood ? 1 : 0) - hoodProgress.current) * k;
    trunkProgress.current += ((openables.trunk ? 1 : 0) - trunkProgress.current) * k;

    const x = xr.current;
    const i = ic.current;
    const ease = x * x * (3 - 2 * x);

    if (bodyRef.current) bodyRef.current.position.y = ease * LIFT;
    // Khi mở nắp ca-pô hoặc ở X-Ray thì hiện khối động cơ/pin bên trong
    if (internalsRef.current) internalsRef.current.visible = x > 0.03 || hoodProgress.current > 0.05;
    if (roofRef.current) roofRef.current.visible = i < 0.5 && x < 0.5;

    // Hoạt ảnh mở 4 cánh cửa (xoay quanh bản lề phía trước mỗi cánh), nắp ca-pô và cốp sau
    const dAng = doorProgress.current * 0.92;
    if (doorFLRef.current) doorFLRef.current.rotation.y = -dAng;
    if (doorRLRef.current) doorRLRef.current.rotation.y = -dAng * 0.85;
    if (doorFRRef.current) doorFRRef.current.rotation.y = dAng;
    if (doorRRRef.current) doorRRRef.current.rotation.y = dAng * 0.85;
    if (hoodRef.current) hoodRef.current.rotation.z = hoodProgress.current * 0.68;
    if (trunkRef.current) trunkRef.current.rotation.z = -trunkProgress.current * 0.72;

    // Rung thân xe nhẹ khi đang rú ga thử động cơ
    if (rootVibRef.current) {
      if (engineRevving) {
        const t = state.clock.elapsedTime;
        rootVibRef.current.position.y = Math.sin(t * 58) * 0.006;
        rootVibRef.current.rotation.x = Math.sin(t * 42) * 0.004;
      } else {
        rootVibRef.current.position.y = 0;
        rootVibRef.current.rotation.x = 0;
      }
    }

    // Hiệu ứng đèn pha, DRL và đèn xin-nhan khẩn cấp (Hazards nhấp nháy ~1.8 Hz)
    lampMat.emissiveIntensity = lights.headlights ? 4.2 : 0.12;
    drlMat.emissiveIntensity = lights.drl ? 2.6 : 0.08;
    tailMat.emissiveIntensity = lights.headlights || lights.drl ? 2.6 : 0.5;
    const blink = lights.hazards ? (Math.sin(state.clock.elapsedTime * 11) > 0 ? 3.8 : 0.05) : 0;
    hazardMat.emissiveIntensity = blink;

    const solid = 1 - x * 0.94;
    paintMat.opacity = solid;
    paintMat.transparent = solid < 0.995;
    paintMat.depthWrite = x < 0.4;
    roofMat.opacity = solid * (1 - i);
    roofMat.transparent = true;
    glassMat.opacity = THREE.MathUtils.lerp(0.38, 0.14, i) * (1 - x * 0.85);
    edgeMat.opacity = x * 0.95;
  });

  const wz = b.width / 2 - 0.2;
  const cabinLen = b.hoodStart - b.trunkEnd;
  const doorLen = (cabinLen - 0.16) / 2;
  const doorH = b.belt - 0.3;
  const doorY = (b.belt + 0.3) / 2;
  const frontHingeX = b.hoodStart - 0.06;
  const rearHingeX = (b.hoodStart + b.trunkEnd) / 2 - 0.02;
  const hoodLen = b.length / 2 - b.hoodStart - 0.12;
  const trunkLen = Math.max(0.42, b.trunkEnd - (-b.length / 2) - 0.14);
  const roofLen = b.roofFront - b.roofRear + 0.1;

  return (
    <group ref={rootVibRef}>
      {/* Phần vỏ nâng lên trong chế độ X-Ray */}
      <group ref={bodyRef}>
        <mesh geometry={lowerGeo} material={paintMat} castShadow receiveShadow />
        <lineSegments geometry={lowerEdges} material={edgeMat} raycast={noRaycast} />
        <mesh geometry={glassGeo} material={glassMat} renderOrder={2} raycast={noRaycast} />
        <lineSegments geometry={glassEdges} material={edgeMat} raycast={noRaycast} />

        {/* 4 Cánh cửa có bản lề xoay đóng/mở (click vào cửa cũng đóng/mở) */}
        {([-1, 1] as const).map((s) => {
          const zSide = s * (b.width / 2 - 0.04);
          const fRef = s < 0 ? doorFLRef : doorFRRef;
          const rRef = s < 0 ? doorRLRef : doorRRRef;
          return (
            <group key={s}>
              <group
                ref={fRef}
                position={[frontHingeX, doorY, zSide]}
                onClick={(e) => {
                  if (e.delta <= 4 && onToggleOpenable) {
                    e.stopPropagation();
                    onToggleOpenable('doors');
                  }
                }}
              >
                <RoundedBox
                  args={[doorLen, doorH, 0.11]}
                  radius={0.035}
                  position={[-doorLen / 2, 0, 0]}
                  material={paintMat}
                  castShadow
                />
                {/* Tay nắm cửa mạ chrome */}
                <mesh position={[-doorLen + 0.14, 0.06, s * 0.06]} material={mats.chrome}>
                  <boxGeometry args={[0.14, 0.025, 0.02]} />
                </mesh>
              </group>
              <group
                ref={rRef}
                position={[rearHingeX, doorY, zSide]}
                onClick={(e) => {
                  if (e.delta <= 4 && onToggleOpenable) {
                    e.stopPropagation();
                    onToggleOpenable('doors');
                  }
                }}
              >
                <RoundedBox
                  args={[doorLen, doorH, 0.11]}
                  radius={0.035}
                  position={[-doorLen / 2, 0, 0]}
                  material={paintMat}
                  castShadow
                />
                <mesh position={[-doorLen + 0.14, 0.06, s * 0.06]} material={mats.chrome}>
                  <boxGeometry args={[0.14, 0.025, 0.02]} />
                </mesh>
              </group>
            </group>
          );
        })}

        {/* Nắp ca-pô (Hood) có bản lề gần kính lái */}
        <group
          ref={hoodRef}
          position={[b.hoodStart + 0.05, b.belt - 0.02, 0]}
          onClick={(e) => {
            if (e.delta <= 4 && onToggleOpenable) {
              e.stopPropagation();
              onToggleOpenable('hood');
            }
          }}
        >
          <RoundedBox
            args={[hoodLen, 0.055, b.width * 0.82]}
            radius={0.022}
            position={[hoodLen / 2, -0.02, 0]}
            rotation={[0, 0, -0.05]}
            material={paintMat}
            castShadow
          />
        </group>

        {/* Nắp cốp sau (Trunk) */}
        <group
          ref={trunkRef}
          position={[b.trunkEnd - 0.04, b.belt + 0.01, 0]}
          onClick={(e) => {
            if (e.delta <= 4 && onToggleOpenable) {
              e.stopPropagation();
              onToggleOpenable('trunk');
            }
          }}
        >
          <RoundedBox
            args={[trunkLen, 0.055, b.width * 0.78]}
            radius={0.022}
            position={[-trunkLen / 2, -0.01, 0]}
            material={paintMat}
            castShadow
          />
        </group>

        <group ref={roofRef}>
          <RoundedBox
            args={[roofLen, 0.06, b.width * 0.76]}
            radius={0.025}
            smoothness={4}
            position={[(b.roofFront + b.roofRear) / 2, b.roofH + 0.015, 0]}
            material={roofMat}
            castShadow
          />
        </group>

        {/* Đèn pha Matrix LED + Dải DRL + Đèn xin-nhan Hazards + Chùm sáng SpotLight */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[b.length / 2 + 0.065, b.belt - 0.15, s * b.width * 0.34]} material={lampMat} userData={{ part: 'headlamp' }}>
              <boxGeometry args={[0.05, 0.09, 0.38]} />
            </mesh>
            {/* Dải đèn định vị ban ngày DRL chữ V/C */}
            <mesh position={[b.length / 2 + 0.072, b.belt - 0.09, s * b.width * 0.28]} material={drlMat} userData={{ part: 'headlamp' }}>
              <boxGeometry args={[0.04, 0.022, 0.48]} />
            </mesh>
            {/* Đèn báo rẽ / Hazard trước & sau */}
            <mesh position={[b.length / 2 + 0.07, b.belt - 0.22, s * b.width * 0.41]} material={hazardMat}>
              <boxGeometry args={[0.045, 0.032, 0.14]} />
            </mesh>
            <mesh position={[-b.length / 2 - 0.072, b.belt - 0.19, s * b.width * 0.39]} material={hazardMat}>
              <boxGeometry args={[0.045, 0.032, 0.16]} />
            </mesh>
          </group>
        ))}

        {/* Ánh sáng chiếu thực tế từ cụm đèn pha xuống mặt sàn khi bật Headlights */}
        {lights.headlights && (
          <>
            <pointLight position={[b.length / 2 + 0.45, b.belt - 0.1, b.width * 0.32]} intensity={18} distance={9} color="#e0f2fe" />
            <pointLight position={[b.length / 2 + 0.45, b.belt - 0.1, -b.width * 0.32]} intensity={18} distance={9} color="#e0f2fe" />
          </>
        )}

        <mesh position={[b.length / 2 + 0.07, b.belt - 0.28, 0]} material={mats.trim}>
          <boxGeometry args={[0.04, 0.17, b.width * 0.34]} />
        </mesh>
        <mesh position={[-b.length / 2 - 0.07, b.belt - 0.14, 0]} material={tailMat}>
          <boxGeometry args={[0.04, 0.07, b.width * 0.7]} />
        </mesh>
        <mesh position={[0, b.ground + 0.02, 0]} material={mats.trim}>
          <boxGeometry args={[b.length - 0.9, 0.04, b.width - 0.1]} />
        </mesh>
      </group>

      {/* Nội thất luôn hiện */}
      <Interior b={b} leatherMat={leatherMat} rearLeatherMat={rearLeatherMat} />

      {/* Cụm cơ khí hiện khi X-Ray hoặc khi mở nắp ca-pô */}
      <group ref={internalsRef} visible={false}>
        <Internals b={b} />
      </group>

      {/* 4 Bánh xe theo kiểu mâm được chọn */}
      <Wheel x={b.axleF} z={wz} R={b.wheelR} style={wheelStyle} />
      <Wheel x={b.axleF} z={-wz} R={b.wheelR} style={wheelStyle} />
      <Wheel x={b.axleR} z={wz} R={b.wheelR} style={wheelStyle} />
      <Wheel x={b.axleR} z={-wz} R={b.wheelR} style={wheelStyle} />
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Loader mô hình .glb (Draco) + cơ chế fallback                       */
/* ---------------------------------------------------------------- */

const DRACO_PATH: string =
  (import.meta.env.VITE_DRACO_PATH as string | undefined) ?? 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
useGLTF.setDecoderPath(DRACO_PATH);

let manifestPromise: Promise<Set<string>> | null = null;

function loadManifest(): Promise<Set<string>> {
  manifestPromise ??= fetch('/models/manifest.json')
    .then((r) => (r.ok && (r.headers.get('content-type') ?? '').includes('json') ? r.json() : { models: [] }))
    .then((j: { models?: unknown }) => new Set(Array.isArray(j.models) ? j.models.filter((m): m is string => typeof m === 'string') : []))
    .catch(() => new Set<string>());
  return manifestPromise;
}

function useGlbAvailable(carId: string): boolean | null {
  const [state, setState] = useState<{ id: string; ok: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    loadManifest().then((set) => { if (alive) setState({ id: carId, ok: set.has(carId) }); });
    return () => { alive = false; };
  }, [carId]);
  return state && state.id === carId ? state.ok : null;
}

class LoadBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn('[VehicleModel] Không nạp được .glb, dùng mô hình procedural.', err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const RE_GLASS = /glass|window|windshield|kinh/i;
const RE_PAINT = /body|paint|carpaint|exterior|shell|hood|door|fender|bumper|vo.?xe/i;
const RE_NOT_PAINT = /wheel|rim|tire|tyre|chrome|light|lamp|interior|seat|trim|rubber|brake/i;
const RE_LEATHER = /seat|leather|steer/i;
const RE_LAMP = /head.?lamp|head.?light|matrix/i;
const RE_TAIL = /tail/i;
const RE_WHEEL_HIDE = /wheel_assembly|wheel_tire|wheel_rim/i;
const RE_DOOR_HIDE = /door_left|door_right/i;

interface LiftItem { mesh: THREE.Mesh; base: THREE.Vector3; delta: THREE.Vector3 }
interface GlassItem { mat: THREE.Material; base: number }
interface Prepared {
  root: THREE.Object3D;
  lift: LiftItem[];
  glass: GlassItem[];
  leathers: THREE.MeshStandardMaterial[];
  lamps: THREE.MeshStandardMaterial[];
  tails: THREE.MeshStandardMaterial[];
}

function prepareScene(source: THREE.Object3D, b: CarBody, paintMat: THREE.Material): Prepared {
  const root = source.clone(true);
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (RE_WHEEL_HIDE.test(o.name) || RE_DOOR_HIDE.test(o.name)) o.visible = false;
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });

  const isGlass = (m: THREE.Material, mesh: THREE.Mesh) =>
    RE_GLASS.test(`${m.name} ${mesh.name}`) || (m as THREE.MeshPhysicalMaterial).transmission > 0;
  const isPaintByName = (m: THREE.Material, mesh: THREE.Mesh) =>
    RE_PAINT.test(`${m.name} ${mesh.name}`) && !RE_NOT_PAINT.test(`${m.name} ${mesh.name}`);

  const anyNamed = meshes.some((mesh) => {
    const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    return ms.some((m) => !isGlass(m, mesh) && isPaintByName(m, mesh));
  });
  const isPaint = (m: THREE.Material, mesh: THREE.Mesh) =>
    anyNamed ? isPaintByName(m, mesh) : (m as THREE.MeshStandardMaterial).metalness >= 0.6 && !RE_NOT_PAINT.test(`${m.name} ${mesh.name}`);

  const liftMeshes = new Set<THREE.Mesh>();
  const glass: GlassItem[] = [];
  const leathers: THREE.MeshStandardMaterial[] = [];
  const lamps: THREE.MeshStandardMaterial[] = [];
  const tails: THREE.MeshStandardMaterial[] = [];

  for (const mesh of meshes) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const swap = (m: THREE.Material): THREE.Material => {
      const tag = `${m.name} ${mesh.name}`;
      if (isGlass(m, mesh)) {
        const c = m.clone();
        c.transparent = true;
        glass.push({ mat: c, base: c.opacity });
        liftMeshes.add(mesh);
        return c;
      }
      if (RE_LAMP.test(tag)) {
        const c = (m as THREE.MeshStandardMaterial).clone();
        c.toneMapped = false;
        lamps.push(c);
        liftMeshes.add(mesh);
        return c;
      }
      if (RE_TAIL.test(tag)) {
        const c = (m as THREE.MeshStandardMaterial).clone();
        c.toneMapped = false;
        tails.push(c);
        liftMeshes.add(mesh);
        return c;
      }
      if (RE_LEATHER.test(tag)) {
        const c = (m as THREE.MeshStandardMaterial).clone();
        leathers.push(c);
        return c;
      }
      if (isPaint(m, mesh)) { liftMeshes.add(mesh); return paintMat; }
      return m;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
  }

  const raw = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  if (raw.z > raw.x) root.rotation.y = Math.PI / 2;
  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  root.scale.setScalar(b.length / Math.max(size.x, 1e-6));
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -box.min.y, -c.z);
  root.updateMatrixWorld(true);

  const lift: LiftItem[] = [];
  const origin = new THREE.Vector3();
  const up = new THREE.Vector3(0, LIFT, 0);
  for (const mesh of liftMeshes) {
    const parent = mesh.parent ?? root;
    const inv = parent.matrixWorld.clone().invert();
    const delta = up.clone().applyMatrix4(inv).sub(origin.clone().applyMatrix4(inv));
    lift.push({ mesh, base: mesh.position.clone(), delta });
  }
  return { root, lift, glass, leathers, lamps, tails };
}

function GlbVehicle({
  url,
  car,
  paint,
  mode,
  wheelStyle,
  leatherColor,
  lights,
  openables,
  engineRevving,
  onToggleOpenable,
}: Props & { url: string }) {
  const b = car.body;
  const { scene } = useGLTF(url, true);
  const paintMat = useMemo(makePaintMaterial, []);
  const drlMat = useMemo(() => mats.drl.clone(), []);
  const hazardMat = useMemo(() => mats.hazard.clone(), []);
  const prepared = useMemo(() => prepareScene(scene, b, paintMat), [scene, b, paintMat]);

  const rootVibRef = useRef<THREE.Group>(null);
  const extrasLiftRef = useRef<THREE.Group>(null);
  const doorFLRef = useRef<THREE.Group>(null);
  const doorFRRef = useRef<THREE.Group>(null);
  const doorRLRef = useRef<THREE.Group>(null);
  const doorRRRef = useRef<THREE.Group>(null);
  const hoodRef = useRef<THREE.Group>(null);
  const trunkRef = useRef<THREE.Group>(null);
  const xr = useRef(0);
  const doorProgress = useRef(0);
  const hoodProgress = useRef(0);
  const trunkProgress = useRef(0);

  useEffect(() => { applyPaint(paintMat as THREE.MeshPhysicalMaterial, paint); }, [paint, paintMat]);
  useEffect(() => {
    const pal = LEATHER_PALETTE[leatherColor];
    for (const m of prepared.leathers) {
      m.color.set(pal.primary);
      m.needsUpdate = true;
    }
  }, [leatherColor, prepared.leathers]);
  useEffect(() => () => paintMat.dispose(), [paintMat]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-3.6 * Math.min(dt, 0.05));
    xr.current += ((mode === 'xray' ? 1 : 0) - xr.current) * k;
    doorProgress.current += ((openables.doors ? 1 : 0) - doorProgress.current) * k;
    hoodProgress.current += ((openables.hood ? 1 : 0) - hoodProgress.current) * k;
    trunkProgress.current += ((openables.trunk ? 1 : 0) - trunkProgress.current) * k;

    const x = xr.current;
    const ease = x * x * (3 - 2 * x);
    for (const l of prepared.lift) l.mesh.position.copy(l.base).addScaledVector(l.delta, ease);
    if (extrasLiftRef.current) extrasLiftRef.current.position.y = ease * LIFT;

    const dAng = doorProgress.current * 0.92;
    if (doorFLRef.current) doorFLRef.current.rotation.y = -dAng;
    if (doorRLRef.current) doorRLRef.current.rotation.y = -dAng * 0.85;
    if (doorFRRef.current) doorFRRef.current.rotation.y = dAng;
    if (doorRRRef.current) doorRRRef.current.rotation.y = dAng * 0.85;
    if (hoodRef.current) hoodRef.current.rotation.z = hoodProgress.current * 0.68;
    if (trunkRef.current) trunkRef.current.rotation.z = -trunkProgress.current * 0.72;

    if (rootVibRef.current) {
      if (engineRevving) {
        const t = state.clock.elapsedTime;
        rootVibRef.current.position.y = Math.sin(t * 58) * 0.006;
        rootVibRef.current.rotation.x = Math.sin(t * 42) * 0.004;
      } else {
        rootVibRef.current.position.y = 0;
        rootVibRef.current.rotation.x = 0;
      }
    }

    for (const lm of prepared.lamps) lm.emissiveIntensity = lights.headlights ? 4.2 : 0.12;
    for (const tm of prepared.tails) tm.emissiveIntensity = lights.headlights || lights.drl ? 2.6 : 0.5;
    drlMat.emissiveIntensity = lights.drl ? 2.6 : 0.08;
    hazardMat.emissiveIntensity = lights.hazards ? (Math.sin(state.clock.elapsedTime * 11) > 0 ? 3.8 : 0.05) : 0;

    const solid = 1 - x * 0.94;
    paintMat.opacity = solid;
    paintMat.transparent = solid < 0.995;
    paintMat.depthWrite = x < 0.4;
    for (const g of prepared.glass) g.mat.opacity = g.base * (1 - x * 0.85);
  });

  const wz = b.width / 2 - 0.2;
  const cabinLen = b.hoodStart - b.trunkEnd;
  const doorLen = (cabinLen - 0.16) / 2;
  const doorH = b.belt - 0.3;
  const doorY = (b.belt + 0.3) / 2;
  const frontHingeX = b.hoodStart - 0.06;
  const rearHingeX = (b.hoodStart + b.trunkEnd) / 2 - 0.02;
  const hoodLen = b.length / 2 - b.hoodStart - 0.12;
  const trunkLen = Math.max(0.42, b.trunkEnd - (-b.length / 2) - 0.14);

  return (
    <group ref={rootVibRef}>
      <primitive object={prepared.root} />

      <group ref={extrasLiftRef}>
        {([-1, 1] as const).map((s) => {
          const zSide = s * (b.width / 2 - 0.04);
          const fRef = s < 0 ? doorFLRef : doorFRRef;
          const rRef = s < 0 ? doorRLRef : doorRRRef;
          return (
            <group key={s}>
              <group
                ref={fRef}
                position={[frontHingeX, doorY, zSide]}
                onClick={(e) => {
                  if (e.delta <= 4 && onToggleOpenable) { e.stopPropagation(); onToggleOpenable('doors'); }
                }}
              >
                <RoundedBox args={[doorLen, doorH, 0.11]} radius={0.035} position={[-doorLen / 2, 0, 0]} material={paintMat} castShadow />
                <mesh position={[-doorLen + 0.14, 0.06, s * 0.06]} material={mats.chrome}>
                  <boxGeometry args={[0.14, 0.025, 0.02]} />
                </mesh>
              </group>
              <group
                ref={rRef}
                position={[rearHingeX, doorY, zSide]}
                onClick={(e) => {
                  if (e.delta <= 4 && onToggleOpenable) { e.stopPropagation(); onToggleOpenable('doors'); }
                }}
              >
                <RoundedBox args={[doorLen, doorH, 0.11]} radius={0.035} position={[-doorLen / 2, 0, 0]} material={paintMat} castShadow />
                <mesh position={[-doorLen + 0.14, 0.06, s * 0.06]} material={mats.chrome}>
                  <boxGeometry args={[0.14, 0.025, 0.02]} />
                </mesh>
              </group>
              <mesh position={[b.length / 2 + 0.072, b.belt - 0.09, s * b.width * 0.28]} material={drlMat} userData={{ part: 'headlamp' }}>
                <boxGeometry args={[0.04, 0.022, 0.48]} />
              </mesh>
              <mesh position={[b.length / 2 + 0.07, b.belt - 0.22, s * b.width * 0.41]} material={hazardMat}>
                <boxGeometry args={[0.045, 0.032, 0.14]} />
              </mesh>
              <mesh position={[-b.length / 2 - 0.072, b.belt - 0.19, s * b.width * 0.39]} material={hazardMat}>
                <boxGeometry args={[0.045, 0.032, 0.16]} />
              </mesh>
            </group>
          );
        })}

        <group
          ref={hoodRef}
          position={[b.hoodStart + 0.05, b.belt - 0.02, 0]}
          onClick={(e) => {
            if (e.delta <= 4 && onToggleOpenable) { e.stopPropagation(); onToggleOpenable('hood'); }
          }}
        >
          <RoundedBox args={[hoodLen, 0.055, b.width * 0.82]} radius={0.022} position={[hoodLen / 2, -0.02, 0]} rotation={[0, 0, -0.05]} material={paintMat} castShadow />
        </group>

        <group
          ref={trunkRef}
          position={[b.trunkEnd - 0.04, b.belt + 0.01, 0]}
          onClick={(e) => {
            if (e.delta <= 4 && onToggleOpenable) { e.stopPropagation(); onToggleOpenable('trunk'); }
          }}
        >
          <RoundedBox args={[trunkLen, 0.055, b.width * 0.78]} radius={0.022} position={[-trunkLen / 2, -0.01, 0]} material={paintMat} castShadow />
        </group>

        {lights.headlights && (
          <>
            <pointLight position={[b.length / 2 + 0.45, b.belt - 0.1, b.width * 0.32]} intensity={18} distance={9} color="#e0f2fe" />
            <pointLight position={[b.length / 2 + 0.45, b.belt - 0.1, -b.width * 0.32]} intensity={18} distance={9} color="#e0f2fe" />
          </>
        )}
      </group>

      <Wheel x={b.axleF} z={wz} R={b.wheelR} style={wheelStyle} />
      <Wheel x={b.axleF} z={-wz} R={b.wheelR} style={wheelStyle} />
      <Wheel x={b.axleR} z={wz} R={b.wheelR} style={wheelStyle} />
      <Wheel x={b.axleR} z={-wz} R={b.wheelR} style={wheelStyle} />
    </group>
  );
}

/* ---------------------------------------------------------------- */
/* Component xuất ra: .glb nếu có, ngược lại procedural                */
/* ---------------------------------------------------------------- */

interface VehicleProps extends Props {
  onSelectHotspot?: (h: Hotspot) => void;
}

export default function VehicleModel(props: VehicleProps) {
  const { car, onSelectHotspot } = props;
  const url = `/models/${car.id}.glb`;
  const available = useGlbAvailable(car.id);
  const hover = useComponentHover(car, onSelectHotspot);
  const procedural = <ProceduralVehicle {...props} />;

  return (
    <group userData={{ vehicleRoot: true }} {...hover}>
      {available === null ? null : available ? (
        <LoadBoundary key={url} fallback={procedural}>
          <GlbVehicle {...props} url={url} />
        </LoadBoundary>
      ) : (
        procedural
      )}
    </group>
  );
}
