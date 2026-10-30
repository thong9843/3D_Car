import { useSyncExternalStore } from 'react';
import type { Car, Hotspot, PartId } from '../types/automotive';

/* Danh mục bộ phận & store hover - không phụ thuộc three để giữ trong bundle chính */

export interface PartMeta {
  label: string;
  labelEn: string;
  summary: string;
  summaryEn: string;
}

export const PART_META: Record<PartId, PartMeta> = {
  headlamp: { label: 'Đèn pha', labelEn: 'Headlamp', summary: 'Cụm đèn chiếu sáng LED hiệu suất cao cho tầm nhìn ban đêm.', summaryEn: 'High-efficiency LED lighting for night visibility.' },
  wheel: { label: 'Mâm xe', labelEn: 'Alloy wheel', summary: 'Mâm hợp kim nhẹ giảm khối lượng không được treo, tăng độ bám.', summaryEn: 'Lightweight alloy reduces unsprung mass and improves grip.' },
  powertrain: { label: 'Khối động lực', labelEn: 'Powertrain', summary: 'Nguồn động lực chính chuyển hóa năng lượng thành chuyển động.', summaryEn: 'The main source of drive power.' },
  steering: { label: 'Vô-lăng', labelEn: 'Steering wheel', summary: 'Vô-lăng bọc da tích hợp phím điều khiển tiện ích.', summaryEn: 'Leather wheel with integrated controls.' },
  screen: { label: 'Màn hình giải trí / HUD', labelEn: 'Display / HUD', summary: 'Màn hình điều khiển trung tâm giải trí và thông tin xe.', summaryEn: 'Central display for infotainment and vehicle info.' },
  seat: { label: 'Ghế ngồi', labelEn: 'Seats', summary: 'Ghế bọc da ôm lưng, hỗ trợ tư thế lái thoải mái.', summaryEn: 'Leather seats with supportive posture.' },
  suspension: { label: 'Hệ thống treo', labelEn: 'Suspension', summary: 'Lò xo và giảm chấn giúp xe êm ái, bám đường tốt.', summaryEn: 'Springs and dampers for comfort and road grip.' },
};

/** Gán bộ phận → hotspot tương ứng của từng xe */
const HOTSPOT_RULE: Record<PartId, { re: RegExp; mode?: Hotspot['mode'] }> = {
  headlamp: { re: /lamp/ },
  wheel: { re: /wheel/, mode: 'exterior' },
  steering: { re: /wheel/, mode: 'interior' },
  screen: { re: /screen/ },
  seat: { re: /seat/ },
  powertrain: { re: /battery|motor|engine/ },
  suspension: { re: /susp/ },
};

export function findHotspotForPart(car: Car, part: PartId): Hotspot | null {
  const rule = HOTSPOT_RULE[part];
  return car.hotspots.find((h) => rule.re.test(h.id) && (!rule.mode || h.mode === rule.mode)) ?? null;
}

/* ---------------------------------------------------------------- */
/* Store nhỏ gọn cho trạng thái hover (không cần thư viện ngoài)       */
/* ---------------------------------------------------------------- */

export interface HoverState {
  part: PartId | null;
  hotspot: Hotspot | null;
}

let state: HoverState = { part: null, hotspot: null };
const listeners = new Set<() => void>();
export const setHoverState = (s: HoverState) => {
  if (s.part === state.part && s.hotspot === state.hotspot) return;
  state = s;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

export const useHoverState = (): HoverState => useSyncExternalStore(subscribe, () => state, () => state);

