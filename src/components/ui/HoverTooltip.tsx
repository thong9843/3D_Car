import { useEffect, useRef } from 'react';
import { MousePointerClick } from 'lucide-react';
import type { Lang } from '../../types/automotive';
import { PART_META, useHoverState } from '../../hooks/hoverStore';

const OFFSET = 18;

/** Thẻ kính mờ bám theo con trỏ, hiển thị thông tin bộ phận đang hover trên mô hình 3D. */
export default function HoverTooltip({ lang }: { lang: Lang }) {
  const { part, hotspot } = useHoverState();
  const el = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -999, y: -999 });
  const pos = useRef({ x: -999, y: -999 });
  const raf = useRef(0);
  const active = part !== null;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (pos.current.x === -999) pos.current = { ...target.current };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Vòng lặp nội suy chỉ chạy khi tooltip hiển thị → không tốn FPS khi không hover
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const node = el.current;
      if (node) {
        const p = pos.current;
        const t = target.current;
        p.x += (t.x - p.x) * 0.25;
        p.y += (t.y - p.y) * 0.25;
        const w = node.offsetWidth;
        const h = node.offsetHeight;
        let x = p.x + OFFSET;
        let y = p.y + OFFSET;
        if (x + w > window.innerWidth - 8) x = p.x - w - OFFSET;
        if (y + h > window.innerHeight - 8) y = p.y - h - OFFSET;
        node.style.transform = `translate3d(${Math.max(8, x)}px, ${Math.max(8, y)}px, 0)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);

  const vi = lang === 'vi';
  const meta = part ? PART_META[part] : null;
  const title = hotspot ? (vi ? hotspot.title : hotspot.titleEn) : meta ? (vi ? meta.label : meta.labelEn) : '';
  const summary = hotspot ? hotspot.summary : meta ? (vi ? meta.summary : meta.summaryEn) : '';

  return (
    <div
      ref={el}
      aria-hidden={!active}
      className={`pointer-events-none fixed left-0 top-0 z-50 w-64 max-w-[calc(100vw-1rem)] rounded-2xl border border-white/20 bg-neutral-900/55 p-3 shadow-[0_12px_40px_rgba(0,0,0,.55)] backdrop-blur-xl will-change-transform transition-opacity duration-200 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transform: 'translate3d(-999px,-999px,0)', pointerEvents: 'none' }}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/90">{meta ? (vi ? meta.label : meta.labelEn) : ''}</div>
      <div className="mt-0.5 text-sm font-semibold leading-snug text-white">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-white/70">{summary}</p>
      {hotspot && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-white/10 pt-2 text-[11px] text-cyan-200">
          <MousePointerClick size={12} /> {vi ? 'Nhấp để xem phân tích chi tiết' : 'Click for detailed analysis'}
        </div>
      )}
    </div>
  );
}

