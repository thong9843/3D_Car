import { Car, Armchair, Wrench, RotateCw, Pause, Clapperboard } from 'lucide-react';
import type { Lang, ViewMode } from '../../types/automotive';

interface Props {
  mode: ViewMode;
  onMode: (m: ViewMode) => void;
  autoRotate: boolean;
  onToggleRotate: () => void;
  cinematic: boolean;
  onToggleCinematic: () => void;
  lang: Lang;
}

export default function ModeSwitchDock({
  mode,
  onMode,
  autoRotate,
  onToggleRotate,
  cinematic,
  onToggleCinematic,
  lang,
}: Props) {
  const vi = lang === 'vi';
  const modes = [
    { id: 'exterior' as const, icon: Car, label: vi ? 'Ngoại thất 360°' : 'Exterior 360°' },
    { id: 'interior' as const, icon: Armchair, label: vi ? 'Buồng lái' : 'Cockpit' },
    { id: 'xray' as const, icon: Wrench, label: vi ? 'Khung gầm X-Ray' : 'Chassis X-Ray' },
  ];
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/10 bg-neutral-900/65 p-1 shadow-2xl backdrop-blur-2xl sm:bottom-5 sm:gap-1 sm:p-1.5">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          aria-label={label}
          title={label}
          onClick={() => onMode(id)}
          className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition sm:px-4 ${
            mode === id && !cinematic
              ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 font-medium text-black shadow-[0_0_16px_rgba(34,211,238,.5)]'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon size={16} />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}
      <div className="mx-0.5 h-6 w-px bg-white/15 sm:mx-1" />
      <button
        onClick={onToggleCinematic}
        title={vi ? 'Chế độ Điện ảnh Tự động (Cinematic Tour)' : 'Cinematic Auto-Tour'}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition ${
          cinematic
            ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-black shadow-[0_0_16px_rgba(245,158,11,.6)]'
            : 'text-white/75 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Clapperboard size={15} />
        <span className="hidden sm:inline">{vi ? 'Cinematic Tour' : 'Cinematic'}</span>
      </button>
      <button
        onClick={onToggleRotate}
        title={vi ? 'Tự động xoay' : 'Auto rotate'}
        className={`rounded-full p-2 transition ${autoRotate && !cinematic ? 'text-cyan-300' : 'text-white/50'} hover:bg-white/10`}
      >
        {autoRotate && !cinematic ? <RotateCw size={16} /> : <Pause size={16} />}
      </button>
    </div>
  );
}
