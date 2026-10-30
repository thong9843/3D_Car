import { useMemo, useState } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import type { Car, Lang } from '../../types/automotive';
import { formatVnd } from '../../data/carDatabase';

interface Props {
  open: boolean;
  onClose: () => void;
  cars: Car[];
  onSelectCar: (id: string) => void;
  lang: Lang;
}

type Budget = 'all' | 'under700' | '700to1100' | 'over1100';
type BodyStyle = 'all' | 'sedan' | 'crossover5' | 'suv7';
type Fuel = 'all' | 'ev' | 'gasoline' | 'diesel';

/** Trợ lý Tư vấn Chọn xe Thông minh theo Ngân sách, Kiểu dáng & Nhiên liệu. */
export default function CarFinderModal({ open, onClose, cars, onSelectCar, lang }: Props) {
  const vi = lang === 'vi';
  const [budget, setBudget] = useState<Budget>('all');
  const [bodyStyle, setBodyStyle] = useState<BodyStyle>('all');
  const [fuel, setFuel] = useState<Fuel>('all');

  const matches = useMemo(() => {
    return cars.filter((c) => {
      const p = c.market.listPriceVnd;
      if (budget === 'under700' && p >= 700_000_000) return false;
      if (budget === '700to1100' && (p < 700_000_000 || p > 1_100_000_000)) return false;
      if (budget === 'over1100' && p <= 1_100_000_000) return false;

      if (bodyStyle === 'sedan' && c.id !== 'vios') return false;
      if (bodyStyle === 'crossover5' && c.id !== 'vf8' && c.id !== 'cx5') return false;
      if (bodyStyle === 'suv7' && c.id !== 'everest') return false;

      if (fuel === 'ev' && c.body.layout !== 'ev') return false;
      if (fuel === 'diesel' && c.id !== 'everest') return false;
      if (fuel === 'gasoline' && (c.body.layout === 'ev' || c.id === 'everest')) return false;

      return true;
    });
  }, [cars, budget, bodyStyle, fuel]);

  if (!open) return null;

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
      active
        ? 'border-cyan-400 bg-cyan-400/20 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.3)]'
        : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-neutral-900/85 shadow-[0_20px_80px_rgba(0,0,0,.75)] backdrop-blur-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-indigo-300" />
            <h2 className="text-base font-semibold sm:text-lg">{vi ? 'Trợ Lý Tư Vấn Chọn Xe Thông Minh' : 'Smart Car Finder Wizard'}</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20">
            <X size={16} />
          </button>
        </header>

        <div className="no-scrollbar space-y-4 overflow-y-auto p-5 text-sm">
          {/* Bước 1: Ngân sách */}
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-white/50">{vi ? '1. Ngân sách dự kiến' : '1. Budget range'}</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setBudget('all')} className={chip(budget === 'all')}>{vi ? 'Tất cả' : 'Any'}</button>
              <button onClick={() => setBudget('under700')} className={chip(budget === 'under700')}>{vi ? 'Dưới 700 triệu' : '< 700M VND'}</button>
              <button onClick={() => setBudget('700to1100')} className={chip(budget === '700to1100')}>{vi ? '700 triệu – 1,1 tỷ' : '700M – 1.1B'}</button>
              <button onClick={() => setBudget('over1100')} className={chip(budget === 'over1100')}>{vi ? 'Trên 1,1 tỷ' : '> 1.1B VND'}</button>
            </div>
          </div>

          {/* Bước 2: Kiểu dáng */}
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-white/50">{vi ? '2. Kiểu dáng & Số chỗ' : '2. Body style & Seating'}</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setBodyStyle('all')} className={chip(bodyStyle === 'all')}>{vi ? 'Tất cả' : 'Any'}</button>
              <button onClick={() => setBodyStyle('sedan')} className={chip(bodyStyle === 'sedan')}>Sedan 5 chỗ</button>
              <button onClick={() => setBodyStyle('crossover5')} className={chip(bodyStyle === 'crossover5')}>SUV / Crossover 5 chỗ</button>
              <button onClick={() => setBodyStyle('suv7')} className={chip(bodyStyle === 'suv7')}>SUV 7 chỗ khung gầm rời</button>
            </div>
          </div>

          {/* Bước 3: Nhiên liệu */}
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-white/50">{vi ? '3. Loại động cơ / Nhiên liệu' : '3. Powertrain / Fuel'}</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFuel('all')} className={chip(fuel === 'all')}>{vi ? 'Tất cả' : 'Any'}</button>
              <button onClick={() => setFuel('ev')} className={chip(fuel === 'ev')}>{vi ? 'Thuần điện (EV)' : 'Electric (EV)'}</button>
              <button onClick={() => setFuel('gasoline')} className={chip(fuel === 'gasoline')}>{vi ? 'Động cơ Xăng' : 'Gasoline'}</button>
              <button onClick={() => setFuel('diesel')} className={chip(fuel === 'diesel')}>{vi ? 'Động cơ Diesel Bi-Turbo' : 'Diesel Bi-Turbo'}</button>
            </div>
          </div>

          {/* Danh sách gợi ý */}
          <div className="border-t border-white/10 pt-3">
            <div className="mb-2 text-xs text-white/60">
              {vi ? `Tìm thấy ${matches.length} mẫu xe phù hợp:` : `${matches.length} matching vehicle(s):`}
            </div>
            {matches.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center text-xs text-white/50">
                {vi ? 'Chưa có mẫu xe khớp đồng thời cả 3 tiêu chí. Hãy nới rộng bộ lọc!' : 'No exact match. Try broadening your filters!'}
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 p-3.5 transition hover:border-cyan-400/50"
                  >
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-cyan-300">{c.segment}</div>
                      <div className="text-sm font-semibold text-white">{c.brand} {c.model} {c.trim}</div>
                      <div className="mt-0.5 text-xs text-white/60">
                        {formatVnd(c.market.listPriceVnd)} · {c.quick.power} · {c.quick.drive}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSelectCar(c.id);
                        onClose();
                      }}
                      className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-3 py-2 text-xs font-semibold text-black"
                    >
                      {vi ? 'Khám phá 3D' : 'View in 3D'} <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

