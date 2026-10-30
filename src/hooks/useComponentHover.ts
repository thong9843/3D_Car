import { useCallback, useEffect, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Car, Hotspot, PartId } from '../types/automotive';
import { findHotspotForPart, setHoverState } from './hoverStore';

/* ---------------------------------------------------------------- */
/* Danh mục bộ phận                                                  */
/* ---------------------------------------------------------------- */

/** Phân loại theo tên mesh/vật liệu (dùng cho mô hình .glb thực tế) */
const NAME_RULES: [PartId, RegExp][] = [
  ['suspension', /suspension|spring|shock|damper/i],
  ['headlamp', /head.?(lamp|light)|matrix|front.?light|den.?pha/i],
  ['wheel', /wheel|rim|tire|tyre|mam.?xe|lop/i],
  ['steering', /steer|vo.?lang/i],
  ['screen', /screen|display|hud|infotain/i],
  ['seat', /seat|ghe/i],
  ['powertrain', /battery|motor|engine|pin|dong.?co/i],
];

function classifyByName(obj: THREE.Object3D): PartId | null {
  const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
  const matName = Array.isArray(mat) ? mat.map((m) => m.name).join(' ') : mat?.name ?? '';
  const text = `${obj.name} ${matName}`;
  for (const [id, re] of NAME_RULES) if (re.test(text)) return id;
  return null;
}

/* ---------------------------------------------------------------- */
/* Highlight bằng emissive (clone vật liệu một lần, tái sử dụng)       */
/* ---------------------------------------------------------------- */

const HILITE = new THREE.Color('#22d3ee');
const hiliteCache = new WeakMap<THREE.Material, THREE.Material>();
const ORIG = '__origMaterial';

function hiliteOf(m: THREE.Material): THREE.Material {
  let h = hiliteCache.get(m);
  if (!h) {
    h = m.clone();
    const s = h as THREE.MeshStandardMaterial;
    if (s.emissive) {
      const hasGlow = s.emissive.getHex() !== 0;
      if (!hasGlow) s.emissive.copy(HILITE);
      s.emissiveIntensity = hasGlow ? (s.emissiveIntensity || 1) + 1.2 : 0.6;
      s.toneMapped = false;
    }
    hiliteCache.set(m, h);
  }
  return h;
}

function setHighlight(root: THREE.Object3D, on: boolean) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (on) {
      if (mesh.userData[ORIG]) return;
      mesh.userData[ORIG] = mesh.material;
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(hiliteOf) : hiliteOf(mesh.material);
    } else if (mesh.userData[ORIG]) {
      mesh.material = mesh.userData[ORIG] as THREE.Material | THREE.Material[];
      delete mesh.userData[ORIG];
    }
  });
}

/* ---------------------------------------------------------------- */
/* Raycast helper                                                    */
/* ---------------------------------------------------------------- */

const isVisible = (o: THREE.Object3D): boolean => {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
};

const isBlocking = (o: THREE.Object3D): boolean => {
  if (o.userData.passthrough || !isVisible(o)) return false;
  const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
  if (m && !Array.isArray(m) && m.transparent && m.opacity < 0.25) return false;
  return true;
};

interface Resolved { part: PartId; root: THREE.Object3D }

/** Tìm bộ phận từ mesh gần nhất thực sự bị trúng tia */
function resolve(e: ThreeEvent<PointerEvent | MouseEvent>): Resolved | null {
  const hit = e.intersections.find((i) => isBlocking(i.object));
  if (!hit) return null;
  let found: Resolved | null = null;
  for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) {
    if (o.userData.vehicleRoot) break;
    const tag = (o.userData.part as PartId | undefined) ?? classifyByName(o);
    if (tag) {
      if (!found) found = { part: tag, root: o };
      else if (tag === found.part) found.root = o; // mở rộng lên nhóm lớn nhất cùng loại
      else break;
    }
  }
  return found;
}

/* ---------------------------------------------------------------- */
/* Hook chính                                                        */
/* ---------------------------------------------------------------- */

/**
 * Trả về các handler gắn lên group gốc của xe để nhận hover/click theo bộ phận.
 * Hover → highlight emissive + cập nhật store cho HoverTooltip. Click → mở phân tích chi tiết.
 */
export function useComponentHover(car: Car, onSelect?: (h: Hotspot) => void) {
  const current = useRef<Resolved | null>(null);
  const lastCheck = useRef(0);

  const clear = useCallback(() => {
    if (current.current) setHighlight(current.current.root, false);
    current.current = null;
    document.body.style.cursor = 'auto';
    setHoverState({ part: null, hotspot: null });
  }, []);

  // Dọn dẹp khi đổi xe hoặc unmount
  useEffect(() => clear, [car.id, clear]);

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // Đang giữ nút chuột kéo xoay camera -> bỏ qua raycast để giữ 60+ FPS mượt mà
    if (e.buttons !== 0) {
      if (current.current) clear();
      return;
    }
    const now = performance.now();
    if (now - lastCheck.current < 32) return;
    lastCheck.current = now;

    const r = resolve(e);
    if (r?.root === current.current?.root) return;
    if (current.current) setHighlight(current.current.root, false);
    current.current = r;
    if (!r) {
      document.body.style.cursor = 'auto';
      setHoverState({ part: null, hotspot: null });
      return;
    }
    setHighlight(r.root, true);
    const hotspot = findHotspotForPart(car, r.part);
    document.body.style.cursor = hotspot ? 'pointer' : 'auto';
    setHoverState({ part: r.part, hotspot });
  }, [car, clear]);

  const onClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return; // đang kéo xoay camera
    const r = resolve(e);
    if (!r) return;
    e.stopPropagation();
    const hotspot = findHotspotForPart(car, r.part);
    if (hotspot) onSelect?.(hotspot);
  }, [car, onSelect]);

  return { onPointerMove, onPointerOver: onPointerMove, onPointerOut: clear, onClick };
}

