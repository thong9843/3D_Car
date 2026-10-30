import { useState } from 'react';
import {
  Disc,
  Lightbulb,
  TriangleAlert,
  DoorOpen,
  Volume2,
  Sun,
  Moon,
  CloudRain,
  Building2,
  SlidersHorizontal,
  ChevronUp,
} from 'lucide-react';
import type {
  Lang,
  LeatherColor,
  LightsState,
  OpenableKey,
  OpenablesState,
   PaintOption,
  StageEnv,
  ViewMode,
  WheelStyle,
} from '../../types/automotive';

interface Props {
  paints: PaintOption[];
  activeId: string;
  onSelect: (id: string) => void;
  wheelStyle: WheelStyle;
  onWheelStyle: (w: WheelStyle) => void;
  leatherColor: LeatherColor;
  onLeatherColor: (l: LeatherColor) => void;
  lights: LightsState;
  onToggleLight: (k: keyof LightsState) => void;
  openables: OpenablesState;
  onToggleOpenable: (k: OpenableKey) => void;
  engineRevving: boolean;
  onRevEngine: () => void;
  stageEnv: StageEnv;
  onStageEnv: (e: StageEnv) => void;
  nightMode: boolean;
  onToggleNight: () => void;
  rainMode: boolean;
  onToggleRain: () => void;
  mode: ViewMode;
  lang: Lang;
}

const finishLabel = { metallic: 'Kim loại', pearl: 'Ngọc trai', solid: 'Đặc' } as const;

const WHEELS: { id: WheelStyle; vi: string; en: string }[] = [
  { id: 'sport', vi: 'Sport 5 chấu', en: 'Sport 5-spoke' },
  { id: 'executive', vi: 'Executive đa chấu', en: 'Executive' },
  { id: 'offroad', vi: 'Off-road Beadlock', en: 'Off-road' },
];

const LEATHERS: { id: LeatherColor; vi: string; en: string; hex: string }[] = [
  { id: 'black', vi: 'Đen Obsidian', en: 'Obsidian Black', hex: '#1c1c22' },
  { id: 'cognac', vi: 'Cam / Da Bò', en: 'Cognac Tan', hex: '#8b4513' },
  { id: 'cream', vi: 'Kem Macchiato', en: 'Macchiato Cream', hex: '#e6dcc8' },
];

const ENVS: { id: StageEnv; vi: string; en: string }[] = [
  { id: 'neon', vi: 'Studio Neon', en: 'Dark Neon' },
  { id: 'glass', vi: 'Showroom Kính', en: 'Glass Hall' },
  { id: 'urban', vi: 'Đô thị Đêm', en: 'Urban Sky' },
];

export default function PaintSelector({
  paints,
  activeId,
  onSelect,
  wheelStyle,
  onWheelStyle,
  leatherColor,
  onLeatherColor,
  lights,
  onToggleLight,
  openables,
  onToggleOpenable,
  engineRevving,
  onRevEngine,
  stageEnv,
  onStageEnv,
  nightMode,
  onToggleNight,
  rainMode,
  onToggleRain,
  mode,
  lang,
}: Props) {
  const vi = lang === 'vi';
  const [tab, setTab] = useState<'style' | 'controls' | 'stage'>('style');
  const [expanded, setExpanded] = useState(true);
  const active = paints.find((p) => p.id === activeId) ?? paints[0];

  const pill = (on: boolean, accent = 'cyan') =>
    `flex items-center justify-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition ${
      on
        ? accent === 'amber'
          ? 'border-amber-400/70 bg-amber-400/20 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,.35)]'
          : 'border-cyan-400/70 bg-cyan-400/20 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.35)]'
        : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="pointer-events-auto absolute bottom-20 left-3 z-20 w-[min(19.5rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-neutral-900/65 p-3 shadow-2xl backdrop-blur-2xl sm:bottom-24 sm:left-6">
      {/* Thanh tiêu đề + chuyển Tab */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex flex-1 gap-1 rounded-full border border-white/10 bg-black/40 p-0.5 text-[11px]">
          <button
            onClick={() => { setTab('style'); setExpanded(true); }}
            className={`flex-1 rounded-full px-2 py-1 transition ${tab === 'style' ? 'bg-white font-medium text-black' : 'text-white/65 hover:text-white'}`}
          >
            {vi ? 'Ngoại/Nội thất' : 'Styling'}
          </button>
          <button
            onClick={() => { setTab('controls'); setExpanded(true); }}
            className={`flex-1 rounded-full px-2 py-1 transition ${tab === 'controls' ? 'bg-white font-medium text-black' : 'text-white/65 hover:text-white'}`}
          >
            {vi ? 'Tương tác' : 'Controls'}
          </button>
          <button
            onClick={() => { setTab('stage'); setExpanded(true); }}
            className={`flex-1 rounded-full px-2 py-1 transition ${tab === 'stage' ? 'bg-white font-medium text-black' : 'text-white/65 hover:text-white'}`}
          >
            {vi ? 'Bối cảnh' : 'Stage'}
          </button>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label="Thu gọn bảng tùy biến"
          className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white sm:hidden"
        >
          <ChevronUp size={15} className={expanded ? 'rotate-180 transition' : 'transition'} />
        </button>
      </div>

      <div className={`${expanded ? 'mt-2.5 block' : 'hidden sm:mt-2.5 sm:block'} space-y-2.5`}>
        {tab === 'style' && (
          <>
            {/* Màu sơn ngoại thất */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/50">
                <span>{vi ? 'Màu sơn' : 'Paint'}</span>
                <span className="text-white/80">{vi ? active.name : active.nameEn} · {finishLabel[active.finish]}</span>
              </div>
              <div className="flex items-center gap-2">
                {paints.map((p) => (
                  <button
                    key={p.id}
                    title={p.name}
                    onClick={() => onSelect(p.id)}
                    className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 ${
                      p.id === activeId ? 'border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.7)]' : 'border-white/20'
                    }`}
                    style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), ${p.hex} 55%)` }}
                  />
                ))}
              </div>
            </div>

            {/* Kiểu mâm xe (Wheel Customizer) */}
            <div>
              <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
                <Disc size={11} className="text-cyan-300" /> {vi ? 'Kiểu mâm xe' : 'Wheel style'}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {WHEELS.map((w) => (
                  <button key={w.id} onClick={() => onWheelStyle(w.id)} className={pill(wheelStyle === w.id)}>
                    <span className="truncate">{vi ? w.vi : w.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Màu da ghế nội thất (nổi bật khi ở chế độ Cockpit) */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/50">
                <span>{vi ? 'Da nội thất' : 'Interior leather'}</span>
                {mode === 'interior' && <span className="text-cyan-300">{vi ? 'Đang xem Buồng lái' : 'Cockpit active'}</span>}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {LEATHERS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onLeatherColor(l.id)}
                    className={`flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] transition ${
                      leatherColor === l.id ? 'border-cyan-300 bg-cyan-400/15 text-white' : 'border-white/10 bg-white/5 text-white/65 hover:text-white'
                    }`}
                  >
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30" style={{ backgroundColor: l.hex }} />
                    <span className="truncate">{vi ? l.vi : l.en}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'controls' && (
          <>
            {/* Đèn pha LED, DRL & Xin-nhan khẩn cấp Hazards */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/50">
                <span>{vi ? 'Hệ thống chiếu sáng (Phím L)' : 'Lighting (Key L)'}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => onToggleLight('headlights')} className={pill(lights.headlights)}>
                  <Lightbulb size={12} /> {vi ? 'Đèn pha' : 'Headlamp'}
                </button>
                <button onClick={() => onToggleLight('drl')} className={pill(lights.drl)}>
                  <Sun size={12} /> DRL
                </button>
                <button onClick={() => onToggleLight('hazards')} className={pill(lights.hazards, 'amber')}>
                  <TriangleAlert size={12} /> Hazard
                </button>
              </div>
            </div>

            {/* Mở 4 Cửa, Nắp ca-pô, Cốp sau */}
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
                {vi ? 'Đóng / Mở chi tiết thân vỏ' : 'Open / Close body parts'}
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => onToggleOpenable('doors')} className={pill(openables.doors)}>
                  <DoorOpen size={12} /> {vi ? '4 Cửa' : '4 Doors'}
                </button>
                <button onClick={() => onToggleOpenable('hood')} className={pill(openables.hood)}>
                  <SlidersHorizontal size={12} /> {vi ? 'Ca-pô' : 'Hood'}
                </button>
                <button onClick={() => onToggleOpenable('trunk')} className={pill(openables.trunk)}>
                  <SlidersHorizontal size={12} /> {vi ? 'Cốp sau' : 'Trunk'}
                </button>
              </div>
            </div>

            {/* Nút nổ máy & rú ga (Engine SFX) */}
            <button
              onClick={onRevEngine}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition ${
                engineRevving
                  ? 'border-orange-400 bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-200 shadow-[0_0_20px_rgba(249,115,22,.45)] animate-pulse'
                  : 'border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-100 hover:from-cyan-500/30 hover:to-indigo-500/30'
              }`}
            >
              <Volume2 size={14} />
              {engineRevving
                ? vi ? 'Đang rú ga động cơ...' : 'Revving engine...'
                : vi ? 'Thử tiếng nổ động cơ (Phím E)' : 'Start / Rev Engine (Key E)'}
            </button>
          </>
        )}

        {tab === 'stage' && (
          <>
            {/* Đổi 3 bối cảnh sân khấu */}
            <div>
              <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
                <Building2 size={11} className="text-cyan-300" /> {vi ? 'Bối cảnh Showroom' : 'Environment'}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {ENVS.map((e) => (
                  <button key={e.id} onClick={() => onStageEnv(e.id)} className={pill(stageEnv === e.id)}>
                    <span className="truncate">{vi ? e.vi : e.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chế độ Ban đêm & Thời tiết Mưa sàn ướt */}
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
                {vi ? 'Thời gian & Thời tiết' : 'Lighting & Weather'}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={onToggleNight} className={pill(nightMode)}>
                  {nightMode ? <Moon size={12} /> : <Sun size={12} />}
                  {nightMode ? (vi ? 'Ban đêm (Night)' : 'Night Mode') : (vi ? ' Tiêu chuẩn (Day)' : 'Studio Day')}
                </button>
                <button onClick={onToggleRain} className={pill(rainMode)}>
                  <CloudRain size={12} />
                  {rainMode ? (vi ? 'Đang mưa (Sàn ướt)' : 'Rain & Wet Floor') : (vi ? 'Bật hiệu ứng Mưa' : 'Enable Rain')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
