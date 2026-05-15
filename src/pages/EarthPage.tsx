import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map3D } from '@vis.gl/react-google-maps';
import { Mountain, Home, Compass, Play, Pause } from 'lucide-react';
import { useHikes } from '../hooks/useHikes';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export default function EarthPage() {
  const navigate = useNavigate();
  const { hikes, loading } = useHikes();
  
  const [center, setCenter] = useState({ lat: 33.8416, lng: 132.7661, altitude: 0 });
  const [heading, setHeading] = useState(0);
  const [tilt, setTilt] = useState(60);
  const [range, setRange] = useState(50000);
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      
      // Rotate by 5 degrees per second
      const rotationSpeed = 5; 
      const deltaRotation = (rotationSpeed * delta) / 1000;
      
      setHeading((prev) => (prev + deltaRotation) % 360);
      
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAutoRotate) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAutoRotate]);

  const handleSelectHike = useCallback((lat: number, lng: number) => {
    setCenter({ lat, lng, altitude: 0 });
    setRange(3000);
    setTilt(70);
    setHeading(0);
    setIsAutoRotate(true);
  }, []);

  return (
    <APIProvider apiKey={API_KEY} version="alpha">
      <div className="flex flex-col h-[100dvh] w-full bg-black overflow-hidden select-none">
        {/* Top UI Layout */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 pointer-events-none flex justify-between items-start">
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 md:p-6 pointer-events-auto border border-white/10 shadow-2xl">
            <h1 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Mountain className="text-emerald-400 w-8 h-8 md:w-10 md:h-10" />
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
          className="flex-1 w-full bg-black relative"
          onPointerDown={() => setIsAutoRotate(false)}
        >
          <Map3D
            center={center}
            heading={heading}
            tilt={tilt}
            range={range}
            onCameraChanged={(e: any) => {
              if (e.detail) {
                // To keep state synced if needed, but might cause re-renders. 
                // Mostly Map3D manages its own state for performance.
              }
            }}
            defaultLabelsDisabled={false}
          />
        </div>

        {/* Bottom Drawer for interactively picking a mountain */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-5xl pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-4 overflow-x-auto flex gap-4 no-scrollbar shadow-2xl">
            {!loading && hikes.map((hike) => (
              <button
                key={hike.id}
                onClick={() => handleSelectHike(hike.startLocation.lat, hike.startLocation.lng)}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white rounded-xl p-4 text-left border border-white/10 transition-all min-w-[200px] flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <Compass size={18} />
                  <span className="font-semibold text-white text-lg">{hike.title}</span>
                </div>
                <span className="text-sm text-gray-300">距離 {hike.distanceKm} km</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
