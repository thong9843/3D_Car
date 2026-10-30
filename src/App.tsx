import { useMemo, useState } from 'react';
import { carDatabase, findCar } from './data/carDatabase';
import type { Hotspot, Lang, ViewMode } from './types/automotive';
import ShowroomStage from './components/3d/ShowroomStage';
import TopNavigation from './components/ui/TopNavigation';
import SpecsHUD from './components/ui/SpecsHUD';
import PaintSelector from './components/ui/PaintSelector';
import ModeSwitchDock from './components/ui/ModeSwitchDock';
import ComponentModal from './components/ui/ComponentModal';

export default function App() {
  const [carId, setCarId] = useState(carDatabase[0].id);
  const [paintId, setPaintId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('exterior');
  const [focus, setFocus] = useState<Hotspot | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Lang>('vi');

  const car = findCar(carId);
  const paint = car.paints.find((p) => p.id === paintId) ?? car.paints[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return carDatabase;
    return carDatabase.filter((c) => `${c.brand} ${c.model} ${c.trim} ${c.segment}`.toLowerCase().includes(q));
  }, [query]);

  const changeCar = (id: string) => {
    setCarId(id);
    setPaintId(null);
    setFocus(null);
  };
  const changeMode = (m: ViewMode) => {
    setMode(m);
    setFocus(null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#04060b]">
      <div className="absolute inset-0">
        <ShowroomStage
          car={car}
          paint={paint}
          mode={mode}
          focus={focus}
          autoRotate={autoRotate}
          onSelectHotspot={setFocus}
        />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <TopNavigation
          cars={filtered}
          activeId={carId}
          onSelect={changeCar}
          query={query}
          onQuery={setQuery}
          lang={lang}
          onLang={setLang}
        />
        <SpecsHUD car={car} lang={lang} />
        <PaintSelector paints={car.paints} activeId={paint.id} onSelect={setPaintId} lang={lang} />
        <ModeSwitchDock
          mode={mode}
          onMode={changeMode}
          autoRotate={autoRotate}
          onToggleRotate={() => setAutoRotate((v) => !v)}
          lang={lang}
        />
        <ComponentModal hotspot={focus} onClose={() => setFocus(null)} lang={lang} />
      </div>
    </div>
  );
}

