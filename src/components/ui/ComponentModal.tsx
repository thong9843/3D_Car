import { X, Cog, BadgeCheck } from 'lucide-react';
import type { Hotspot, Lang } from '../../types/automotive';

interface Props {
  hotspot: Hotspot | null;
  onClose: () => void;
  lang: Lang;
}

/** Bảng kính mờ (glassmorphism) hiển thị cấu tạo kỹ thuật của bộ phận được chọn. */
export default function ComponentModal({ hotspot, onClose, lang }: Props) {
  if (!hotspot) return null;
  const vi = lang === 'vi';
  return (
    <section className="pointer-events-auto absolute bottom-24 right-4 top-20 z-40 flex w-[22rem] max-w-[calc(100vw-2rem)] animate-slideIn flex-col overflow-hidden rounded-3xl border border-white/15 bg-neutral-900/55 shadow-[0_20px_60px_rgba(0,0,0,.6)] backdrop-blur-2xl sm:right-6">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-cyan-300/90">
            <Cog size={12} /> {vi ? 'Phân tích cấu tạo' : 'Technical breakdown'}
          </div>
          <h2 className="text-lg font-semibold leading-snug text-white">{vi ? hotspot.title : hotspot.titleEn}</h2>
          {vi && <div className="text-xs text-white/40">{hotspot.titleEn}</div>}
        </div>
        <button onClick={onClose} aria-label="Đóng" className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20">
          <X size={16} />
        </button>
      </div>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-5 text-sm">
        <p className="leading-relaxed text-white/80">{hotspot.summary}</p>

        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/50">{vi ? 'Thông số cốt lõi' : 'Key specs'}</div>
          <dl className="divide-y divide-white/5 rounded-xl border border-white/10 bg-black/20">
            {hotspot.specs.map((sp) => (
              <div key={sp.label} className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-white/50">{sp.label}</dt>
                <dd className="text-right font-medium text-white">{sp.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/50">{vi ? 'Nguyên lý vận hành' : 'Operating principle'}</div>
          <p className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 leading-relaxed text-white/80">{hotspot.principle}</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
          <BadgeCheck size={16} className="text-emerald-400" />
          <span className="text-white/50">{vi ? 'Trạng thái phiên bản:' : 'Trim status:'}</span>
          <span className="font-medium text-white">{hotspot.optionStatus}</span>
        </div>
      </div>
    </section>
  );
}

