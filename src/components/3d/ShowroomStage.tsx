import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Car, Hotspot, PaintOption, ViewMode } from '../../types/automotive';
import { useShowroomCamera } from '../../hooks/useShowroomCamera';
import VehicleModel from './VehicleModel';
import HotspotBeacon from './HotspotBeacon';

interface Props {
  car: Car;
  paint: PaintOption;
  mode: ViewMode;
  focus: Hotspot | null;
  autoRotate: boolean;
  onSelectHotspot: (h: Hotspot) => void;
}

function CameraRig({ car, mode, focus, autoRotate }: Pick<Props, 'car' | 'mode' | 'focus' | 'autoRotate'>) {
  useShowroomCamera({ car, mode, focus, autoRotate });
  return null;
}

function Studio() {
  return (
    <>
      <color attach="background" args={['#04060b']} />
      <fog attach="fog" args={['#04060b', 14, 32]} />

      {/* Ánh sáng 3 điểm: key + ambient + rim cyan/indigo */}
      <ambientLight intensity={0.25} />
      <spotLight
        position={[6, 9, 5]} angle={0.5} penumbra={1} intensity={420} castShadow color="#fff4e6"
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003}
      />
      <pointLight position={[-7, 2.5, -5]} intensity={90} color="#22d3ee" />
      <pointLight position={[7, 2.5, -6]} intensity={90} color="#818cf8" />

      <Environment resolution={256} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={3} position={[-8, 3, 0]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={3} position={[8, 3, 0]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="ring" color="#22d3ee" intensity={3} position={[0, 4, -9]} scale={6} />
        <Lightformer form="rect" color="#818cf8" intensity={2} position={[0, 2, 9]} rotation-y={Math.PI} scale={[12, 2, 1]} />
      </Environment>

      {/* Sàn phản xạ bóng mờ */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[13, 96]} />
        <MeshReflectorMaterial
          blur={[300, 100]} resolution={1024} mixBlur={1} mixStrength={35} mixContrast={1.1}
          roughness={0.9} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.4}
          color="#0b0e15" metalness={0.6} mirror={0}
        />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={14} blur={2.6} far={3.5} />

      {/* Vòng neon sàn & trần */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <ringGeometry args={[4.6, 4.68, 128]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <ringGeometry args={[6.4, 6.46, 128]} />
        <meshBasicMaterial color="#818cf8" toneMapped={false} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 7, 0]}>
        <torusGeometry args={[5, 0.05, 12, 128]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
    </>
  );
}

export default function ShowroomStage({ car, paint, mode, focus, autoRotate, onSelectHotspot }: Props) {
  const visible = car.hotspots.filter((h) => h.mode === mode);
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [6.2, 2.2, 6.2], fov: 42, near: 0.02, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      style={{ touchAction: 'none' }}
    >
      <Studio />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 - 0.02}
      />
      <CameraRig car={car} mode={mode} focus={focus} autoRotate={autoRotate} />
      <Suspense fallback={null}>
        <VehicleModel key={car.id} car={car} paint={paint} mode={mode} />
      </Suspense>
      {visible.map((h) => (
        <HotspotBeacon key={h.id} hotspot={h} active={focus?.id === h.id} onSelect={onSelectHotspot} />
      ))}
    </Canvas>
  );
}

