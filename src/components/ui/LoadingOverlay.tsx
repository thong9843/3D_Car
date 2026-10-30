import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import type { Lang } from '../../types/automotive';

/** Màn hình tải tài nguyên 3D (.glb, texture) với thanh % tiến trình; tự ẩn mượt khi xong. */
export default function LoadingOverlay({ lang }: { lang: Lang }) {
  const { active, progress, item } = useProgress();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      return;
    }
    const t = window.setTimeout(() => setShow(false), 450);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!show) return null;
  const pct = Math.min(100, Math.round(progress));
  const file = item ? item.split('/').pop()?.split('?')[0] : '';

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-[#04060b]/85 px-6 backdrop-blur-md transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-[0_0_28px_rgba(34,211,238,.7)] animate-pulse" />
      <div className="text-center">
        <div className="text-sm font-semibold tracking-wide text-white">VN SHOWROOM 3D</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
          {lang === 'vi' ? 'Đang nạp mô hình 3D' : 'Loading 3D model'}
        </div>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(34,211,238,.8)] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-[11px] text-white/50">
          <span className="truncate">{file}</span>
          <span className="tabular-nums text-white/80">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

