/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useHikes, useHikeDetail } from './hooks/useHikes';
import { HikePolyline } from './components/HikePolyline';
import { Mountain, MapPin, Navigation, ExternalLink, X, Compass, Home, ChevronLeft, Landmark } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import heroBg from './assets/background.png';

import EarthPage from './pages/EarthPage';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore/:hikeId?/:waypointId?" element={<App />} />
        <Route path="/earth" element={<EarthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const { hikeId, waypointId } = useParams();
  const navigate = useNavigate();
  const selectedHikeId = hikeId || null;

  const { hikes, loading: hikesLoading } = useHikes();
  const { detail, loading: detailLoading } = useHikeDetail(selectedHikeId);
  const mapRef = useRef<any>(null); // We use this purely to store a reference to the map logic if needed via useMap
  
  // Track map centering
  const defaultCenter = { lat: 33.8416, lng: 132.7661 }; // Ehime center roughly
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(9);
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [edgeGlow, setEdgeGlow] = useState({ top: false, bottom: false, left: false, right: false });

  const MAP_RESTRICTION = {
    north: 34.45,
    south: 32.7,
    east: 133.85,
    west: 131.95,
  };

  const handleCenterChanged = useCallback((ev: any) => {
    const center = ev.detail.center;
    setMapCenter(center);

    const TOLERANCE = 0.005;
    
    setEdgeGlow({
      top: center.lat >= MAP_RESTRICTION.north - TOLERANCE,
      bottom: center.lat <= MAP_RESTRICTION.south + TOLERANCE,
      right: center.lng >= MAP_RESTRICTION.east - TOLERANCE,
      left: center.lng <= MAP_RESTRICTION.west + TOLERANCE,
    });
  }, []);

  // Focus map when hike or waypoint is routed
  useEffect(() => {
    if (selectedHikeId && detail && !detailLoading) {
      if (waypointId) {
        const wp = detail.waypoints.find(w => w.id === waypointId);
        if (wp) {
          setMapCenter(wp.location);
          setMapZoom(16);
        }
      } else {
        // Just hike selected, focus on start location
        const hike = hikes.find(h => h.id === selectedHikeId);
        if (hike) {
          setMapCenter(hike.startLocation);
          setMapZoom(13);
        }
      }
    } else if (!selectedHikeId) {
      setMapCenter(defaultCenter);
      setMapZoom(9);
    }
  }, [selectedHikeId, waypointId, detail, detailLoading, hikes]);

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setMapZoom(13);
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert("現在地を取得できませんでした。");
        }
      );
    } else {
      alert("ブラウザが位置情報をサポートしていません。");
    }
  };

  const handleSelectHike = useCallback((id: string) => {
    navigate(`/explore/${id}`);
  }, [navigate]);

  const handleSelectWaypoint = useCallback((id: string, wpId: string) => {
    navigate(`/explore/${id}/${wpId}`);
  }, [navigate]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/explore');
  }, [navigate]);

  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-800 font-sans p-6 text-center">
        <div className="max-w-xl bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Google Maps API Key Required</h2>
          <p className="mb-2"><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Get an API Key</a></p>
          <p className="mb-2"><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
          <ul className="text-left leading-relaxed list-disc list-inside mb-4 text-gray-600">
            <li>Open <strong>Settings</strong> (⚙️ gear icon, <strong>top-right corner</strong>)</li>
            <li>Select <strong>Secrets</strong></li>
            <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as secret name, press <strong>Enter</strong></li>
            <li>Paste your API key as value, press <strong>Enter</strong></li>
          </ul>
          <p className="text-sm text-gray-500">The app rebuilds automatically after you add the secret.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
        
        {/* Top Title Bar */}
        <div 
          className="relative py-1 md:py-2 px-3 md:px-4 border-b flex items-center justify-between shadow-sm z-20 animate-slow-pan"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-black/55"></div>
          <div className="flex items-center relative z-10">
            <button
              onClick={() => navigate(-1)}
              className="py-1 md:py-2 pr-4 md:pr-4 pl-0 md:pl-2 -ml-1 md:-ml-2 text-white/90 hover:text-emerald-300 transition-colors flex items-center"
              aria-label="戻る"
              title="前の画面に戻る"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={() => setIsTitleDialogOpen(true)}
              className="text-sm md:text-base font-bold text-white flex items-center gap-1.5 md:gap-2 hover:text-emerald-200 transition-colors"
            >
              <Mountain className="text-emerald-400 w-4 h-4 md:w-5 md:h-5" />
              えひめの山
            </button>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="p-1.5 md:p-2 -mr-1 md:-mr-2 text-white/90 hover:text-emerald-300 transition-colors relative z-10"
            aria-label="ホームに戻る"
            title="オープニング画面に戻る"
          >
            <Home className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col-reverse md:flex-row w-full overflow-hidden">
          {/* Sidebar / Bottom Sheet */}

          {/* Title Dialog */}
          {isTitleDialogOpen && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsTitleDialogOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Mountain className="text-emerald-600 w-5 h-5" />
                    えひめの山
                  </h2>
                  <button 
                    onClick={() => setIsTitleDialogOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setIsTitleDialogOpen(false);
                    navigate('/');
                  }}
                  className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <Home size={18} />
                  オープニングに戻る
                </button>

                <a
                  href="https://portal.museum.ehime-u.ac.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsTitleDialogOpen(false)}
                  className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <Landmark size={18} className="text-emerald-600" />
                  ポータルを開く
                  <ExternalLink size={14} className="ml-1 text-gray-400" />
                </a>
              </div>
            </div>
          )}

          <div className={`md:w-96 w-full bg-white border-t md:border-t-0 md:border-r border-gray-200 flex flex-col transition-all duration-300 z-10 
            ${selectedHikeId ? 'h-1/3 md:h-full' : 'h-1/2 md:h-full'}`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {hikesLoading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg w-full"></div>
                ))}
              </div>
            ) : (
              hikes.map(hike => {
                const isSelected = selectedHikeId === hike.id;
                return (
                  <div 
                    key={hike.id}
                    onClick={() => handleSelectHike(hike.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border flex flex-col ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md transform scale-[1.02]' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800 leading-tight">{hike.title}</h3>
                      <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100">{hike.date}</span>
                    </div>
                    <div className="mt-3 flex gap-4 text-sm text-gray-600">
                      {hike.distanceKm && (
                        <div className="flex items-center gap-1">
                          <Navigation size={14} className="text-gray-400" />
                          <span>{hike.distanceKm} km</span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
                        <a 
                          href={hike.yamapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          YAMAPで見る <ExternalLink size={12} />
                        </a>
                        <button 
                          onClick={handleClose}
                          className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200"
                        >
                          閉じる <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative h-full w-full overflow-hidden">
          {/* Boundary Glow Effects */}
          <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-orange-500/30 to-transparent z-10 transition-opacity duration-300 pointer-events-none ${edgeGlow.top ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-orange-500/30 to-transparent z-10 transition-opacity duration-300 pointer-events-none ${edgeGlow.bottom ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-orange-500/30 to-transparent z-10 transition-opacity duration-300 pointer-events-none ${edgeGlow.left ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-orange-500/30 to-transparent z-10 transition-opacity duration-300 pointer-events-none ${edgeGlow.right ? 'opacity-100' : 'opacity-0'}`} />

          <Map
            center={mapCenter}
            zoom={mapZoom}
            minZoom={8}
            maxZoom={18}
            restriction={{
              latLngBounds: MAP_RESTRICTION,
              strictBounds: false,
            }}
            onCenterChanged={handleCenterChanged}
            onZoomChanged={(ev) => setMapZoom(ev.detail.zoom)}
            mapId="EHIME_HIKE_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={true}
            gestureHandling="greedy"
          >
            {/* Overview Markers: Show start points for all hikes if none selected */}
            {!selectedHikeId && hikes.map(hike => (
              <AdvancedMarker 
                key={hike.id} 
                position={hike.startLocation} 
                title={hike.title}
                onClick={() => handleSelectHike(hike.id)}
              >
                <Pin background="#10b981" borderColor="#047857" glyphColor="#fff" />
              </AdvancedMarker>
            ))}

            {/* Selected Hike Details */}
            {selectedHikeId && detail && !detailLoading && (
              <>
                <HikePolyline path={detail.path} strokeColor="#10b981" strokeWeight={5} />
                
                {detail.waypoints.map(wp => {
                  const isWpSelected = waypointId === wp.id;
                  return (
                    <AdvancedMarker 
                      key={wp.id} 
                      position={wp.location} 
                      title={wp.name}
                      onClick={() => handleSelectWaypoint(selectedHikeId, wp.id)}
                    >
                      <div className={`px-2 py-1 rounded-md shadow-lg border flex flex-col items-center transition-colors cursor-pointer ${isWpSelected ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-gray-200'}`}>
                        <span className={`text-[10px] font-bold ${isWpSelected ? 'text-white' : 'text-gray-800'}`}>{wp.name}</span>
                        {wp.type === 'summit' && wp.elevation && (
                          <span className={`text-[9px] ${isWpSelected ? 'text-emerald-100' : 'text-gray-500'}`}>{wp.elevation}m</span>
                        )}
                      </div>
                    </AdvancedMarker>
                  )
                })}
              </>
            )}
            
            {/* Loading indicator for details */}
            {selectedHikeId && detailLoading && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm text-gray-600 font-medium z-50 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                ルートを読み込み中...
              </div>
            )}
          </Map>

          {/* Current Location FAB */}
          <button
            onClick={handleLocateMe}
            className="absolute bottom-6 right-6 bg-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-gray-700 hover:text-emerald-600 hover:bg-gray-50 transition-colors z-50 border border-gray-100"
            aria-label="現在地を表示"
          >
            <Compass size={24} />
          </button>
        </div>
        </div>
      </div>
    </APIProvider>
  );
}
