import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Car, Hotspot, ViewMode } from '../types/automotive';
import { computeFocusView } from './useHotspotRaycast';

interface Options {
  mode: ViewMode;
  car: Car;
  focus: Hotspot | null;
  autoRotate: boolean;
  cinematic?: boolean;
  onModeChange?: (m: ViewMode) => void;
}

const EXTERIOR_POS = new THREE.Vector3(6.2, 2.2, 6.2);
const XRAY_POS = new THREE.Vector3(5.8, 3.4, 5.8);

/** Điều phối camera: nội suy mượt (damping) tới vị trí đích hoặc lượn theo kịch bản Cinematic Tour. */
export function useShowroomCamera({ mode, car, focus, autoRotate, cinematic = false, onModeChange }: Options) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const settled = useRef(true);
  const tourClock = useRef(0);
  const lastPhase = useRef<ViewMode>(mode);

  // Đặt đích mới khi đổi chế độ / xe / điểm chạm (khi không bật Cinematic Tour)
  useEffect(() => {
    if (cinematic) return;
    const b = car.body;
    let pos: THREE.Vector3;
    let target: THREE.Vector3;
    if (focus) {
      const v = computeFocusView(focus);
      pos = v.position;
      target = v.target;
    } else if (mode === 'interior') {
      const eyeX = b.roofFront - 0.5 + 0.1;
      pos = new THREE.Vector3(eyeX, b.belt + 0.22, -0.4);
      target = pos.clone().add(new THREE.Vector3(0.01, -0.001, 0));
    } else if (mode === 'xray') {
      pos = XRAY_POS.clone();
      target = new THREE.Vector3(0, 1.0, 0);
    } else {
      pos = EXTERIOR_POS.clone();
      target = new THREE.Vector3(0, 0.75, 0);
    }
    goal.current = { pos, target };
    settled.current = false;
    if (controls) {
      controls.minDistance = 0.005;
      controls.maxDistance = 30;
      controls.maxPolarAngle = Math.PI - 0.05;
      controls.autoRotate = false;
    }
  }, [mode, car, focus, controls, cinematic]);

  useEffect(() => {
    if (cinematic) {
      tourClock.current = 0;
      lastPhase.current = mode;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinematic]);

  // Người dùng chạm vào điều khiển -> hủy chuyển cảnh tự động
  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      if (!settled.current) applyLimits(true);
    };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, mode, focus]);

  function applyLimits(snap: boolean) {
    if (!controls) return;
    settled.current = true;
    controls.maxPolarAngle = mode === 'interior' && !focus ? Math.PI - 0.2 : Math.PI / 2 - 0.02;
    if (snap && goal.current === null) return;
    if (focus) {
      controls.minDistance = 0.8;
      controls.maxDistance = 6;
      controls.rotateSpeed = 0.7;
      controls.enablePan = false;
    } else if (mode === 'interior') {
      controls.minDistance = 0.01;
      controls.maxDistance = 0.01;
      controls.rotateSpeed = -0.45;
      controls.enablePan = false;
    } else if (mode === 'xray') {
      controls.minDistance = 3;
      controls.maxDistance = 10;
      controls.rotateSpeed = 0.7;
      controls.enablePan = false;
    } else {
      controls.minDistance = 3.5;
      controls.maxDistance = 9;
      controls.rotateSpeed = 0.7;
      controls.enablePan = false;
    }
  }

  useFrame((_, dt) => {
    if (!controls) return;

    // Kịch bản Cinematic Auto-Tour: 30 giây / vòng (0-12s Ngoại thất, 12-21s Buồng lái, 21-30s Khung gầm X-Ray)
    if (cinematic) {
      tourClock.current = (tourClock.current + Math.min(dt, 0.05)) % 30;
      const t = tourClock.current;
      const b = car.body;
      controls.minDistance = 0.005;
      controls.maxDistance = 30;
      controls.autoRotate = false;

      let desiredMode: ViewMode = 'exterior';
      const desiredPos = new THREE.Vector3();
      const desiredTarget = new THREE.Vector3();

      if (t < 12) {
        desiredMode = 'exterior';
        const angle = (t / 12) * Math.PI * 1.65 - 0.4;
        const radius = 6.2 - Math.sin((t / 12) * Math.PI) * 1.1;
        desiredPos.set(Math.cos(angle) * radius, 1.35 + Math.sin((t / 12) * Math.PI) * 1.15, Math.sin(angle) * radius);
        desiredTarget.set(0, 0.75, 0);
      } else if (t < 21) {
        desiredMode = 'interior';
        const p = (t - 12) / 9;
        const eyeX = b.roofFront - 0.42;
        desiredPos.set(eyeX - 0.15, b.belt + 0.34, -0.35 + Math.sin(p * Math.PI * 2) * 0.28);
        desiredTarget.set(b.hoodStart - 0.35, b.belt - 0.02, Math.sin(p * Math.PI) * 0.25);
      } else {
        desiredMode = 'xray';
        const p = (t - 21) / 9;
        const angle = p * Math.PI * 1.2 + 0.3;
        desiredPos.set(Math.cos(angle) * 5.8, 2.9 + Math.sin(p * Math.PI) * 0.9, Math.sin(angle) * 5.8);
        desiredTarget.set(0, 0.85, 0);
      }

      if (desiredMode !== lastPhase.current) {
        lastPhase.current = desiredMode;
        onModeChange?.(desiredMode);
      }

      const k = 1 - Math.exp(-3.0 * Math.min(dt, 0.05));
      camera.position.lerp(desiredPos, k);
      controls.target.lerp(desiredTarget, k);
      controls.update();
      return;
    }

    const g = goal.current;
    if (g && !settled.current) {
      const k = 1 - Math.exp(-4.5 * Math.min(dt, 0.05));
      camera.position.lerp(g.pos, k);
      controls.target.lerp(g.target, k);
      if (camera.position.distanceTo(g.pos) < 0.015 && controls.target.distanceTo(g.target) < 0.015) {
        camera.position.copy(g.pos);
        controls.target.copy(g.target);
        applyLimits(false);
      }
    }
    controls.autoRotate = autoRotate && settled.current && mode === 'exterior' && !focus;
    controls.autoRotateSpeed = 0.9;
    controls.update();
  });
}
