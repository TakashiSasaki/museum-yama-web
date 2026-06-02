import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map3D, Marker3D, type Map3DRef } from '@vis.gl/react-google-maps';
import { Home, Compass, Play, Pause, Layers, Eye, EyeOff, Zap } from 'lucide-react';
import { useHikes } from '../hooks/useHikes';
import yamaIcon from '../assets/yama_icon.svg';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export default function EarthPage() {
  const navigate = useNavigate();
  const { hikes, loading } = useHikes();
  const mapRef = useRef<Map3DRef>(null);
  
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [mapMode, setMapMode] = useState<'SATELLITE' | 'HYBRID' | 'ROADMAP'>('SATELLITE');
  const [labelsDisabled, setLabelsDisabled] = useState(true);
  const [isLowResolution, setIsLowResolution] = useState(true);
  const [selectedHike, setSelectedHike] = useState<any>(null);

  // Use refs to avoid stale closures in high-frequency animation loop and clean up timers correctly
  const selectedHikeRef = useRef<any>(null);
  const flyToTimerRef = useRef<any>(null);

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

  // Perform continuous rotation native via DOM property to bypass React virtual DOM diffing completely
  useEffect(() => {
    if (!isAutoRotate) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    
    // Bypass high-cost DOM getter in loop to eliminate Forced Reflows completely.
    // Sync starting heading once from the map if loaded, defaults to 0.
    let currentHeading = mapRef.current?.map3d?.heading ?? 0;

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      
      const map3d = mapRef.current?.map3d;
      if (map3d) {
        // Rotate by 4 degrees per second smoothly
        const rotationSpeed = 4; 
        const deltaRotation = (rotationSpeed * delta) / 1000;
        currentHeading = (currentHeading + deltaRotation) % 360;

        // Write only, never read from DOM - zero reflow overhead!
        map3d.heading = currentHeading;
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAutoRotate]);

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
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 md:p-6 pointer-events-auto border border-white/10 shadow-2xl">
            <h1 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-3">
              <img src={yamaIcon} alt="えひめの山" className="w-8 h-8 md:w-10 md:h-10 rounded-full" referrerPolicy="no-referrer" />
              えひめの山 3D
            </h1>
            <p className="text-gray-300 mt-2 text-sm md:text-base">
              Photorealistic 3D Tilesを使った大画面展示向けビューポート
            </p>
          </div>

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
            <button
              onClick={() => setIsLowResolution(!isLowResolution)}
              className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-4 rounded-full transition-colors border border-white/20 shadow-lg flex items-center justify-center gap-2"
            >
              <Zap className={`w-6 h-6 ${isLowResolution ? 'text-amber-400 fill-amber-400' : 'text-white'}`} />
              <span className="hidden md:inline font-medium">
                画質: {isLowResolution ? '高速(低画質)' : '標準(高画質)'}
              </span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-4 rounded-full transition-colors border border-white/20 shadow-lg flex items-center justify-center gap-2"
            >
              <Home className="w-6 h-6" />
              <span className="hidden md:inline font-medium">通常版へ</span>
            </button>
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
              width: isLowResolution ? '75%' : '100%',
              height: isLowResolution ? '75%' : '100%',
              top: '50%',
              left: '50%',
              transform: isLowResolution ? 'translate(-50%, -50%) scale(1.333333)' : 'translate(-50%, -50%) scale(1)',
              transformOrigin: 'center center',
            }}
          >
            <Map3D
              ref={mapRef}
              defaultCenter={{ lat: 33.8416, lng: 132.7661, altitude: 0 }}
              defaultHeading={0}
              defaultTilt={60}
              defaultRange={50000}
              mode={mapMode}
              defaultLabelsDisabled={labelsDisabled}
            >
              {selectedHike && (
                <Marker3D
                  position={{
                    lat: selectedHike.summitLocation?.lat || selectedHike.startLocation.lat,
                    lng: selectedHike.summitLocation?.lng || selectedHike.startLocation.lng,
                    altitude: selectedHike.summitLocation?.elevation || 0,
                  }}
                  label={selectedHike.title}
                />
              )}
            </Map3D>
          </div>
        </div>

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
