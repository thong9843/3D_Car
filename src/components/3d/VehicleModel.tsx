import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Car, CarBody, PaintOption, ViewMode } from '../../types/automotive';

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

const NEON = '#22d3ee';
const mats = {
  glass: new THREE.MeshPhysicalMaterial({
    color: '#0a1520', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.38,
    envMapIntensity: 2, clearcoat: 1, clearcoatRoughness: 0, depthWrite: false,
  }),
  tire: new THREE.MeshStandardMaterial({ color: '#0e0e10', roughness: 0.85, metalness: 0.05 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#d7dbe0', metalness: 1, roughness: 0.15 }),
  disc: new THREE.MeshStandardMaterial({ color: '#5b5f66', metalness: 0.9, roughness: 0.4 }),
  trim: new THREE.MeshStandardMaterial({ color: '#08090b', metalness: 0.5, roughness: 0.35 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e8f4ff', emissiveIntensity: 2.2, toneMapped: false }),
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
/* Thành phần phụ                                                    */
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

function Wheel({ x, z, R }: { x: number; z: number; R: number }) {
  const side = z > 0 ? 1 : -1;
  return (
    <group position={[x, R, z]}>
      <Cyl pos={[0, 0, 0]} axis="z" r={R} len={0.26} mat={mats.tire} seg={48} />
      <Cyl pos={[0, 0, side * 0.01]} axis="z" r={R * 0.7} len={0.27} mat={mats.chrome} seg={40} />
      <Cyl pos={[0, 0, side * 0.14]} axis="z" r={R * 0.28} len={0.03} mat={mats.trim} />
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 0, side * 0.145]} rotation={[0, 0, (i * Math.PI) / 5]} material={mats.chrome}>
          <boxGeometry args={[R * 1.35, 0.045, 0.02]} />
        </mesh>
      ))}
      <Cyl pos={[0, 0, -side * 0.02]} axis="z" r={R * 0.5} len={0.04} mat={mats.disc} />
    </group>
  );
}

function Seat({ x, z, tan = false }: { x: number; z: number; tan?: boolean }) {
  const m = tan ? mats.tan : mats.leather;
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[0.55, 0.14, 0.5]} radius={0.05} position={[0, 0.6, 0]} material={m} />
      <RoundedBox args={[0.14, 0.62, 0.5]} radius={0.05} position={[-0.22, 0.95, 0]} rotation={[0, 0, 0.15]} material={m} />
      <RoundedBox args={[0.1, 0.18, 0.28]} radius={0.04} position={[-0.3, 1.33, 0]} rotation={[0, 0, 0.15]} material={m} />
    </group>
  );
}

function Interior({ b }: { b: CarBody }) {
  const dashX = b.hoodStart - 0.15;
  const seatX = b.roofFront - 0.55 - (b.ladderFrame ? 0.05 : 0);
  const rearX = Math.max(seatX - 0.95, b.trunkEnd + 0.45);
  const len = b.hoodStart - b.trunkEnd - 0.1;
  return (
    <group>
      <mesh position={[(b.hoodStart + b.trunkEnd) / 2, 0.43, 0]} material={mats.carpet}>
        <boxGeometry args={[len, 0.04, b.width * 0.72]} />
      </mesh>
      <Seat x={seatX} z={-0.4} />
      <Seat x={seatX} z={0.4} />
      <Seat x={rearX} z={-0.42} tan />
      <Seat x={rearX} z={0} tan />
      <Seat x={rearX} z={0.42} tan />
      <RoundedBox args={[0.5, 0.2, b.width * 0.74]} radius={0.06} position={[dashX, b.belt - 0.13, 0]} material={mats.leather} />
      <mesh position={[dashX - 0.26, b.belt + 0.06, 0]} material={mats.screen}>
        <boxGeometry args={[0.03, 0.2, 0.5]} />
      </mesh>
      <group position={[dashX - 0.46, b.belt - 0.02, -0.4]} rotation={[0, 0, 0.35]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={mats.leather}>
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
    <group position={[x, y, z]}>
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
    <group>
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
/* Mô hình xe                                                        */
/* ---------------------------------------------------------------- */

interface Props {
  car: Car;
  paint: PaintOption;
  mode: ViewMode;
}

const LIFT = 1.2; // ΔY khi bóc tách (mét)

export default function VehicleModel({ car, paint, mode }: Props) {
  const b = car.body;
  const bodyRef = useRef<THREE.Group>(null);
  const internalsRef = useRef<THREE.Group>(null);
  const roofRef = useRef<THREE.Group>(null);
  const xr = useRef(0);
  const ic = useRef(0);

  const lowerGeo = useMemo(() => buildLowerBody(b), [b]);
  const glassGeo = useMemo(() => buildGreenhouse(b), [b]);
  const lowerEdges = useMemo(() => new THREE.EdgesGeometry(lowerGeo, 22), [lowerGeo]);
  const glassEdges = useMemo(() => new THREE.EdgesGeometry(glassGeo, 22), [glassGeo]);
  const paintMat = useMemo(makePaintMaterial, []);
  const roofMat = useMemo(makePaintMaterial, []);
  const glassMat = useMemo(() => mats.glass.clone(), []);
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: NEON, transparent: true, opacity: 0, toneMapped: false }),
    [],
  );

  useEffect(() => {
    applyPaint(paintMat, paint);
    applyPaint(roofMat, paint);
  }, [paint, paintMat, roofMat]);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-3.2 * Math.min(dt, 0.05));
    xr.current += ((mode === 'xray' ? 1 : 0) - xr.current) * k;
    ic.current += ((mode === 'interior' ? 1 : 0) - ic.current) * k;
    const x = xr.current;
    const i = ic.current;
    const ease = x * x * (3 - 2 * x);

    if (bodyRef.current) bodyRef.current.position.y = ease * LIFT;
    if (internalsRef.current) internalsRef.current.visible = x > 0.03;
    if (roofRef.current) roofRef.current.visible = i < 0.5 && x < 0.5;

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
  const cabinMid = (b.hoodStart + b.trunkEnd) / 2;
  const roofLen = b.roofFront - b.roofRear + 0.1;

  return (
    <group>
      {/* Phần vỏ nâng lên trong chế độ X-Ray */}
      <group ref={bodyRef}>
        <mesh geometry={lowerGeo} material={paintMat} castShadow receiveShadow />
        <lineSegments geometry={lowerEdges} material={edgeMat} />
        <mesh geometry={glassGeo} material={glassMat} renderOrder={2} />
        <lineSegments geometry={glassEdges} material={edgeMat} />

        {[-1, 1].map((s) => (
          <RoundedBox
            key={s}
            args={[cabinLen - 0.1, b.belt - 0.3, 0.12]}
            radius={0.04}
            position={[cabinMid, (b.belt + 0.3) / 2, s * (b.width / 2 - 0.04)]}
            material={paintMat}
            castShadow
          />
        ))}

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

        {/* Đèn pha, lưới tản nhiệt, đèn hậu */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[b.length / 2 + 0.065, b.belt - 0.15, s * b.width * 0.34]} material={mats.lamp}>
            <boxGeometry args={[0.05, 0.09, 0.38]} />
          </mesh>
        ))}
        <mesh position={[b.length / 2 + 0.07, b.belt - 0.28, 0]} material={mats.trim}>
          <boxGeometry args={[0.04, 0.17, b.width * 0.34]} />
        </mesh>
        <mesh position={[-b.length / 2 - 0.07, b.belt - 0.14, 0]} material={mats.tail}>
          <boxGeometry args={[0.04, 0.07, b.width * 0.7]} />
        </mesh>
        <mesh position={[0, b.ground + 0.02, 0]} material={mats.trim}>
          <boxGeometry args={[b.length - 0.9, 0.04, b.width - 0.1]} />
        </mesh>
      </group>

      {/* Nội thất luôn hiện */}
      <Interior b={b} />

      {/* Cụm cơ khí chỉ hiện khi X-Ray */}
      <group ref={internalsRef} visible={false}>
        <Internals b={b} />
      </group>

      {/* Bánh xe */}
      <Wheel x={b.axleF} z={wz} R={b.wheelR} />
      <Wheel x={b.axleF} z={-wz} R={b.wheelR} />
      <Wheel x={b.axleR} z={wz} R={b.wheelR} />
      <Wheel x={b.axleR} z={-wz} R={b.wheelR} />
    </group>
  );
}

