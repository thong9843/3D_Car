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

/** Danh sách đường dẫn ảnh thực tế theo từng nhóm */
export interface RealImages {
  exterior: string[];
  interior: string[];
  engine: string[];
}

/** Thông số kỹ thuật & giá chuẩn thị trường Việt Nam (dùng cho bộ so sánh) */
export interface MarketSpecs {
  /** Giá niêm yết (VNĐ) */
  listPriceVnd: number;
  /** Giá lăn bánh ước tính tại Hà Nội/TP.HCM (VNĐ) */
  onRoadPriceVnd: number;
  engine: string;
  powerHp: number;
  powerText: string;
  torqueNm: number;
  torqueText: string;
  driveSystem: string;
  /** Kích thước tổng thể (mm) */
  sizeMm: { length: number; width: number; height: number };
  wheelbaseMm: number;
  adas: string[];
  comfort: string[];
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
  market: MarketSpecs;
  realImages: RealImages;
}

/** Bộ phận có thể hover/click trên mô hình 3D */
export type PartId = 'headlamp' | 'wheel' | 'powertrain' | 'steering' | 'screen' | 'seat' | 'suspension';

/* ---------------------------------------------------------------- */
/* Giai đoạn 3: Tuỳ biến 3D, Ánh sáng, Bối cảnh & Thương mại        */
/* ---------------------------------------------------------------- */

export type WheelStyle = 'sport' | 'executive' | 'offroad';
export type LeatherColor = 'black' | 'cognac' | 'cream';
export type StageEnv = 'neon' | 'glass' | 'urban';
export type OpenableKey = 'doors' | 'hood' | 'trunk';

export interface OpenablesState {
  doors: boolean;
  hood: boolean;
  trunk: boolean;
}

export interface LightsState {
  headlights: boolean;
  drl: boolean;
  hazards: boolean;
}

export interface TestDriveBooking {
  id: string;
  carId: string;
  carName: string;
  fullName: string;
  phone: string;
  dealer: string;
  date: string;
  notes: string;
  createdAt: string;
}


