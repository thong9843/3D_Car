import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { carDatabase, findCar } from './data/carDatabase';
import type {
  Hotspot,
  Lang,
  LeatherColor,
  LightsState,
  OpenableKey,
  OpenablesState,
  StageEnv,
  ViewMode,
  WheelStyle,
} from './types/automotive';
import TopNavigation from './components/ui/TopNavigation';
import SpecsHUD from './components/ui/SpecsHUD';
import PaintSelector from './components/ui/PaintSelector';
import ModeSwitchDock from './components/ui/ModeSwitchDock';
import ComponentModal from './components/ui/ComponentModal';
import ComparisonModal from './components/ui/ComparisonModal';
import OnRoadModal from './components/ui/OnRoadModal';
import LoanModal from './components/ui/LoanModal';
import TestDriveModal from './components/ui/TestDriveModal';
import CarFinderModal from './components/ui/CarFinderModal';
import HoverTooltip from './components/ui/HoverTooltip';
import { isSfxMuted, playEngineRev, playLatchSound, playUiClick, setSfxMuted } from './hooks/useSoundEffects';

const ShowroomStage = lazy(() => import('./components/3d/ShowroomStage'));
const LoadingOverlay = lazy(() => import('./components/ui/LoadingOverlay'));

/** Hiển thị trong lúc tải chunk Three.js (không phụ thuộc drei để giữ chunk tách rời) */
function BootSplash() {
  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-[#04060b]">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-[0_0_28px_rgba(34,211,238,.7)]" />
      <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">VN Showroom 3D</div>
    </div>
  );
}

const VALID_WHEELS: WheelStyle[] = ['sport', 'executive', 'offroad'];
const VALID_LEATHERS: LeatherColor[] = ['black', 'cognac', 'cream'];
const VALID_ENVS: StageEnv[] = ['neon', 'glass', 'urban'];

function readInitialUrlParams() {
  if (typeof window === 'undefined') {
    return { carId: carDatabase[0].id, paintId: null as string | null, wheel: 'sport' as WheelStyle, leather: 'black' as LeatherColor, env: 'neon' as StageEnv };
  }
  const sp = new URLSearchParams(window.location.search);
  const cParam = sp.get('car');
  const carObj = cParam ? carDatabase.find((c) => c.id === cParam) : undefined;
  const carId = carObj?.id ?? carDatabase[0].id;
  const colorParam = sp.get('color');
  const paintId = colorParam && (carObj ?? carDatabase[0]).paints.some((p) => p.id === colorParam) ? colorParam : null;
  const wParam = sp.get('wheels') as WheelStyle | null;
  const wheel: WheelStyle = wParam && VALID_WHEELS.includes(wParam) ? wParam : 'sport';
  const lParam = sp.get('leather') as LeatherColor | null;
  const leather: LeatherColor = lParam && VALID_LEATHERS.includes(lParam) ? lParam : 'black';
  const eParam = sp.get('env') as StageEnv | null;
  const env: StageEnv = eParam && VALID_ENVS.includes(eParam) ? eParam : 'neon';
  return { carId, paintId, wheel, leather, env };
}

export default function App() {
  const init = useMemo(readInitialUrlParams, []);
  const [carId, setCarId] = useState(init.carId);
  const [paintId, setPaintId] = useState<string | null>(init.paintId);
  const [wheelStyle, setWheelStyle] = useState<WheelStyle>(init.wheel);
  const [leatherColor, setLeatherColor] = useState<LeatherColor>(init.leather);
  const [stageEnv, setStageEnv] = useState<StageEnv>(init.env);
  const [nightMode, setNightMode] = useState(false);
  const [rainMode, setRainMode] = useState(false);
  const [cinematic, setCinematic] = useState(false);

  const [lights, setLights] = useState<LightsState>({ headlights: true, drl: true, hazards: false });
  const [openables, setOpenables] = useState<OpenablesState>({ doors: false, hood: false, trunk: false });
  const [engineRevving, setEngineRevving] = useState(false);
  const stopRevRef = useRef<(() => void) | null>(null);

  const [mode, setMode] = useState<ViewMode>('exterior');
  const [focus, setFocus] = useState<Hotspot | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Lang>('vi');
  const [sfxMuted, setSfxMutedState] = useState(() => isSfxMuted());

  const [compareOpen, setCompareOpen] = useState(false);
  const [onRoadOpen, setOnRoadOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);

  const car = findCar(carId);
  const paint = car.paints.find((p) => p.id === paintId) ?? car.paints[0];

  // Đồng bộ cấu hình hiện tại lên thanh địa chỉ URL (?car=vf8&color=red&wheels=sport...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams();
    sp.set('car', car.id);
    sp.set('color', paint.id);
    sp.set('wheels', wheelStyle);
    if (leatherColor !== 'black') sp.set('leather', leatherColor);
    if (stageEnv !== 'neon') sp.set('env', stageEnv);
    const nextUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [car.id, paint.id, wheelStyle, leatherColor, stageEnv]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return carDatabase;
    return carDatabase.filter((c) => `${c.brand} ${c.model} ${c.trim} ${c.segment}`.toLowerCase().includes(q));
  }, [query]);

  const changeCar = useCallback((id: string) => {
    playUiClick(580);
    setCarId(id);
    setPaintId(null);
    setFocus(null);
    setOpenables({ doors: false, hood: false, trunk: false });
  }, []);

  const changeMode = useCallback((m: ViewMode) => {
    playUiClick(720);
    setCinematic(false);
    setMode(m);
    setFocus(null);
  }, []);

  const handleToggleLight = useCallback((key: keyof LightsState) => {
    playUiClick(820);
    setLights((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleToggleOpenable = useCallback((key: OpenableKey) => {
    setOpenables((prev) => {
      const nextVal = !prev[key];
      playLatchSound(nextVal);
      return { ...prev, [key]: nextVal };
    });
  }, []);

  const handleRevEngine = useCallback(() => {
    if (stopRevRef.current) {
      stopRevRef.current();
      stopRevRef.current = null;
    }
    setEngineRevving(true);
    stopRevRef.current = playEngineRev(car.body.layout, () => {
      setEngineRevving(false);
      stopRevRef.current = null;
    });
  }, [car.body.layout]);

  const handleShareBuild = useCallback(() => {
    playUiClick(880);
    if (navigator.clipboard && typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = !sfxMuted;
    setSfxMuted(next);
    setSfxMutedState(next);
    if (!next) playUiClick(760);
  }, [sfxMuted]);

  // Phím tắt bàn phím: C (Camera mode), L (Lights), E (Engine), X (X-Ray)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'c') {
        e.preventDefault();
        playUiClick(700);
        setCinematic(false);
        setFocus(null);
        setMode((prev) => (prev === 'exterior' ? 'interior' : prev === 'interior' ? 'xray' : 'exterior'));
      } else if (k === 'l') {
        e.preventDefault();
        playUiClick(820);
        setLights((prev) => {
          const nextOn = !prev.headlights;
          return { ...prev, headlights: nextOn, drl: nextOn };
        });
      } else if (k === 'e') {
        e.preventDefault();
        handleRevEngine();
      } else if (k === 'x') {
        e.preventDefault();
        playUiClick(640);
        setCinematic(false);
        setFocus(null);
        setMode((prev) => (prev === 'xray' ? 'exterior' : 'xray'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRevEngine]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#04060b]">
      <div className="absolute inset-0">
        <Suspense fallback={<BootSplash />}>
          <ShowroomStage
            car={car}
            paint={paint}
            mode={mode}
            focus={focus}
            autoRotate={autoRotate}
            wheelStyle={wheelStyle}
            leatherColor={leatherColor}
            lights={lights}
            openables={openables}
            engineRevving={engineRevving}
            stageEnv={stageEnv}
            nightMode={nightMode}
            rainMode={rainMode}
            cinematic={cinematic}
            onSelectHotspot={(h) => {
              playUiClick(740);
              setCinematic(false);
              setFocus(h);
            }}
            onToggleOpenable={handleToggleOpenable}
            onModeChange={(m) => setMode(m)}
          />
          <LoadingOverlay lang={lang} />
        </Suspense>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <TopNavigation
          cars={filtered}
          activeId={carId}
          onSelect={changeCar}
          query={query}
          onQuery={setQuery}
          lang={lang}
          onLang={(l) => {
            playUiClick(680);
            setLang(l);
          }}
          onCompare={() => {
            playUiClick(720);
            setCompareOpen(true);
          }}
          onOpenFinder={() => {
            playUiClick(720);
            setFinderOpen(true);
          }}
          onShareBuild={handleShareBuild}
          sfxMuted={sfxMuted}
          onToggleMute={handleToggleMute}
        />

        <SpecsHUD
          car={car}
          lang={lang}
          onOpenOnRoad={() => {
            playUiClick(720);
            setOnRoadOpen(true);
          }}
          onOpenLoan={() => {
            playUiClick(720);
            setLoanOpen(true);
          }}
          onOpenTestDrive={() => {
            playUiClick(780);
            setTestDriveOpen(true);
          }}
        />

        <PaintSelector
          paints={car.paints}
          activeId={paint.id}
          onSelect={(id) => {
            playUiClick(650);
            setPaintId(id);
          }}
          wheelStyle={wheelStyle}
          onWheelStyle={(w) => {
            playUiClick(690);
            setWheelStyle(w);
          }}
          leatherColor={leatherColor}
          onLeatherColor={(l) => {
            playUiClick(690);
            setLeatherColor(l);
          }}
          lights={lights}
          onToggleLight={handleToggleLight}
          openables={openables}
          onToggleOpenable={handleToggleOpenable}
          engineRevving={engineRevving}
          onRevEngine={handleRevEngine}
          stageEnv={stageEnv}
          onStageEnv={(e) => {
            playUiClick(710);
            setStageEnv(e);
          }}
          nightMode={nightMode}
          onToggleNight={() => {
            playUiClick(710);
            setNightMode((v) => !v);
          }}
          rainMode={rainMode}
          onToggleRain={() => {
            playUiClick(710);
            setRainMode((v) => !v);
          }}
          mode={mode}
          lang={lang}
        />

        <ModeSwitchDock
          mode={mode}
          onMode={changeMode}
          autoRotate={autoRotate}
          onToggleRotate={() => {
            playUiClick(640);
            setAutoRotate((v) => !v);
          }}
          cinematic={cinematic}
          onToggleCinematic={() => {
            playUiClick(800);
            setFocus(null);
            setCinematic((v) => !v);
          }}
          lang={lang}
        />

        <ComponentModal car={car} hotspot={focus} onClose={() => setFocus(null)} lang={lang} />
        <ComparisonModal open={compareOpen} onClose={() => setCompareOpen(false)} cars={carDatabase} currentId={carId} lang={lang} />
        <OnRoadModal
          open={onRoadOpen}
          onClose={() => setOnRoadOpen(false)}
          cars={carDatabase}
          currentCarId={carId}
          lang={lang}
          onOpenLoanWithAmount={(id) => {
            setCarId(id);
            setLoanOpen(true);
          }}
        />
        <LoanModal open={loanOpen} onClose={() => setLoanOpen(false)} cars={carDatabase} currentCarId={carId} lang={lang} />
        <TestDriveModal open={testDriveOpen} onClose={() => setTestDriveOpen(false)} cars={carDatabase} currentCarId={carId} lang={lang} />
        <CarFinderModal open={finderOpen} onClose={() => setFinderOpen(false)} cars={carDatabase} onSelectCar={changeCar} lang={lang} />
        <HoverTooltip lang={lang} />
      </div>
    </div>
  );
}
