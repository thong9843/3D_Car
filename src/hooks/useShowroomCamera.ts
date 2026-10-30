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
}

const EXTERIOR_POS = new THREE.Vector3(6.2, 2.2, 6.2);
const XRAY_POS = new THREE.Vector3(5.8, 3.4, 5.8);

/** Điều phối camera: nội suy mượt (damping) tới vị trí đích theo chế độ xem / điểm chạm. */
export function useShowroomCamera({ mode, car, focus, autoRotate }: Options) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const settled = useRef(true);

  // Đặt đích mới khi đổi chế độ / xe / điểm chạm
  useEffect(() => {
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
      // Nới giới hạn trong lúc bay camera để không bị kẹp khoảng cách
      controls.minDistance = 0.005;
      controls.maxDistance = 30;
      controls.maxPolarAngle = Math.PI - 0.05;
      controls.autoRotate = false;
    }
  }, [mode, car, focus, controls]);

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

