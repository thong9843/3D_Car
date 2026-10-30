import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { X, Cog, BadgeCheck, Box, Camera, ImageOff } from 'lucide-react';
import type { Car, Hotspot, Lang, RealImages } from '../../types/automotive';

interface Props {
  car: Car;
  hotspot: Hotspot | null;
  onClose: () => void;
  lang: Lang;
}

type Tab = '3d' | 'photo';
type ImgGroup = keyof RealImages;

const GROUP_LABEL: Record<ImgGroup, [string, string]> = {
  exterior: ['Ngoại thất', 'Exterior'],
  interior: ['Nội thất', 'Interior'],
  engine: ['Động cơ / Khoang máy', 'Engine bay'],
};

const defaultGroup = (h: Hotspot): ImgGroup => (h.mode === 'interior' ? 'interior' : h.mode === 'xray' ? 'engine' : 'exterior');

function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-gradient-to-br from-cyan-900/30 via-neutral-800 to-indigo-900/30 text-xs text-white/50">
        <ImageOff size={20} className="text-cyan-300/70" /> Ảnh đang được cập nhật
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="aspect-[16/10] w-full rounded-xl border border-white/10 object-cover"
    />
  );
}

/** Bảng kính mờ (glassmorphism) hiển thị cấu tạo kỹ thuật của bộ phận được chọn. */
export default function ComponentModal({ car, hotspot, onClose, lang }: Props) {
  const [tab, setTab] = useState<Tab>('3d');
  const [group, setGroup] = useState<ImgGroup>('exterior');

  // Mỗi lần chọn bộ phận mới: quay về tab 3D và gợi ý nhóm ảnh tương ứng
  useEffect(() => {
    setTab('3d');
    if (hotspot) setGroup(defaultGroup(hotspot));
  }, [hotspot]);

  if (!hotspot) return null;
  const vi = lang === 'vi';
  const tabBtn = (id: Tab, icon: ReactElement, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] sm:gap-1.5 sm:px-3 sm:text-xs transition ${
        tab === id ? 'bg-white text-black shadow' : 'text-white/70 hover:bg-white/10'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <section className="pointer-events-auto absolute inset-x-2 bottom-20 top-auto z-40 flex max-h-[58vh] animate-slideIn flex-col sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-20 sm:max-h-none sm:w-[22rem] overflow-hidden rounded-3xl border border-white/15 bg-neutral-900/55 shadow-[0_20px_60px_rgba(0,0,0,.6)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 pb-3 sm:p-5 sm:pb-3">
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

      <div className="mx-4 mt-3 flex sm:mx-5 gap-1 rounded-full border border-white/10 bg-black/40 p-1" role="tablist">
        {tabBtn('3d', <Box size={13} />, vi ? 'Mô hình bóc tách 3D' : '3D breakdown')}
        {tabBtn('photo', <Camera size={13} />, vi ? 'Ảnh thực tế' : 'Real photos')}
      </div>

      {tab === '3d' ? (
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4 text-sm sm:p-5">
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
      ) : (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4 text-sm sm:p-5">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(GROUP_LABEL) as ImgGroup[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  group === g ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100' : 'border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {GROUP_LABEL[g][vi ? 0 : 1]}
              </button>
            ))}
          </div>
          {car.realImages[group].map((src, i) => (
            <Photo key={src} src={src} alt={`${car.brand} ${car.model} ${GROUP_LABEL[group][1]} ${i + 1}`} />
          ))}
          <p className="text-[10px] text-white/35">
            {vi ? 'Ảnh minh họa mang tính tham khảo trước khi mua xe.' : 'Illustrative photos for pre-purchase reference.'}
          </p>
        </div>
      )}
    </section>
  );
}
