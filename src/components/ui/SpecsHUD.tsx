import { useState } from 'react';
import { Gauge, Zap, Cog, Route, ChevronDown, Calculator, Landmark, CalendarCheck } from 'lucide-react';
import type { Car, Lang } from '../../types/automotive';

interface Props {
  car: Car;
  lang: Lang;
  onOpenOnRoad: () => void;
  onOpenLoan: () => void;
  onOpenTestDrive: () => void;
}

export default function SpecsHUD({ car, lang, onOpenOnRoad, onOpenLoan, onOpenTestDrive }: Props) {
  const [open, setOpen] = useState(false); // chỉ áp dụng cho mobile
  const vi = lang === 'vi';
  const items = [
    { icon: Gauge, label: vi ? 'Công suất' : 'Power', value: car.quick.power },
    { icon: Zap, label: vi ? 'Mô-men xoắn' : 'Torque', value: car.quick.torque },
    { icon: Cog, label: vi ? 'Dẫn động' : 'Drive', value: car.quick.drive },
    { icon: Route, label: car.quick.extraLabel, value: car.quick.extra },
  ];
  return (
    <aside className="pointer-events-auto absolute left-3 top-[6.75rem] z-20 w-[min(16.5rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-neutral-900/55 p-3 shadow-2xl backdrop-blur-2xl sm:left-6 sm:top-20 sm:w-68 sm:p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">{car.segment}</div>
      <h1 className="mt-0.5 text-xl font-semibold text-white sm:text-2xl">
        {car.brand} {car.model}
      </h1>
      <div className="flex items-center justify-between text-xs text-white/60 sm:text-sm">
        <span>{car.trim}</span>
        <span className="font-semibold text-cyan-300">{car.price}</span>
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-1.5 flex items-center gap-1 text-[11px] text-cyan-300 sm:hidden"
      >
        {vi ? (open ? 'Thu gọn' : 'Xem thông số & báo giá') : open ? 'Collapse' : 'Specs & Pricing'}
        <ChevronDown size={12} className={open ? 'rotate-180' : ''} />
      </button>

      <div className={open ? 'block' : 'hidden sm:block'}>
        <p className="mt-2 text-xs leading-relaxed text-white/60">{car.tagline}</p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/5 p-2">
              <Icon size={13} className="text-cyan-300" />
              <div className="mt-0.5 text-xs font-semibold text-white sm:text-sm">{value}</div>
              <div className="text-[10px] leading-tight text-white/50">{label}</div>
            </div>
          ))}
        </div>
        <dl className="mt-2.5 space-y-1 border-t border-white/10 pt-2.5 text-[11px]">
          {car.dimensions.map((d) => (
            <div key={d.label} className="flex justify-between gap-2">
              <dt className="text-white/50">{d.label}</dt>
              <dd className="text-right text-white/90">{d.value}</dd>
            </div>
          ))}
        </dl>

        {/* Bộ 3 công cụ Tài chính & Đăng ký Lái thử */}
        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onOpenOnRoad}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white/90 transition hover:border-cyan-400/50 hover:bg-cyan-400/15"
            >
              <Calculator size={13} className="text-cyan-300" />
              {vi ? 'Giá lăn bánh' : 'On-Road'}
            </button>
            <button
              onClick={onOpenLoan}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white/90 transition hover:border-cyan-400/50 hover:bg-cyan-400/15"
            >
              <Landmark size={13} className="text-indigo-300" />
              {vi ? 'Tính trả góp' : 'Auto Loan'}
            </button>
          </div>
          <button
            onClick={onOpenTestDrive}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_16px_rgba(34,211,238,.4)] transition hover:brightness-110"
          >
            <CalendarCheck size={14} />
            {vi ? 'Đăng ký lái thử ngay' : 'Book a Test Drive'}
          </button>
        </div>
      </div>
    </aside>
  );
}
