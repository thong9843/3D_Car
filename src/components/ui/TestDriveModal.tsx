import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X, CalendarCheck, CheckCircle2, Trash2 } from 'lucide-react';
import type { Car, Lang, TestDriveBooking } from '../../types/automotive';

interface Props {
  open: boolean;
  onClose: () => void;
  cars: Car[];
  currentCarId: string;
  lang: Lang;
}

const STORAGE_KEY = 'vn_showroom_test_drive_bookings_v1';

const DEALERS = [
  'Showroom Quận 1 — Lê Duẩn, TP. Hồ Chí Minh',
  'Showroom Thảo Điền — Xa lộ Hà Nội, TP. Thủ Đức',
  'Showroom Phạm Hùng — Nam Từ Liêm, Hà Nội',
  'Showroom Long Biên — Nguyễn Văn Linh, Hà Nội',
  'Showroom Hải Châu — Điện Biên Phủ, Đà Nẵng',
  'Showroom Ninh Kiều — Quang Trung, Cần Thơ',
];

function loadBookings(): TestDriveBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TestDriveBooking[]) : [];
  } catch {
    return [];
  }
}

/** Form Đăng ký Lái thử lưu trực tiếp vào localStorage kèm danh sách lịch hẹn đã đặt. */
export default function TestDriveModal({ open, onClose, cars, currentCarId, lang }: Props) {
  const vi = lang === 'vi';
  const [carId, setCarId] = useState(currentCarId);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dealer, setDealer] = useState(DEALERS[0]);
  const [date, setDate] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [bookings, setBookings] = useState<TestDriveBooking[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setCarId(currentCarId);
      setBookings(loadBookings());
      setSubmitted(false);
    }
  }, [open, currentCarId]);

  if (!open) return null;

  const car = cars.find((c) => c.id === carId) ?? cars[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    const item: TestDriveBooking = {
      id: `${Date.now()}`,
      carId: car.id,
      carName: `${car.brand} ${car.model} ${car.trim}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      dealer,
      date,
      notes: notes.trim(),
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    const next = [item, ...bookings];
    setBookings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* bộ nhớ đầy */
    }
    setSubmitted(true);
    setFullName('');
    setPhone('');
    setNotes('');
  };

  const handleRemove = (id: string) => {
    const next = bookings.filter((b) => b.id !== id);
    setBookings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

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
            <CalendarCheck size={18} className="text-cyan-300" />
            <h2 className="text-base font-semibold sm:text-lg">{vi ? 'Đăng Ký Lái Thử Thực Tế' : 'Book a Test Drive'}</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20">
            <X size={16} />
          </button>
        </header>

        <div className="no-scrollbar space-y-4 overflow-y-auto p-5 text-sm">
          {submitted && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-3 text-xs text-emerald-200">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>
                {vi
                  ? 'Đã lưu lịch hẹn lái thử! Chuyên viên tư vấn tại đại lý sẽ liên hệ xác nhận với bạn.'
                  : 'Test drive booking saved! Our showroom specialist will contact you shortly.'}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{vi ? 'Mẫu xe đăng ký' : 'Model'}</span>
                <select
                  value={car.id}
                  onChange={(e) => setCarId(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                >
                  {cars.map((c) => (
                    <option key={c.id} value={c.id} className="bg-neutral-900">
                      {c.brand} {c.model} {c.trim}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{vi ? 'Ngày lái thử' : 'Preferred date'}</span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{vi ? 'Họ và tên *' : 'Full name *'}</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={vi ? 'Nguyễn Văn A' : 'Your full name'}
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{vi ? 'Số điện thoại *' : 'Phone number *'}</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="090xxxxxxx"
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{vi ? 'Chọn Đại lý Showroom gần nhất' : 'Nearest Showroom Dealer'}</span>
              <select
                value={dealer}
                onChange={(e) => setDealer(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
              >
                {DEALERS.map((d) => (
                  <option key={d} value={d} className="bg-neutral-900">
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{vi ? 'Ghi chú thêm' : 'Additional notes'}</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={vi ? 'Khung giờ mong muốn (Sáng / Chiều)...' : 'Preferred time slot...'}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-2.5 text-xs font-semibold text-black shadow-[0_0_20px_rgba(34,211,238,.4)] transition hover:brightness-110"
            >
              {vi ? 'Xác nhận đặt lịch lái thử' : 'Confirm Test Drive Booking'}
            </button>
          </form>

          {bookings.length > 0 && (
            <div className="border-t border-white/10 pt-3">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-white/50">
                {vi ? `Lịch hẹn đã lưu (${bookings.length})` : `Saved bookings (${bookings.length})`}
              </div>
              <ul className="space-y-2">
                {bookings.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                    <div>
                      <div className="font-semibold text-cyan-300">{b.carName} — {b.date}</div>
                      <div className="text-white/80">{b.fullName} · {b.phone}</div>
                      <div className="text-[11px] text-white/50">{b.dealer}</div>
                    </div>
                    <button
                      onClick={() => handleRemove(b.id)}
                      title={vi ? 'Xóa lịch hẹn' : 'Delete'}
                      className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

