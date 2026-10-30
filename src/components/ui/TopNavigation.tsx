import { useState } from 'react';
import { Search, Languages, ArrowLeftRight, Sparkles, Share2, Check, Volume2, VolumeX, Keyboard } from 'lucide-react';
import type { Car, Lang } from '../../types/automotive';

interface Props {
  cars: Car[];
  activeId: string;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (q: string) => void;
  lang: Lang;
  onLang: (l: Lang) => void;
  onCompare: () => void;
  onOpenFinder: () => void;
  onShareBuild: () => void;
  sfxMuted: boolean;
  onToggleMute: () => void;
}

export default function TopNavigation({
  cars,
  activeId,
  onSelect,
  query,
  onQuery,
  lang,
  onLang,
  onCompare,
  onOpenFinder,
  onShareBuild,
  sfxMuted,
  onToggleMute,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const vi = lang === 'vi';

  const handleShare = () => {
    onShareBuild();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="pointer-events-auto absolute left-0 right-0 top-0 z-30 flex flex-wrap items-center gap-1.5 px-3 py-2.5 sm:gap-2.5 sm:px-6 sm:py-3">
      <div className="flex items-center gap-2 sm:mr-1">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-[0_0_14px_rgba(34,211,238,.6)]" />
        <div className="hidden leading-tight md:block">
          <div className="text-sm font-semibold tracking-wide text-white">VN SHOWROOM 3D</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
            {vi ? 'Trải nghiệm ô tô tương tác' : 'Interactive automotive'}
          </div>
        </div>
      </div>

      <nav className="no-scrollbar order-last flex w-full basis-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-xl sm:order-none sm:w-auto sm:flex-1 sm:basis-0">
        {cars.length === 0 && (
          <span className="px-4 py-1.5 text-sm text-white/50">{vi ? 'Không tìm thấy xe' : 'No cars found'}</span>
        )}
        {cars.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition sm:px-4 sm:text-sm ${
              c.id === activeId ? 'bg-white font-medium text-black shadow' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {c.brand} {c.model}
          </button>
        ))}
      </nav>

      <label className="ml-auto flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-xl sm:ml-0 sm:flex-none">
        <Search size={14} className="shrink-0 text-white/60" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={vi ? 'Tìm xe...' : 'Search...'}
          className="w-full min-w-0 bg-transparent text-xs text-white placeholder-white/40 outline-none sm:w-28 sm:text-sm"
        />
      </label>

      {/* Nút Trợ lý Tư vấn Chọn xe thông minh (Smart Car Finder Wizard) */}
      <button
        onClick={onOpenFinder}
        title={vi ? 'Tư vấn chọn xe theo nhu cầu' : 'Smart Car Finder'}
        className="flex items-center gap-1.5 rounded-full border border-indigo-400/35 bg-indigo-500/15 px-2.5 py-1.5 text-xs text-indigo-100 backdrop-blur-xl transition hover:bg-indigo-500/25 sm:px-3 sm:text-sm"
      >
        <Sparkles size={14} className="text-indigo-300" />
        <span className="hidden lg:inline">{vi ? 'Tư vấn chọn xe' : 'Car Finder'}</span>
      </button>

      {/* Nút So sánh 4 xe */}
      <button
        onClick={onCompare}
        aria-label={vi ? 'So sánh xe' : 'Compare cars'}
        className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-xs text-cyan-100 backdrop-blur-xl transition hover:bg-cyan-400/20 sm:px-3 sm:text-sm"
      >
        <ArrowLeftRight size={14} /> <span className="hidden md:inline">{vi ? 'So sánh' : 'Compare'}</span>
      </button>

      {/* Nút Chia sẻ cấu hình (Share Custom Build URL) */}
      <button
        onClick={handleShare}
        title={vi ? 'Sao chép liên kết cấu hình xe hiện tại' : 'Share custom build URL'}
        className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white/80 backdrop-blur-xl transition hover:text-white sm:text-sm"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
        <span className="hidden xl:inline">{copied ? (vi ? 'Đã chép link!' : 'Copied!') : vi ? 'Chia sẻ' : 'Share'}</span>
      </button>

      {/* Bật/Tắt Âm thanh SFX & Xem Phím tắt */}
      <button
        onClick={onToggleMute}
        title={sfxMuted ? (vi ? 'Bật âm thanh' : 'Unmute SFX') : vi ? 'Tắt âm thanh' : 'Mute SFX'}
        className="rounded-full border border-white/10 bg-black/40 p-1.5 text-white/80 backdrop-blur-xl hover:text-white"
      >
        {sfxMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-cyan-300" />}
      </button>

      <div className="relative hidden sm:block">
        <button
          onClick={() => setShowKeys((v) => !v)}
          title={vi ? 'Phím tắt bàn phím' : 'Keyboard shortcuts'}
          className="rounded-full border border-white/10 bg-black/40 p-1.5 text-white/80 backdrop-blur-xl hover:text-white"
        >
          <Keyboard size={15} />
        </button>
        {showKeys && (
          <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl border border-white/15 bg-neutral-900/90 p-3 text-xs text-white/85 shadow-2xl backdrop-blur-2xl">
            <div className="mb-1.5 font-semibold text-cyan-300">{vi ? 'Phím tắt nhanh' : 'Keyboard Shortcuts'}</div>
            <ul className="space-y-1 text-[11px]">
              <li className="flex justify-between"><span>{vi ? 'Đổi góc Camera' : 'Cycle Camera'}</span><kbd className="rounded bg-white/10 px-1.5">C</kbd></li>
              <li className="flex justify-between"><span>{vi ? 'Bật/Tắt Đèn pha' : 'Toggle Lights'}</span><kbd className="rounded bg-white/10 px-1.5">L</kbd></li>
              <li className="flex justify-between"><span>{vi ? 'Thử Động cơ' : 'Rev Engine'}</span><kbd className="rounded bg-white/10 px-1.5">E</kbd></li>
              <li className="flex justify-between"><span>{vi ? 'Khung gầm X-Ray' : 'Toggle X-Ray'}</span><kbd className="rounded bg-white/10 px-1.5">X</kbd></li>
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={() => onLang(vi ? 'en' : 'vi')}
        className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:text-white sm:text-sm"
      >
        <Languages size={14} /> {lang.toUpperCase()}
      </button>
    </header>
  );
}
