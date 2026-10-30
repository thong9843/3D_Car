import type { Lang, PaintOption } from '../../types/automotive';

interface Props {
  paints: PaintOption[];
  activeId: string;
  onSelect: (id: string) => void;
  lang: Lang;
}

const finishLabel = { metallic: 'Kim loại', pearl: 'Ngọc trai', solid: 'Đặc' } as const;

export default function PaintSelector({ paints, activeId, onSelect, lang }: Props) {
  const active = paints.find((p) => p.id === activeId) ?? paints[0];
  return (
    <div className="pointer-events-auto absolute bottom-24 left-4 z-20 rounded-2xl border border-white/10 bg-neutral-900/50 p-3 backdrop-blur-2xl sm:left-6">
      <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/50">{lang === 'vi' ? 'Màu sơn' : 'Paint'}</div>
      <div className="flex gap-2">
        {paints.map((p) => (
          <button
            key={p.id}
            title={p.name}
            onClick={() => onSelect(p.id)}
            className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
              p.id === activeId ? 'border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.7)]' : 'border-white/20'
            }`}
            style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), ${p.hex} 55%)` }}
          />
        ))}
      </div>
      <div className="mt-2 text-sm text-white">{lang === 'vi' ? active.name : active.nameEn}</div>
      <div className="text-[11px] text-white/50">{finishLabel[active.finish]} · {active.hex.toUpperCase()}</div>
    </div>
  );
}

