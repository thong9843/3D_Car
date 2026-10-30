import { useCallback } from 'react';
import * as THREE from 'three';
import type { Hotspot, Vec3 } from '../types/automotive';

export interface CameraGoal {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

/** Tính góc nhìn camera tương ứng với một điểm chạm: lia lại gần theo offset khai báo. */
export function computeFocusView(h: Hotspot): CameraGoal {
  const target = new THREE.Vector3(...h.position);
  // Chọn bên nhìn (trái/phải xe) theo dấu của z để camera luôn ở phía điểm chạm
  const offset = new THREE.Vector3(...h.camOffset);
  if (h.position[2] < 0 && offset.z > 0) offset.z *= -1;
  return { position: target.clone().add(offset), target };
}

/** Hook trả về hàm tính góc nhìn từ điểm chạm (dùng khi click). */
export function useHotspotRaycast() {
  const getView = useCallback((h: Hotspot): CameraGoal => computeFocusView(h), []);
  const toVec = useCallback((v: Vec3) => new THREE.Vector3(...v), []);
  return { getView, toVec };
}

