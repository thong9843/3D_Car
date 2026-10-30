import { Car, Armchair, Wrench, RotateCw, Pause } from 'lucide-react';
import type { Lang, ViewMode } from '../../types/automotive';

interface Props {
  mode: ViewMode;
  onMode: (m: ViewMode) => void;
  autoRotate: boolean;
  onToggleRotate: () => void;
  lang: Lang;
}

export default function ModeSwitchDock({ mode, onMode, autoRotate, onToggleRotate, lang }: Props) {
  const vi = lang === 'vi';
  const modes = [
    { id: 'exterior' as const, icon: Car, label: vi ? 'Ngoại thất 360°' : 'Exterior 360°' },
    { id: 'interior' as const, icon: Armchair, label: vi ? 'Buồng lái' : 'Cockpit' },
    { id: 'xray' as const, icon: Wrench, label: vi ? 'Khung gầm X-Ray' : 'Chassis X-Ray' },
  ];
  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-neutral-900/60 p-1.5 shadow-2xl backdrop-blur-2xl">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onMode(id)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
            mode === id
              ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 font-medium text-black shadow-[0_0_16px_rgba(34,211,238,.5)]'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
      <div className="mx-1 h-6 w-px bg-white/15" />
      <button
        onClick={onToggleRotate}
        title={vi ? 'Tự động xoay' : 'Auto rotate'}
        className={`rounded-full p-2 transition ${autoRotate ? 'text-cyan-300' : 'text-white/50'} hover:bg-white/10`}
      >
        {autoRotate ? <RotateCw size={16} /> : <Pause size={16} />}
      </button>
    </div>
  );
}

