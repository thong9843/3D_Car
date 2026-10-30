import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  BakeShadows,
  Bvh,
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
} from '@react-three/drei';
import * as THREE from 'three';
import type {
  Car,
  Hotspot,
  LeatherColor,
  LightsState,
  OpenableKey,
  OpenablesState,
  PaintOption,
  StageEnv,
  ViewMode,
  WheelStyle,
} from '../../types/automotive';
import { useShowroomCamera } from '../../hooks/useShowroomCamera';
import VehicleModel, { setupKTX2 } from './VehicleModel';
import HotspotBeacon from './HotspotBeacon';

interface Props {
  car: Car;
  paint: PaintOption;
  mode: ViewMode;
  focus: Hotspot | null;
  autoRotate: boolean;
  wheelStyle: WheelStyle;
  leatherColor: LeatherColor;
  lights: LightsState;
  openables: OpenablesState;
  engineRevving: boolean;
  stageEnv: StageEnv;
  nightMode: boolean;
  rainMode: boolean;
  cinematic: boolean;
  onSelectHotspot: (h: Hotspot) => void;
  onToggleOpenable: (key: OpenableKey) => void;
  onModeChange: (m: ViewMode) => void;
}

function CameraRig({
  car,
  mode,
  focus,
  autoRotate,
  cinematic,
  onModeChange,
}: Pick<Props, 'car' | 'mode' | 'focus' | 'autoRotate' | 'cinematic' | 'onModeChange'>) {
  useShowroomCamera({ car, mode, focus, autoRotate, cinematic, onModeChange });
  return null;
}

/** Hạt mưa rơi nhẹ nhàng trong không gian 3D khi bật chế độ Mưa */
function RainParticles() {
  const count = 240;
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = Math.random() * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const step = Math.min(dt, 0.05) * 11;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - step;
      if (y < 0.05) y = 8 + Math.random();
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial color="#93c5fd" size={0.04} transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

function Studio({
  stageEnv,
  nightMode,
  rainMode,
}: {
  stageEnv: StageEnv;
  nightMode: boolean;
  rainMode: boolean;
}) {
  const bg = nightMode
    ? '#020307'
    : stageEnv === 'glass'
      ? '#0d1522'
      : stageEnv === 'urban'
        ? '#12131c'
        : '#04060b';

  const keyIntensity = nightMode ? 240 : stageEnv === 'glass' ? 540 : 420;
  const ambIntensity = nightMode ? 0.16 : stageEnv === 'glass' ? 0.45 : 0.3;
  const envIntensity = nightMode ? 0.65 : stageEnv === 'glass' ? 1.2 : 0.95;

  const floorColor = stageEnv === 'glass' && !nightMode ? '#141c2b' : stageEnv === 'urban' ? '#13141f' : '#0b0e15';
  const primaryNeon = stageEnv === 'urban' ? '#f59e0b' : stageEnv === 'glass' ? '#e2e8f0' : '#22d3ee';
  const secondaryNeon = stageEnv === 'urban' ? '#ec4899' : stageEnv === 'glass' ? '#38bdf8' : '#818cf8';

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 15, 34]} />

      {/* Hệ thống chiếu sáng Studio sắc nét, tiết kiệm VRAM */}
      <ambientLight intensity={ambIntensity} />
      <spotLight
        position={[6, 9, 5]}
        angle={0.5}
        penumbra={1}
        intensity={keyIntensity}
        castShadow
        color={stageEnv === 'urban' ? '#fde68a' : '#fff4e6'}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
      <pointLight position={[-7, 2.5, -5]} intensity={nightMode ? 120 : 85} color={primaryNeon} />
      <pointLight position={[7, 2.5, -6]} intensity={nightMode ? 120 : 85} color={secondaryNeon} />

      <Environment resolution={256} frames={1} environmentIntensity={envIntensity}>
        <Lightformer form="rect" intensity={stageEnv === 'glass' ? 5.5 : 4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={3} position={[-8, 3, 0]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} color={stageEnv === 'glass' ? '#e0f2fe' : '#ffffff'} />
        <Lightformer form="rect" intensity={3} position={[8, 3, 0]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} color={stageEnv === 'urban' ? '#fed7aa' : '#ffffff'} />
        <Lightformer form="ring" color={primaryNeon} intensity={3.2} position={[0, 4, -9]} scale={6} />
        <Lightformer form="rect" color={secondaryNeon} intensity={2.2} position={[0, 2, 9]} rotation-y={Math.PI} scale={[12, 2, 1]} />
      </Environment>

      {/* Khung cột kính kiến trúc khi chọn Showroom Kính Hiện Đại */}
      {stageEnv === 'glass' && (
        <group>
          {[-6, -2, 2, 6].map((x) => (
            <mesh key={x} position={[x, 3.2, -7.5]}>
              <boxGeometry args={[0.14, 6.4, 0.14]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      )}

      {/* Đường chân trời các tòa nhà phát sáng khi chọn Urban Skybox */}
      {stageEnv === 'urban' && (
        <group>
          {[
            [-9, 2.6, -10, 1.8, 5.2],
            [-6, 3.4, -11, 2.1, 6.8],
            [-2.5, 2.2, -11.5, 1.9, 4.4],
            [1.5, 3.8, -11, 2.2, 7.6],
            [5.5, 2.9, -10.5, 1.8, 5.8],
            [9, 2.3, -10, 2.0, 4.6],
          ].map(([x, y, z, w, h], idx) => (
            <mesh key={idx} position={[x, y, z]}>
              <boxGeometry args={[w, h, 1.4]} />
              <meshStandardMaterial color="#0f172a" emissive={idx % 2 === 0 ? '#f59e0b' : '#38bdf8'} emissiveIntensity={0.25} roughness={0.7} />
            </mesh>
          ))}
        </group>
      )}

      {/* Sàn Showroom: Chỉ bật MeshReflectorMaterial (render phản chiếu 2 lần) khi bật Mưa; bình thường dùng PBR Physical siêu nhẹ RAM */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[13, 72]} />
        {rainMode ? (
          <MeshReflectorMaterial
            blur={[180, 60]}
            resolution={512}
            mixBlur={0.65}
            mixStrength={70}
            mixContrast={1.2}
            roughness={0.14}
            depthScale={1.0}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color={floorColor}
            metalness={0.85}
            mirror={0.5}
          />
        ) : (
          <meshPhysicalMaterial
            color={floorColor}
            metalness={0.65}
            roughness={stageEnv === 'glass' ? 0.25 : 0.42}
            clearcoat={0.6}
            clearcoatRoughness={0.25}
            envMapIntensity={1.2}
          />
        )}
      </mesh>

      {/* Bóng đổ tiếp xúc tĩnh (frames={1} chỉ tính 1 lần, không tốn GPU mỗi frame) */}
      <ContactShadows
        key={stageEnv}
        position={[0, 0.01, 0]}
        opacity={0.72}
        scale={12}
        blur={2.2}
        far={3.2}
        resolution={512}
        frames={1}
      />

      {/* Vòng đèn sàn & trần */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <ringGeometry args={[4.6, 4.68, 128]} />
        <meshBasicMaterial color={primaryNeon} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <ringGeometry args={[6.4, 6.46, 128]} />
        <meshBasicMaterial color={secondaryNeon} toneMapped={false} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 7, 0]}>
        <torusGeometry args={[5, 0.05, 12, 128]} />
        <meshBasicMaterial color={primaryNeon} toneMapped={false} />
      </mesh>

      {rainMode && <RainParticles />}
    </>
  );
}

export default function ShowroomStage({
  car,
  paint,
  mode,
  focus,
  autoRotate,
  wheelStyle,
  leatherColor,
  lights,
  openables,
  engineRevving,
  stageEnv,
  nightMode,
  rainMode,
  cinematic,
  onSelectHotspot,
  onToggleOpenable,
  onModeChange,
}: Props) {
  const visible = car.hotspots.filter((h) => h.mode === mode);
  // Giữ nguyên độ phân giải sắc nét của màn hình (tối đa 2x Retina) — KHÔNG dùng AdaptiveDpr pixelated để tránh vỡ hạt/răng cưa
  const maxDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1.5;

  return (
    <Canvas
      shadows
      dpr={[Math.min(1.25, maxDpr), maxDpr]}
      camera={{ position: [6.2, 2.2, 6.2], fov: 40, near: 0.05, far: 70 }}
      gl={{
        antialias: true,
        stencil: false,
        depth: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: nightMode ? 0.95 : 1.08,
      }}
      onCreated={({ gl }) => setupKTX2(gl)}
      style={{ touchAction: 'none' }}
    >
      <BakeShadows />
      <Studio stageEnv={stageEnv} nightMode={nightMode} rainMode={rainMode} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 - 0.02}
      />
      <CameraRig car={car} mode={mode} focus={focus} autoRotate={autoRotate} cinematic={cinematic} onModeChange={onModeChange} />
      <Suspense fallback={null}>
        <Bvh firstHitOnly>
          <VehicleModel
            key={car.id}
            car={car}
            paint={paint}
            mode={mode}
            wheelStyle={wheelStyle}
            leatherColor={leatherColor}
            lights={lights}
            openables={openables}
            engineRevving={engineRevving}
            onSelectHotspot={onSelectHotspot}
            onToggleOpenable={onToggleOpenable}
          />
        </Bvh>
      </Suspense>
      {visible.map((h) => (
        <HotspotBeacon key={h.id} hotspot={h} active={focus?.id === h.id} onSelect={onSelectHotspot} />
      ))}
    </Canvas>
  );
}
