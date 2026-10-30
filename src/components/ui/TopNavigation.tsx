import { Search, Languages } from 'lucide-react';
import type { Car, Lang } from '../../types/automotive';

interface Props {
  cars: Car[];
  activeId: string;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (q: string) => void;
  lang: Lang;
  onLang: (l: Lang) => void;
}

export default function TopNavigation({ cars, activeId, onSelect, query, onQuery, lang, onLang }: Props) {
  return (
    <header className="pointer-events-auto absolute left-0 right-0 top-0 z-30 flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
      <div className="mr-2 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-[0_0_14px_rgba(34,211,238,.6)]" />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-white">VN SHOWROOM 3D</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
            {lang === 'vi' ? 'Trải nghiệm ô tô tương tác' : 'Interactive automotive'}
          </div>
        </div>
      </div>

      <nav className="no-scrollbar flex max-w-full flex-1 gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
        {cars.length === 0 && <span className="px-4 py-1.5 text-sm text-white/50">{lang === 'vi' ? 'Không tìm thấy xe' : 'No cars found'}</span>}
        {cars.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition ${
              c.id === activeId ? 'bg-white text-black shadow' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {c.brand} {c.model}
          </button>
        ))}
      </nav>

      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-xl">
        <Search size={15} className="text-white/60" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={lang === 'vi' ? 'Tìm xe...' : 'Search...'}
          className="w-28 bg-transparent text-sm text-white placeholder-white/40 outline-none sm:w-40"
        />
      </label>

      <button
        onClick={() => onLang(lang === 'vi' ? 'en' : 'vi')}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white/80 backdrop-blur-xl hover:text-white"
      >
        <Languages size={15} /> {lang.toUpperCase()}
      </button>
    </header>
  );
}

