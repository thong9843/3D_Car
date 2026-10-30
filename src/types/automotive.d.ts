export type ViewMode = 'exterior' | 'interior' | 'xray';
export type Vec3 = [number, number, number];
export type Lang = 'vi' | 'en';

export interface PaintOption {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
  finish: 'metallic' | 'pearl' | 'solid';
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface Hotspot {
  id: string;
  title: string;
  titleEn: string;
  /** Chế độ xem mà điểm chạm này xuất hiện */
  mode: ViewMode;
  /** Tọa độ thế giới (mét) */
  position: Vec3;
  /** Độ lệch camera so với điểm chạm khi lia lại gần */
  camOffset: Vec3;
  summary: string;
  specs: SpecItem[];
  principle: string;
  optionStatus: string;
}

export type DrivetrainLayout = 'ev' | 'ice-fwd' | 'ice-awd' | 'ice-4wd';

export interface CarBody {
  length: number;
  width: number;
  belt: number;
  roofH: number;
  trunkEnd: number;
  roofRear: number;
  roofFront: number;
  hoodStart: number;
  noseH: number;
  ground: number;
  wheelR: number;
  axleF: number;
  axleR: number;
  layout: DrivetrainLayout;
  ladderFrame: boolean;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  trim: string;
  segment: string;
  tagline: string;
  price: string;
  quick: { power: string; torque: string; drive: string; extra: string; extraLabel: string };
  dimensions: SpecItem[];
  body: CarBody;
  paints: PaintOption[];
  hotspots: Hotspot[];
}

