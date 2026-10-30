import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  AdaptiveDpr,
  AdaptiveEvents,
  BakeShadows,
  Bvh,
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  PerformanceMonitor,
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
import VehicleModel from './VehicleModel';
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

/** Hạt mưa rơi trực tiếp trong không gian 3D khi bật chế độ Mưa (Rain Weather) */
function RainParticles() {
  const count = 320;
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = Math.random() * 9;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const step = Math.min(dt, 0.05) * 11.5;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - step;
      if (y < 0.05) y = 8.5 + Math.random() * 1.2;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial color="#93c5fd" size={0.045} transparent opacity={0.65} depthWrite={false} />
    </points>
  );
}

function Studio({
  stageEnv,
  nightMode,
  rainMode,
  lowQuality,
}: {
  stageEnv: StageEnv;
  nightMode: boolean;
  rainMode: boolean;
  lowQuality: boolean;
}) {
  const bg = nightMode
    ? '#020307'
    : stageEnv === 'glass'
      ? '#0d1522'
      : stageEnv === 'urban'
        ? '#12131c'
        : '#04060b';

  const keyIntensity = nightMode ? 220 : stageEnv === 'glass' ? 560 : 420;
  const ambIntensity = nightMode ? 0.12 : stageEnv === 'glass' ? 0.45 : 0.25;
  const envIntensity = nightMode ? 0.55 : stageEnv === 'glass' ? 1.25 : 0.9;

  // Khi bật mưa: sàn ướt bóng gương (roughness thấp, mixStrength cao)
  const floorRoughness = rainMode ? 0.14 : stageEnv === 'glass' ? 0.45 : 0.85;
  const floorStrength = rainMode ? 75 : stageEnv === 'glass' ? 50 : 35;
  const floorColor = stageEnv === 'glass' && !nightMode ? '#141c2b' : stageEnv === 'urban' ? '#13141f' : '#0b0e15';

  const primaryNeon = stageEnv === 'urban' ? '#f59e0b' : stageEnv === 'glass' ? '#e2e8f0' : '#22d3ee';
  const secondaryNeon = stageEnv === 'urban' ? '#ec4899' : stageEnv === 'glass' ? '#38bdf8' : '#818cf8';
  const reflectorRes = lowQuality ? 256 : 512;

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 14, 32]} />

      {/* Ánh sáng 3 điểm thay đổi theo bối cảnh & Ngày/Đêm (Shadow Map tối ưu 1024x1024) */}
      <ambientLight intensity={ambIntensity} />
      <spotLight
        position={[6, 9, 5]}
        angle={0.5}
        penumbra={1}
        intensity={keyIntensity}
        castShadow
        color={stageEnv === 'urban' ? '#fde68a' : '#fff4e6'}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
      />
      <pointLight position={[-7, 2.5, -5]} intensity={nightMode ? 130 : 90} color={primaryNeon} />
      <pointLight position={[7, 2.5, -6]} intensity={nightMode ? 130 : 90} color={secondaryNeon} />

      <Environment resolution={128} environmentIntensity={envIntensity}>
        <Lightformer form="rect" intensity={stageEnv === 'glass' ? 6 : 4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={3} position={[-8, 3, 0]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} color={stageEnv === 'glass' ? '#e0f2fe' : '#ffffff'} />
        <Lightformer form="rect" intensity={3} position={[8, 3, 0]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} color={stageEnv === 'urban' ? '#fed7aa' : '#ffffff'} />
        <Lightformer form="ring" color={primaryNeon} intensity={3.5} position={[0, 4, -9]} scale={6} />
        <Lightformer form="rect" color={secondaryNeon} intensity={2.5} position={[0, 2, 9]} rotation-y={Math.PI} scale={[12, 2, 1]} />
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

      {/* Sàn phản xạ (resolution 512/256 giúp giữ 60+ FPS mượt khi xoay camera) */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[13, 64]} />
        <MeshReflectorMaterial
          blur={rainMode ? [160, 48] : [200, 64]}
          resolution={reflectorRes}
          mixBlur={rainMode ? 0.65 : 0.9}
          mixStrength={floorStrength}
          mixContrast={rainMode ? 1.25 : 1.1}
          roughness={floorRoughness}
          depthScale={1.0}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={floorColor}
          metalness={rainMode ? 0.85 : 0.6}
          mirror={rainMode ? 0.55 : 0}
        />
      </mesh>
      {/* frames={1} tính bóng ContactShadows 1 lần thay vì mỗi frame → giảm tải GPU rõ rệt */}
      <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={14} blur={2.4} far={3.5} resolution={256} frames={1} />

      {/* Vòng đèn sàn & trần */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <ringGeometry args={[4.6, 4.68, 96]} />
        <meshBasicMaterial color={primaryNeon} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <ringGeometry args={[6.4, 6.46, 96]} />
        <meshBasicMaterial color={secondaryNeon} toneMapped={false} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 7, 0]}>
        <torusGeometry args={[5, 0.05, 10, 96]} />
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
  const [lowQuality, setLowQuality] = useState(false);
  const visible = car.hotspots.filter((h) => h.mode === mode);
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      camera={{ position: [6.2, 2.2, 6.2], fov: 42, near: 0.02, far: 80 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: nightMode ? 0.92 : 1.08,
      }}
      style={{ touchAction: 'none' }}
    >
      {/* Bộ tứ tối ưu 60+ FPS: AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, Bvh */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <BakeShadows />
      <PerformanceMonitor
        onDecline={() => setLowQuality(true)}
        onIncline={() => setLowQuality(false)}
      />

      <Studio stageEnv={stageEnv} nightMode={nightMode} rainMode={rainMode} lowQuality={lowQuality} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
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
