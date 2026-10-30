import { useEffect, useState } from 'react';
import { X, ArrowLeftRight, Check, Printer, Download } from 'lucide-react';
import type { Car, Lang } from '../../types/automotive';
import { formatVnd } from '../../data/carDatabase';

interface Props {
  open: boolean;
  onClose: () => void;
  cars: Car[];
  currentId: string;
  lang: Lang;
}

type Better = 'high' | 'low' | null;
interface SpecRow {
  label: string;
  values: (c: Car) => string;
  num?: (c: Car) => number;
  better?: Better;
}

const dims = (c: Car) =>
  `${c.market.sizeMm.length.toLocaleString('vi-VN')} x ${c.market.sizeMm.width.toLocaleString('vi-VN')} x ${c.market.sizeMm.height.toLocaleString('vi-VN')} mm`;

/** Bảng đối chiếu 2 hoặc cả 4 dòng xe cùng lúc (4-Car Comparison Matrix) kèm nút In & Tải bản so sánh. */
export default function ComparisonModal({ open, onClose, cars, currentId, lang }: Props) {
  const vi = lang === 'vi';
  const [count, setCount] = useState<2 | 4>(4);
  const [slotIds, setSlotIds] = useState<string[]>(() => cars.map((c) => c.id));

  useEffect(() => {
    if (!open) return;
    setSlotIds((prev) => {
      const next = [...prev];
      if (next[0] !== currentId) {
        const idx = next.indexOf(currentId);
        if (idx > 0) [next[0], next[idx]] = [next[idx], next[0]];
        else next[0] = currentId;
      }
      return next;
    });
  }, [open, currentId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const activeCars = slotIds.slice(0, count).map((id) => cars.find((c) => c.id === id) ?? cars[0]);

  const rows: SpecRow[] = [
    { label: vi ? 'Phân khúc' : 'Segment', values: (c) => c.segment },
    {
      label: vi ? 'Giá niêm yết' : 'List price',
      values: (c) => formatVnd(c.market.listPriceVnd),
      num: (c) => c.market.listPriceVnd,
      better: 'low',
    },
    {
      label: vi ? 'Giá lăn bánh (ước tính)' : 'On-road (est.)',
      values: (c) => formatVnd(c.market.onRoadPriceVnd),
      num: (c) => c.market.onRoadPriceVnd,
      better: 'low',
    },
    { label: vi ? 'Động cơ / Pin' : 'Engine / Battery', values: (c) => c.market.engine },
    {
      label: vi ? 'Công suất cực đại' : 'Max Power',
      values: (c) => c.market.powerText,
      num: (c) => c.market.powerHp,
      better: 'high',
    },
    {
      label: vi ? 'Mô-men xoắn' : 'Max Torque',
      values: (c) => c.market.torqueText,
      num: (c) => c.market.torqueNm,
      better: 'high',
    },
    { label: vi ? 'Hệ dẫn động' : 'Drivetrain', values: (c) => c.market.driveSystem },
    { label: vi ? 'Kích thước D x R x C' : 'L x W x H', values: dims },
    {
      label: vi ? 'Chiều dài cơ sở' : 'Wheelbase',
      values: (c) => `${c.market.wheelbaseMm.toLocaleString('vi-VN')} mm`,
      num: (c) => c.market.wheelbaseMm,
      better: 'high',
    },
  ];

  const isWinner = (r: SpecRow, c: Car): boolean => {
    if (!r.better || !r.num) return false;
    const vals = activeCars.map(r.num);
    const target = r.better === 'high' ? Math.max(...vals) : Math.min(...vals);
    return r.num(c) === target;
  };

  const handleDownloadCsv = () => {
    const headers = ['Tiêu chí', ...activeCars.map((c) => `${c.brand} ${c.model} ${c.trim}`)];
    const lines = [
      headers.join(','),
      ...rows.map((r) => [r.label, ...activeCars.map((c) => `"${r.values(c).replace(/"/g, '""')}"`)].join(',')),
      ['Công nghệ an toàn ADAS', ...activeCars.map((c) => `"${c.market.adas.join('; ')}"`)].join(','),
      ['Tiện nghi nội thất', ...activeCars.map((c) => `"${c.market.comfort.join('; ')}"`)].join(','),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `so-sanh-xe-vn-showroom-${count}-xe.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-2 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-neutral-900/85 shadow-[0_20px_80px_rgba(0,0,0,.75)] backdrop-blur-2xl"
      >
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-white">
            <ArrowLeftRight size={18} className="text-cyan-300" />
            <h2 className="text-sm font-semibold sm:text-lg">
              {vi ? `Ma Trận So Sánh ${count} Dòng Xe` : `${count}-Car Comparison Matrix`}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex rounded-full border border-white/10 bg-black/40 p-0.5 text-xs">
              <button
                onClick={() => setCount(2)}
                className={`rounded-full px-2.5 py-1 transition ${count === 2 ? 'bg-white font-semibold text-black' : 'text-white/70'}`}
              >
                {vi ? '2 Xe' : '2 Cars'}
              </button>
              <button
                onClick={() => setCount(4)}
                className={`rounded-full px-2.5 py-1 transition ${count === 4 ? 'bg-white font-semibold text-black' : 'text-white/70'}`}
              >
                {vi ? '4 Xe' : '4 Cars'}
              </button>
            </div>

            <button
              onClick={handleDownloadCsv}
              title={vi ? 'Tải bản so sánh (.CSV Excel)' : 'Download CSV'}
              className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-xs text-cyan-200 hover:bg-cyan-400/20"
            >
              <Download size={13} /> <span className="hidden sm:inline">{vi ? 'Tải bảng (.CSV)' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => window.print()}
              title={vi ? 'In bản so sánh' : 'Print comparison'}
              className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/15"
            >
              <Printer size={13} /> <span className="hidden sm:inline">{vi ? 'In' : 'Print'}</span>
            </button>

            <button onClick={onClose} aria-label="Đóng" className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="no-scrollbar overflow-x-auto overflow-y-auto p-3 sm:p-5">
          <table className="w-full min-w-[36rem] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="w-32 py-2 pr-2 text-[10px] uppercase tracking-wider text-white/45 sm:w-40">
                  {vi ? 'Chọn dòng xe' : 'Select model'}
                </th>
                {activeCars.map((c, idx) => (
                  <th key={idx} className="px-2 py-2 align-bottom">
                    <select
                      value={c.id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSlotIds((prev) => {
                          const next = [...prev];
                          next[idx] = val;
                          return next;
                        });
                      }}
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-2.5 py-2 text-xs font-semibold text-white outline-none focus:border-cyan-400"
                    >
                      {cars.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-neutral-900">
                          {opt.brand} {opt.model} {opt.trim}
                        </option>
                      ))}
                    </select>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="py-2.5 pr-2 text-[10px] uppercase tracking-wider text-white/50 sm:text-xs">{r.label}</td>
                  {activeCars.map((c, idx) => {
                    const win = isWinner(r, c);
                    return (
                      <td
                        key={idx}
                        className={`px-2 py-2.5 text-xs sm:text-sm ${
                          win ? 'font-semibold text-emerald-300' : 'text-white/90'
                        }`}
                      >
                        {r.values(c)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr>
                <td className="py-2.5 pr-2 align-top text-[10px] uppercase tracking-wider text-white/50 sm:text-xs">
                  {vi ? 'Công nghệ an toàn ADAS' : 'ADAS safety'}
                </td>
                {activeCars.map((c, idx) => (
                  <td key={idx} className="px-2 py-2.5 align-top">
                    <ul className="space-y-1">
                      {c.market.adas.map((t) => (
                        <li key={t} className="flex gap-1.5 text-[11px] leading-snug text-white/85">
                          <Check size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 pr-2 align-top text-[10px] uppercase tracking-wider text-white/50 sm:text-xs">
                  {vi ? 'Tiện nghi nội thất' : 'Interior comfort'}
                </td>
                {activeCars.map((c, idx) => (
                  <td key={idx} className="px-2 py-2.5 align-top">
                    <ul className="space-y-1">
                      {c.market.comfort.map((t) => (
                        <li key={t} className="flex gap-1.5 text-[11px] leading-snug text-white/85">
                          <Check size={12} className="mt-0.5 shrink-0 text-cyan-300" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-[10px] text-white/40">
            {vi
              ? '* Chỉ số màu xanh lá biểu thị thông số tốt nhất trong các mẫu xe đang đặt trên bàn cân.'
              : '* Green values indicate the best specification among the compared models.'}
          </p>
        </div>
      </section>
    </div>
  );
}
