import { Html } from '@react-three/drei';
import type { Hotspot } from '../../types/automotive';

interface Props {
  hotspot: Hotspot;
  active: boolean;
  onSelect: (h: Hotspot) => void;
}

/** Điểm neo 3D phát sáng: drei <Html> chiếu tọa độ thế giới ra pixel 2D mỗi khung hình. */
export default function HotspotBeacon({ hotspot, active, onSelect }: Props) {
  return (
    <Html position={hotspot.position} center zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
      <button
        type="button"
        aria-label={hotspot.title}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(hotspot);
        }}
        className="group relative flex h-9 w-9 items-center justify-center"
        style={{ pointerEvents: 'auto' }}
      >
        <span className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping2" />
        <span
          className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-[0_0_14px_4px_rgba(34,211,238,0.8)] transition-transform group-hover:scale-125 ${
            active ? 'bg-fuchsia-400' : 'bg-cyan-400'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        <span className="pointer-events-none absolute left-9 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-white/15 bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-md group-hover:block">
          {hotspot.title}
        </span>
      </button>
    </Html>
  );
}

