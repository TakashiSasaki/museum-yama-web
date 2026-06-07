import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map3D, Marker3D, type Map3DRef } from '@vis.gl/react-google-maps';
import { Compass, Play, Pause, Layers, Eye, EyeOff, Zap, Copy, Check, X } from 'lucide-react';
import { useHikes } from '../hooks/useHikes';
import yamaIcon from '../assets/yama_icon.svg';
import mountainsData from '../../mountain_merged.json';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

// Filter out valid mountains once at module load
const validMountains = (mountainsData as any[]).filter(
  (m) => m.lat !== null && m.lon !== null
);

// Difficulty rank colors: 1: Purple, 2: Blue, 3: Green, 4: Orange, 5: Red
const getDifficultyColor = (rank: number) => {
  switch (rank) {
    case 1:
      return '#8b5cf6'; // Purple
    case 2:
      return '#3b82f6'; // Blue
    case 3:
      return '#10b981'; // Green
    case 4:
      return '#f97316'; // Orange
    case 5:
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray (default)
  }
};

// SVG Custom Markers with explicit heights to prevent CF3 (0x0 rendering)
const HeartMarker = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill={color} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.4))' }}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const PinMarker = ({ color }: { color: string }) => (
  <svg width="32" height="42" viewBox="0 0 24 30" fill={color} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.4))' }}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
    <circle cx="12" cy="9" r="3" fill="#ffffff" />
  </svg>
);

export default function EarthPage() {
  const navigate = useNavigate();
  const { hikes, loading } = useHikes();
  const mapRef = useRef<Map3DRef>(null);
  
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [mapMode, setMapMode] = useState<'SATELLITE' | 'HYBRID' | 'ROADMAP'>('SATELLITE');
  const [labelsDisabled, setLabelsDisabled] = useState(true);
  const [scaleMode, setScaleMode] = useState<'100' | '75' | '50' | '33'>('75');
  const [fpsLimit, setFpsLimit] = useState<number>(15); // Default to 15 FPS for energy-saving or low-spec Android signage devices
  const [selectedHike, setSelectedHike] = useState<any>(null);

  // Use refs to avoid stale closures in high-frequency animation loop and clean up timers correctly
  const selectedHikeRef = useRef<any>(null);
  const flyToTimerRef = useRef<any>(null);

  // HUD and Secret 5-second Long-press Logic
  const [showHud, setShowHud] = useState(false);
  const pressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef(false);

  const handlePressStart = useCallback((e: React.PointerEvent) => {
    isLongPressRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowHud(true);
      if ('vibrate' in navigator) {
        try { navigator.vibrate(100); } catch (_) {}
      }
    }, 5000); // 5 seconds
  }, []);

  const handlePressEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  const [cameraState, setCameraState] = useState<any>({
    center: null,
    heading: 0,
    tilt: 0,
    range: 0,
    roll: 0
  });
  const [copied, setCopied] = useState(false);

  // Monitor camera changes
  useEffect(() => {
    const map3d = mapRef.current?.map3d;
    if (!map3d) return;

    const updateCamera = () => {
      setCameraState({
        center: map3d.center ? {
          lat: map3d.center.lat,
          lng: map3d.center.lng,
          altitude: map3d.center.altitude
        } : null,
        heading: map3d.heading,
        tilt: map3d.tilt,
        range: map3d.range,
        roll: map3d.roll
      });
    };

    updateCamera();

    const events = [
      'gmp-centerchange',
      'gmp-headingchange',
      'gmp-tiltchange',
      'gmp-rangechange',
      'gmp-rollchange',
      'gmp-camerapositionchange'
    ];

    events.forEach(event => {
      map3d.addEventListener(event, updateCamera);
    });

    const interval = setInterval(updateCamera, 500);

    return () => {
      events.forEach(event => {
        map3d.removeEventListener(event, updateCamera);
      });
      clearInterval(interval);
    };
  }, [mapRef.current?.map3d]);

  const handleCopyParams = useCallback(() => {
    const jsonStr = JSON.stringify({
      center: cameraState.center ? {
        lat: Number(cameraState.center.lat.toFixed(6)),
        lng: Number(cameraState.center.lng.toFixed(6)),
        altitude: Math.round(cameraState.center.altitude)
      } : null,
      heading: Number(cameraState.heading.toFixed(2)),
      tilt: Number(cameraState.tilt.toFixed(2)),
      range: Math.round(cameraState.range)
    }, null, 2);

    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }, [cameraState]);

  useEffect(() => {
    selectedHikeRef.current = selectedHike;
  }, [selectedHike]);

  useEffect(() => {
    return () => {
      if (flyToTimerRef.current) {
        clearTimeout(flyToTimerRef.current);
      }
    };
  }, []);

  // Enter fullscreen by default if screen size is 3500x2000 or greater landscape
  useEffect(() => {
    const isUltraLandscape = window.innerWidth >= 3500 && window.innerHeight >= 2000 && window.innerWidth > window.innerHeight;
    if (!isUltraLandscape) return;

    const tryFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Auto-fullscreen request failed/blocked:', err);
        });
      }
    };

    // Try immediately (might be blocked by browser policy without active user gesture)
    tryFullscreen();

    // Hook into user gesture events to trigger fullscreen on their first interaction
    const events = ['click', 'pointerdown', 'keydown', 'touchstart'];
    const handler = () => {
      tryFullscreen();
      // Remove local listeners once triggered
      events.forEach((ex) => document.removeEventListener(ex, handler));
    };

    events.forEach((ex) => document.addEventListener(ex, handler, { passive: true }));

    return () => {
      events.forEach((ex) => document.removeEventListener(ex, handler));
    };
  }, []);

  // Perform continuous rotation native via DOM property to bypass React virtual DOM diffing completely
  useEffect(() => {
    if (!isAutoRotate) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let lastRenderTime = performance.now();
    
    // Bypass high-cost DOM getter in loop to eliminate Forced Reflows completely.
    // Sync starting heading once from the map if loaded, defaults to 0.
    let currentHeading = mapRef.current?.map3d?.heading ?? 0;

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      const elapsedSinceLastRender = currentTime - lastRenderTime;
      const fpsInterval = 1000 / fpsLimit;

      // If fpsLimit >= 60, don't throttle. Otherwise, match the target frame rate (e.g. 30 FPS, 15 FPS).
      if (fpsLimit >= 60 || elapsedSinceLastRender >= fpsInterval - 1) {
        if (fpsLimit < 60) {
          lastRenderTime = currentTime - (elapsedSinceLastRender % fpsInterval);
        } else {
          lastRenderTime = currentTime;
        }

        const map3d = mapRef.current?.map3d;
        if (map3d) {
          // Rotate by 4 degrees per second smoothly
          const rotationSpeed = 4; 
          const deltaRotation = (rotationSpeed * delta) / 1000;
          currentHeading = (currentHeading + deltaRotation) % 360;

          // Write only, never read from DOM - zero reflow overhead!
          map3d.heading = currentHeading;
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAutoRotate, fpsLimit]);

  // Synchronize dynamic labels setting directly on raw Map3D element
  // Since vis.gl react wrapper defaultLabelsDisabled only applies on mount
  useEffect(() => {
    const map3d = mapRef.current?.map3d;
    if (map3d) {
      map3d.defaultLabelsDisabled = labelsDisabled;
    }
  }, [labelsDisabled]);

  const handleSelectHike = useCallback((hike: any) => {
    setIsAutoRotate(false);
    setSelectedHike(hike);

    // Cancel any previous timer to avoid state collisions
    if (flyToTimerRef.current) {
      clearTimeout(flyToTimerRef.current);
    }

    const map3d = mapRef.current?.map3d;
    if (map3d) {
      const summit = hike.summitLocation || { lat: hike.startLocation.lat, lng: hike.startLocation.lng, elevation: 0 };
      
      // Calculate target camera properties:
      // Center at summit altitude, range 1414m (hypotenuse of 1km south and 1km altitude),
      // Tilt 45 degrees to look down towards center, heading 0 to face North (from South).
      const targetCamera = {
        center: { lat: summit.lat, lng: summit.lng, altitude: summit.elevation },
        range: 1414,
        tilt: 45,
        heading: 0,
      };

      // Use seamless native flying transition if available, otherwise apply instantly
      if (typeof (map3d as any).flyTo === 'function') {
        try {
          (map3d as any).flyTo({
            endCamera: targetCamera,
            durationMillis: 3000,
          });
          
          // Re-enable autorotate after flyover transition ends
          flyToTimerRef.current = setTimeout(() => {
            setIsAutoRotate(true);
          }, 3200);
          return;
        } catch (e) {
          console.warn('flyTo failed, switching properties instantly:', e);
        }
      }
      
      // Fallback
      map3d.center = targetCamera.center;
      map3d.range = targetCamera.range;
      map3d.tilt = targetCamera.tilt;
      map3d.heading = targetCamera.heading;
      setIsAutoRotate(true);
    }
  }, []);

  const handleResetDefaultView = useCallback(() => {
    setIsAutoRotate(false);
    setSelectedHike(null);

    // Cancel any previous timer to avoid state collisions
    if (flyToTimerRef.current) {
      clearTimeout(flyToTimerRef.current);
    }

    const map3d = mapRef.current?.map3d;
    if (map3d) {
      const defaultCamera = {
        center: { lat: 33.63679, lng: 133.049786, altitude: 677 },
        heading: -67.85,
        tilt: 59.37,
        range: 204170,
      };

      // Use seamless native flying transition if available, otherwise apply instantly
      if (typeof (map3d as any).flyTo === 'function') {
        try {
          (map3d as any).flyTo({
            endCamera: defaultCamera,
            durationMillis: 3000,
          });
          return;
        } catch (e) {
          console.warn('flyTo failed, switching properties instantly:', e);
        }
      }
      
      // Fallback
      map3d.center = defaultCamera.center;
      map3d.range = defaultCamera.range;
      map3d.tilt = defaultCamera.tilt;
      map3d.heading = defaultCamera.heading;
    }
  }, []);

  const toggleMode = () => {
    setMapMode((current) => {
      if (current === 'HYBRID') {
        setLabelsDisabled(false);
        return 'ROADMAP';
      }
      if (current === 'ROADMAP') {
        setLabelsDisabled(true);
        return 'SATELLITE';
      }
      setLabelsDisabled(false);
      return 'HYBRID';
    });
  };

  const toggleLabels = () => {
    const nextVal = !labelsDisabled;
    setLabelsDisabled(nextVal);
    if (nextVal) {
      setMapMode('SATELLITE');
    } else {
      setMapMode('HYBRID');
    }
  };

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="flex flex-col h-[100dvh] w-full bg-black overflow-hidden select-none">
        {/* Top UI Layout */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 pointer-events-none flex justify-between items-start">
          <button
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onClick={(e) => {
              if (isLongPressRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              handleResetDefaultView();
            }}
            className="pointer-events-auto bg-black/50 hover:bg-black/70 border border-white/10 hover:border-emerald-400 active:scale-95 transition-all text-white backdrop-blur-md rounded-full p-2 md:p-2.5 shadow-2xl flex items-center justify-center cursor-pointer"
            title="初期視点に戻す（5秒長押しで設定表示）"
          >
            <img src={yamaIcon} alt="アイコン" className="w-8 h-8 md:w-12 md:h-12 rounded-full pointer-events-none" referrerPolicy="no-referrer" />
          </button>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-4 rounded-full transition-colors border border-white/20 shadow-lg flex items-center justify-center gap-2"
            >
              {isAutoRotate ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              <span className="hidden md:inline font-medium">
                {isAutoRotate ? '回転停止' : '自動回転'}
              </span>
            </button>
            <button
              onClick={toggleMode}
              className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-4 rounded-full transition-colors border border-white/20 shadow-lg flex items-center justify-center gap-2"
            >
              <Layers className="w-6 h-6" />
              <span className="hidden md:inline font-medium">
                マップ: {mapMode === 'HYBRID' ? '地形+ラベル' : mapMode === 'ROADMAP' ? '地図' : '地形のみ'}
              </span>
            </button>
            <button
              onClick={toggleLabels}
              className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-4 rounded-full transition-colors border border-white/20 shadow-lg flex items-center justify-center gap-2"
            >
              {labelsDisabled ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              <span className="hidden md:inline font-medium">
                ラベル: {labelsDisabled ? '非表示' : '表示'}
              </span>
            </button>
            {/* パフォーマンス調整パネル */}
            <div className="pointer-events-auto bg-black/70 backdrop-blur-md text-white rounded-3xl p-4 border border-white/20 shadow-2xl flex flex-col gap-3.5 min-w-[240px]">
              <div className="flex items-center gap-2 text-amber-400 border-b border-white/10 pb-2">
                <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider font-sans">パフォーマンス調整</span>
              </div>

              {/* 解像度スケール */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-extrabold">
                  <span>表示解像度スケール</span>
                  <span className="text-amber-300">{scaleMode}%</span>
                </div>
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-white/5 border border-white/5 rounded-xl">
                  {(['100', '75', '50', '33'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setScaleMode(mode)}
                      className={`text-[10px] py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                        scaleMode === mode
                          ? 'bg-amber-500 text-black shadow-md font-extrabold'
                          : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      {mode}%
                    </button>
                  ))}
                </div>
              </div>

              {/* 回転更新レート */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-extrabold">
                  <span>自動回転フレームレート</span>
                  <span className="text-amber-300">{fpsLimit === 60 ? '標準(60)' : `${fpsLimit} FPS`}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-white/5 border border-white/5 rounded-xl">
                  {([60, 30, 15] as const).map((fps) => (
                    <button
                      key={fps}
                      onClick={() => setFpsLimit(fps)}
                      className={`text-[10px] py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                        fpsLimit === fps
                          ? 'bg-amber-500 text-black shadow-md font-extrabold'
                          : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      {fps === 60 ? '標準' : `${fps} FPS`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Map Area */}
        <div 
          className="flex-1 w-full bg-black relative overflow-hidden"
          onPointerDown={() => setIsAutoRotate(false)}
        >
          <div 
            className="absolute transition-all duration-300"
            style={{
              width: scaleMode === '100' ? '100%' : scaleMode === '75' ? '75%' : scaleMode === '50' ? '50%' : '33.3333%',
              height: scaleMode === '100' ? '100%' : scaleMode === '75' ? '75%' : scaleMode === '50' ? '50%' : '33.3333%',
              top: '50%',
              left: '50%',
              transform: scaleMode === '100' 
                ? 'translate(-50%, -50%) scale(1)' 
                : scaleMode === '75' 
                  ? 'translate(-50%, -50%) scale(1.333333)' 
                  : scaleMode === '50' 
                    ? 'translate(-50%, -50%) scale(2)' 
                    : 'translate(-50%, -50%) scale(3)',
              transformOrigin: 'center center',
            }}
          >
            <Map3D
              ref={mapRef}
              defaultCenter={{ lat: 33.63679, lng: 133.049786, altitude: 677 }}
              defaultHeading={-67.85}
              defaultTilt={59.37}
              defaultRange={204170}
              mode={mapMode}
              defaultLabelsDisabled={labelsDisabled}
            >
              {/* Show 3D Pin with name and elevation for all valid mountains in Ehime */}
              {validMountains.map((mountain) => {
                const color = getDifficultyColor(mountain.難易度ランク);
                const isRecommended = mountain.エントリーコースお勧め山 === true;
                return (
                  <Marker3D
                    key={`mountain-${mountain.No}`}
                    position={{
                      lat: mountain.lat,
                      lng: mountain.lon,
                      altitude: mountain.ele_gps || Number(mountain.標高) || 0,
                    }}
                    label={`${mountain.山名} (${mountain.標高}m)`}
                  >
                    {isRecommended ? (
                      <HeartMarker color={color} />
                    ) : (
                      <PinMarker color={color} />
                    )}
                  </Marker3D>
                );
              })}

              {selectedHike && (
                <Marker3D
                  position={{
                    lat: selectedHike.summitLocation?.lat || selectedHike.startLocation.lat,
                    lng: selectedHike.summitLocation?.lng || selectedHike.startLocation.lng,
                    altitude: selectedHike.summitLocation?.elevation || 0,
                  }}
                  label={selectedHike.title}
                >
                  <PinMarker color="#fcd34d" />
                </Marker3D>
              )}
            </Map3D>
          </div>
        </div>

        {/* Camera Parameters HUD */}
        {showHud && (
          <div className="absolute bottom-40 left-6 z-50 pointer-events-auto max-w-xs md:max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-black/85 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl text-white">
              <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-sans">Camera HUD</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyParams}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-white/10 hover:bg-white/20 active:bg-white/30 text-emerald-300 border border-white/10 transition-all font-semibold cursor-pointer"
                    title="視点パラメータをコピー"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    {copied ? 'コピー' : 'コピー'}
                  </button>
                  <button
                    onClick={() => setShowHud(false)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="HUDを閉じる"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 font-mono text-[10px] md:text-xs text-gray-300">
                {cameraState.center ? (
                  <>
                    <div className="flex justify-between border-b border-white/5 py-0.5 gap-4">
                      <span className="text-gray-500">Center Lat:</span>
                      <span>{cameraState.center.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-0.5 gap-4">
                      <span className="text-gray-500">Center Lng:</span>
                      <span>{cameraState.center.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-0.5 gap-4">
                      <span className="text-gray-500">Center Alt:</span>
                      <span>{Math.round(cameraState.center.altitude)}m</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 italic py-1">Initializing camera...</div>
                )}
                <div className="flex justify-between border-b border-white/5 py-0.5 gap-4">
                  <span className="text-gray-500">Heading:</span>
                  <span>{cameraState.heading.toFixed(2)}°</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-0.5 gap-4">
                  <span className="text-gray-500">Tilt:</span>
                  <span>{cameraState.tilt.toFixed(2)}°</span>
                </div>
                <div className="flex justify-between py-0.5 gap-4">
                  <span className="text-gray-500">Range:</span>
                  <span>{Math.round(cameraState.range).toLocaleString()}m</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Drawer for interactively picking a mountain */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-5xl pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-4 overflow-x-auto flex gap-4 no-scrollbar shadow-2xl">
            {!loading && hikes.map((hike) => {
              const isSelected = selectedHike?.id === hike.id;
              return (
                <button
                  key={hike.id}
                  onClick={() => handleSelectHike(hike)}
                  className={`flex-shrink-0 text-white rounded-xl p-4 text-left border transition-all min-w-[200px] flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : 'bg-white/10 hover:bg-white/20 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Compass size={18} />
                    <span className="font-semibold text-white text-lg">{hike.title}</span>
                  </div>
                  <span className="text-sm text-gray-300">距離 {hike.distanceKm} km</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
