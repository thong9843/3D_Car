import { Gauge, Zap, Cog, Route } from 'lucide-react';
import type { Car, Lang } from '../../types/automotive';

export default function SpecsHUD({ car, lang }: { car: Car; lang: Lang }) {
  const items = [
    { icon: Gauge, label: lang === 'vi' ? 'Công suất' : 'Power', value: car.quick.power },
    { icon: Zap, label: lang === 'vi' ? 'Mô-men xoắn' : 'Torque', value: car.quick.torque },
    { icon: Cog, label: lang === 'vi' ? 'Dẫn động' : 'Drive', value: car.quick.drive },
    { icon: Route, label: car.quick.extraLabel, value: car.quick.extra },
  ];
  return (
    <aside className="pointer-events-auto absolute left-4 top-20 z-20 w-64 rounded-2xl border border-white/10 bg-neutral-900/50 p-4 shadow-2xl backdrop-blur-2xl sm:left-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">{car.segment}</div>
      <h1 className="mt-1 text-2xl font-semibold text-white">
        {car.brand} {car.model}
      </h1>
      <div className="text-sm text-white/60">{car.trim}</div>
      <p className="mt-2 text-xs leading-relaxed text-white/60">{car.tagline}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <Icon size={14} className="text-cyan-300" />
            <div className="mt-1 text-sm font-semibold text-white">{value}</div>
            <div className="text-[10px] leading-tight text-white/50">{label}</div>
          </div>
        ))}
      </div>
      <dl className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs">
        {car.dimensions.map((d) => (
          <div key={d.label} className="flex justify-between gap-2">
            <dt className="text-white/50">{d.label}</dt>
            <dd className="text-right text-white/90">{d.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-2 pt-1">
          <dt className="text-white/50">{lang === 'vi' ? 'Giá tham khảo' : 'Ref. price'}</dt>
          <dd className="font-semibold text-cyan-300">{car.price}</dd>
        </div>
      </dl>
    </aside>
  );
}

