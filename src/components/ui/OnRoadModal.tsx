import { useEffect, useState } from 'react';
import { X, Calculator, MapPin, ShieldCheck } from 'lucide-react';
import type { Car, Lang } from '../../types/automotive';
import { formatVnd } from '../../data/carDatabase';

interface Props {
  open: boolean;
  onClose: () => void;
  cars: Car[];
  currentCarId: string;
  lang: Lang;
  onOpenLoanWithAmount?: (carId: string) => void;
}

type Province = 'hanoi' | 'hcm' | 'other';

const PROVINCES: { id: Province; vi: string; en: string; taxRate: number; plateFee: number }[] = [
  { id: 'hanoi', vi: 'Hà Nội (12% · Biển 20tr)', en: 'Hanoi (12% tax)', taxRate: 0.12, plateFee: 20_000_000 },
  { id: 'hcm', vi: 'TP. Hồ Chí Minh (10% · Biển 20tr)', en: 'Ho Chi Minh City (10% tax)', taxRate: 0.10, plateFee: 20_000_000 },
  { id: 'other', vi: 'Tỉnh / Thành khác (10% · Biển 1tr)', en: 'Other Provinces (10% tax)', taxRate: 0.10, plateFee: 1_000_000 },
];

/** Bảng tính chi tiết Giá lăn bánh theo Tỉnh/Thành Việt Nam (Miễn 100% trước bạ cho xe điện VF8). */
export default function OnRoadModal({ open, onClose, cars, currentCarId, lang, onOpenLoanWithAmount }: Props) {
  const vi = lang === 'vi';
  const [carId, setCarId] = useState(currentCarId);
  const [province, setProvince] = useState<Province>('hanoi');
  const [bodyInsurance, setBodyInsurance] = useState(true);

  useEffect(() => {
    if (open) setCarId(currentCarId);
  }, [open, currentCarId]);

  if (!open) return null;

  const car = cars.find((c) => c.id === carId) ?? cars[0];
  const prov = PROVINCES.find((p) => p.id === province) ?? PROVINCES[0];
  const isEv = car.body.layout === 'ev';
  const is7Seats = car.id === 'everest';

  const listPrice = car.market.listPriceVnd;
  // Nghị định miễn 100% lệ phí trước bạ cho ô tô điện chạy pin (VF8)
  const effectiveTaxRate = isEv ? 0 : prov.taxRate;
  const registrationTax = Math.round(listPrice * effectiveTaxRate);
  const plateFee = prov.plateFee;
  const roadMaintenanceFee = 1_560_000; // 1 năm cho xe cá nhân dưới 9 chỗ
  const inspectionFee = 340_000; // Phí đăng kiểm
  const civilInsurance = is7Seats ? 873_400 : 480_700; // Bảo hiểm TNDS bắt buộc
  const physicalInsurance = bodyInsurance ? Math.round(listPrice * 0.014) : 0; // Bảo hiểm thân vỏ ~1.4%

  const totalOnRoad =
    listPrice +
    registrationTax +
    plateFee +
    roadMaintenanceFee +
    inspectionFee +
    civilInsurance +
    physicalInsurance;

  const items = [
    { label: vi ? 'Giá niêm yết hãng' : 'Manufacturer list price', value: listPrice, highlight: false },
    {
      label: isEv
        ? vi ? 'Lệ phí trước bạ (Xe điện: 0%)' : 'Registration tax (EV: 0%)'
        : `${vi ? 'Lệ phí trước bạ' : 'Registration tax'} (${Math.round(effectiveTaxRate * 100)}%)`,
      value: registrationTax,
      highlight: isEv,
    },
    { label: vi ? 'Phí cấp biển số' : 'License plate fee', value: plateFee, highlight: false },
    { label: vi ? 'Phí bảo trì đường bộ (01 năm)' : 'Road maintenance (1 yr)', value: roadMaintenanceFee, highlight: false },
    { label: vi ? 'Lệ phí đăng kiểm' : 'Inspection fee', value: inspectionFee, highlight: false },
    { label: vi ? 'Bảo hiểm TNDS bắt buộc' : 'Compulsory civil insurance', value: civilInsurance, highlight: false },
    ...(bodyInsurance
      ? [{ label: vi ? 'Bảo hiểm vật chất thân vỏ (1,4%)' : 'Physical body insurance (1.4%)', value: physicalInsurance, highlight: false }]
      : []),
  ];

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-neutral-900/85 shadow-[0_20px_80px_rgba(0,0,0,.75)] backdrop-blur-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Calculator size={18} className="text-cyan-300" />
            <h2 className="text-base font-semibold sm:text-lg">{vi ? 'Dự toán Giá Lăn Bánh' : 'On-Road Price Calculator'}</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20">
            <X size={16} />
          </button>
        </header>

        <div className="no-scrollbar space-y-4 overflow-y-auto p-5 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{vi ? 'Chọn mẫu xe' : 'Select model'}</span>
              <select
                value={car.id}
                onChange={(e) => setCarId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-medium text-white outline-none focus:border-cyan-400"
              >
                {cars.map((c) => (
                  <option key={c.id} value={c.id} className="bg-neutral-900">
                    {c.brand} {c.model} {c.trim}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-white/50">
                <MapPin size={11} /> {vi ? 'Nơi đăng ký biển số' : 'Registration area'}
              </span>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value as Province)}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-medium text-white outline-none focus:border-cyan-400"
              >
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.id} className="bg-neutral-900">
                    {vi ? p.vi : p.en}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white/85">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-400" />
              {vi ? 'Bao gồm Bảo hiểm vật chất thân vỏ (1,4%/năm)' : 'Include physical body insurance (1.4%/yr)'}
            </span>
            <input
              type="checkbox"
              checked={bodyInsurance}
              onChange={(e) => setBodyInsurance(e.target.checked)}
              className="h-4 w-4 accent-cyan-400"
            />
          </label>

          <dl className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-black/30">
            {items.map((it) => (
              <div key={it.label} className="flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm">
                <dt className="text-white/65">{it.label}</dt>
                <dd className={`font-medium tabular-nums ${it.highlight ? 'text-emerald-300' : 'text-white'}`}>
                  {it.value === 0 ? (vi ? '0 đ (Miễn 100%)' : '0 đ (Exempt)') : formatVnd(it.value)}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between bg-cyan-400/10 px-4 py-3 text-sm font-semibold">
              <dt className="text-cyan-200">{vi ? 'Tổng chi phí lăn bánh' : 'Total On-Road Price'}</dt>
              <dd className="text-base tabular-nums text-cyan-300 sm:text-lg">{formatVnd(totalOnRoad)}</dd>
            </div>
          </dl>

          {onOpenLoanWithAmount && (
            <button
              onClick={() => {
                onClose();
                onOpenLoanWithAmount(car.id);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-2.5 text-xs font-semibold text-black shadow-lg transition hover:brightness-110"
            >
              {vi ? 'Tính phương án Vay Trả Góp cho xe này →' : 'Calculate Auto Loan for this car →'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

