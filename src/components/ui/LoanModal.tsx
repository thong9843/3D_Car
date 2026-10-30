import { useEffect, useMemo, useState } from 'react';
import { X, Landmark, Table } from 'lucide-react';
import type { Car, Lang } from '../../types/automotive';
import { formatVnd } from '../../data/carDatabase';

interface Props {
  open: boolean;
  onClose: () => void;
  cars: Car[];
  currentCarId: string;
  lang: Lang;
}

interface ScheduleRow {
  month: number;
  opening: number;
  principal: number;
  interest: number;
  total: number;
  closing: number;
}

/** Bảng tính Vay mua xe trả góp (Dư nợ giảm dần) kèm lịch trả gốc + lãi chi tiết từng tháng. */
export default function LoanModal({ open, onClose, cars, currentCarId, lang }: Props) {
  const vi = lang === 'vi';
  const [carId, setCarId] = useState(currentCarId);
  const [downPct, setDownPct] = useState(20); // % trả trước (10% - 80%)
  const [years, setYears] = useState(5); // Thời hạn 1 - 8 năm
  const [rateYr, setRateYr] = useState(8.5); // Lãi suất %/năm
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    if (open) setCarId(currentCarId);
  }, [open, currentCarId]);

  const car = cars.find((c) => c.id === carId) ?? cars[0];
  const price = car.market.listPriceVnd;
  const downPayment = Math.round((price * downPct) / 100);
  const loanAmount = Math.max(0, price - downPayment);
  const months = years * 12;

  const { schedule, totalInterest, firstMonthPayment } = useMemo(() => {
    const rows: ScheduleRow[] = [];
    const monthlyPrincipal = months > 0 ? loanAmount / months : 0;
    const monthlyRate = rateYr / 100 / 12;
    let balance = loanAmount;
    let sumInterest = 0;

    for (let m = 1; m <= months; m++) {
      const interest = balance * monthlyRate;
      const total = monthlyPrincipal + interest;
      const closing = Math.max(0, balance - monthlyPrincipal);
      sumInterest += interest;
      rows.push({
        month: m,
        opening: Math.round(balance),
        principal: Math.round(monthlyPrincipal),
        interest: Math.round(interest),
        total: Math.round(total),
        closing: Math.round(closing),
      });
      balance = closing;
    }

    return {
      schedule: rows,
      totalInterest: Math.round(sumInterest),
      firstMonthPayment: rows[0]?.total ?? 0,
    };
  }, [loanAmount, months, rateYr]);

  if (!open) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-neutral-900/85 shadow-[0_20px_80px_rgba(0,0,0,.75)] backdrop-blur-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Landmark size={18} className="text-indigo-300" />
            <h2 className="text-base font-semibold sm:text-lg">{vi ? 'Bảng Tính Vay Mua Xe Trả Góp' : 'Auto Loan Calculator'}</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20">
            <X size={16} />
          </button>
        </header>

        <div className="no-scrollbar space-y-4 overflow-y-auto p-5 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{vi ? 'Dòng xe' : 'Vehicle'}</span>
              <select
                value={car.id}
                onChange={(e) => setCarId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-medium text-white outline-none focus:border-cyan-400"
              >
                {cars.map((c) => (
                  <option key={c.id} value={c.id} className="bg-neutral-900">
                    {c.brand} {c.model} ({formatVnd(c.market.listPriceVnd)})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wider text-white/50">
                <span>{vi ? 'Lãi suất ưu đãi (%/năm)' : 'Interest rate (%/yr)'}</span>
                <span className="font-semibold text-cyan-300">{rateYr.toFixed(1)}%/năm</span>
              </div>
              <input
                type="range"
                min={5}
                max={14}
                step={0.5}
                value={rateYr}
                onChange={(e) => setRateYr(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-white/60">{vi ? 'Trả trước' : 'Down payment'}</span>
                <span className="font-semibold text-white">{downPct}% ({formatVnd(downPayment)})</span>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={downPct}
                onChange={(e) => setDownPct(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </label>

            <label className="block rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-white/60">{vi ? 'Thời hạn vay' : 'Loan term'}</span>
                <span className="font-semibold text-white">{years} {vi ? 'năm' : 'yrs'} ({months} {vi ? 'tháng' : 'mos'})</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-indigo-400"
              />
            </label>
          </div>

          {/* Tóm tắt kết quả tài chính */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[11px] text-white/50">{vi ? 'Số tiền vay ngân hàng' : 'Loan principal'}</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-white">{formatVnd(loanAmount)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[11px] text-white/50">{vi ? 'Tổng tiền lãi dự kiến' : 'Total interest'}</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-amber-300">{formatVnd(totalInterest)}</div>
            </div>
            <div className="col-span-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3 sm:col-span-1">
              <div className="text-[11px] text-cyan-200">{vi ? 'Gốc + lãi tháng đầu' : 'First month payment'}</div>
              <div className="mt-1 text-base font-bold tabular-nums text-cyan-300">{formatVnd(firstMonthPayment)}</div>
            </div>
          </div>

          <button
            onClick={() => setShowSchedule((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-medium text-white/85 hover:bg-white/10"
          >
            <Table size={14} className="text-cyan-300" />
            {showSchedule
              ? vi ? 'Ẩn bảng lịch trả nợ từng tháng' : 'Hide monthly schedule'
              : vi ? `Xem lịch trả gốc + lãi chi tiết (${months} tháng)` : `View full ${months}-month schedule`}
          </button>

          {showSchedule && (
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 text-xs">
              <table className="w-full text-left tabular-nums">
                <thead className="sticky top-0 bg-neutral-900/95 text-[10px] uppercase text-white/50">
                  <tr>
                    <th className="px-3 py-2">{vi ? 'Kỳ' : 'Mo'}</th>
                    <th className="px-3 py-2">{vi ? 'Gốc trả' : 'Principal'}</th>
                    <th className="px-3 py-2">{vi ? 'Lãi trả' : 'Interest'}</th>
                    <th className="px-3 py-2">{vi ? 'Tổng phải trả' : 'Total'}</th>
                    <th className="px-3 py-2">{vi ? 'Dư nợ cuối' : 'Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/85">
                  {schedule.map((r) => (
                    <tr key={r.month}>
                      <td className="px-3 py-1.5 text-white/50">#{r.month}</td>
                      <td className="px-3 py-1.5">{formatVnd(r.principal)}</td>
                      <td className="px-3 py-1.5 text-amber-300/90">{formatVnd(r.interest)}</td>
                      <td className="px-3 py-1.5 font-semibold text-cyan-300">{formatVnd(r.total)}</td>
                      <td className="px-3 py-1.5 text-white/60">{formatVnd(r.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

