/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Mountain, MapPin, Navigation, ExternalLink, X, Home, ChevronLeft, Landmark, Heart, Search } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import heroBg from './assets/background_new.jpg';
import yamaIcon from './assets/yama_icon.svg';
import { MountainDifficultyExplanation } from './components/MountainDifficultyExplanation';
import mountainsData from '../mountain_all.json';

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

const validMountains = (mountainsData as any[]).filter(
  (m) => m.lat !== null && m.lon !== null
);

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
      return '#6b7280'; // Gray
  }
};

function App() {
  const { hikeId } = useParams();
  const navigate = useNavigate();
  const selectedMountainNo = hikeId ? parseInt(hikeId, 10) : null;

  const selectedMountain = React.useMemo(() => {
    if (!selectedMountainNo) return null;
    return validMountains.find(m => m.No === selectedMountainNo) || null;
  }, [selectedMountainNo]);

  const mapRef = useRef<any>(null);
  
  // Track map centering
  const defaultCenter = { lat: 33.8416, lng: 132.7661 }; // Ehime center roughly
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(9);
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [edgeGlow, setEdgeGlow] = useState({ top: false, bottom: false, left: false, right: false });

  // Filter States
  const [filterRecommended, setFilterRecommended] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mountain details popup timer
  const [showMountainDetails, setShowMountainDetails] = useState(false);
  const mountainTimerRef = useRef<any>(null);

  const handleCloseMountainDetails = useCallback(() => {
    setShowMountainDetails(false);
    if (mountainTimerRef.current) {
      clearTimeout(mountainTimerRef.current);
      mountainTimerRef.current = null;
    }
  }, []);

  const handleSelectMountain = useCallback((no: number) => {
    navigate(`/explore/${no}`);
    
    setShowMountainDetails(true);
    if (mountainTimerRef.current) {
      clearTimeout(mountainTimerRef.current);
    }
    mountainTimerRef.current = setTimeout(() => {
      setShowMountainDetails(false);
    }, 30000);
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (mountainTimerRef.current) {
        clearTimeout(mountainTimerRef.current);
      }
    };
  }, []);

  // Compute unique list of municipalities
  const uniqueMunicipalities = React.useMemo(() => {
    return Array.from(new Set(validMountains.map(m => m.市町村).filter(Boolean))).sort();
  }, []);

  // Count mountains per municipality
  const muniCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    validMountains.forEach(m => {
      if (m.市町村) {
        counts[m.市町村] = (counts[m.市町村] || 0) + 1;
      }
    });
    return counts;
  }, []);

  // Filtered mountains list
  const filteredMountains = React.useMemo(() => {
    return validMountains.filter((m) => {
      const matchesMuni = !selectedMunicipality || m.市町村 === selectedMunicipality;
      const matchesRec = !filterRecommended || m.エントリーコースお勧め山 === true;
      const matchesSearch = !searchQuery || m.山名.includes(searchQuery);
      return matchesMuni && matchesRec && matchesSearch;
    });
  }, [selectedMunicipality, filterRecommended, searchQuery]);

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

  // Center map on the selected mountain
  useEffect(() => {
    if (selectedMountain) {
      setMapCenter({ lat: selectedMountain.lat, lng: selectedMountain.lon });
      setMapZoom(13);
    } else {
      setMapCenter(defaultCenter);
      setMapZoom(9);
    }
  }, [selectedMountain]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/explore');
    setShowMountainDetails(false);
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
              <img src={yamaIcon} alt="Icon" className="w-4 h-4 md:w-5 md:h-5 rounded-full" referrerPolicy="no-referrer" />
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
                    <img src={yamaIcon} alt="Icon" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
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

          <div className="md:w-96 w-full bg-white border-t md:border-t-0 md:border-r border-gray-200 flex flex-col transition-all duration-300 z-10 h-1/2 md:h-full">
            {/* Search and Filters Header */}
            <div className="p-4 border-b border-gray-100 space-y-3 flex-shrink-0 bg-white shadow-xs">
              {/* Search input with search icon */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="山名・キーワードで検索..."
                  className="w-full text-xs pl-8 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {/* Municipality and Recommended filtering */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedMunicipality || ''}
                  onChange={(e) => setSelectedMunicipality(e.target.value || null)}
                  className="text-[11px] py-2 px-2 border border-gray-200 rounded-xl font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50 outline-none"
                >
                  <option value="">すべての市町村・島</option>
                  {uniqueMunicipalities.map((muni) => (
                    <option key={muni} value={muni}>
                      {muni} ({muniCounts[muni] || 0})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setFilterRecommended(!filterRecommended)}
                  className={`py-2 px-2 border rounded-xl flex items-center justify-center gap-1 transition-all text-[11px] font-bold ${
                    filterRecommended
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${filterRecommended ? 'fill-white' : ''}`} />
                  <span>お勧めのみ</span>
                </button>
              </div>
            </div>

            {/* Mountains Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {filteredMountains.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <p className="text-xs">該当する山が見つかりませんでした。</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedMunicipality(null);
                      setFilterRecommended(false);
                    }}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    フィルターをリセット
                  </button>
                </div>
              ) : (
                filteredMountains.map((mountain) => {
                  const isSelected = selectedMountainNo === mountain.No;
                  const color = getDifficultyColor(mountain.難易度ランク);
                  return (
                    <div
                      key={mountain.No}
                      onClick={() => handleSelectMountain(mountain.No)}
                      style={{ borderLeftColor: color, borderLeftWidth: '5px' }}
                      className={`p-3 rounded-xl cursor-pointer transition-all border flex flex-col ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm transform scale-[1.01]'
                          : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-gray-400 tracking-wider">
                              {mountain.市町村 || '愛媛県'}
                            </span>
                            {mountain.エントリーコースお勧め山 === true && (
                              <span className="text-[8px] bg-rose-500/10 text-rose-500 border border-rose-500/10 font-bold px-1 rounded flex items-center gap-0.5 leading-none py-0.5">
                                <Heart className="w-2.5 h-2.5 fill-current" />
                                <span>お勧め</span>
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-800 leading-snug mt-1 flex items-baseline gap-1.5 min-w-0">
                            <span className="text-sm truncate block">{mountain.山名}</span>
                            <span className="text-[10px] font-mono text-gray-400 font-medium">{mountain.標高}m</span>
                          </h3>
                        </div>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ color: color, backgroundColor: `${color}15` }}>
                          難易度.{mountain.難易度ランク}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between gap-2 flex-wrap">
                          {mountain.YAMAPアクティビティID ? (
                            <a
                              href={`https://yamap.com/activities/${mountain.YAMAPアクティビティID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
                              onClick={(e) => e.stopPropagation()}
                            >
                              YAMAPで見る <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-[9px] text-gray-400 italic">GPSログ未掲載</span>
                          )}
                          
                          <button
                            onClick={handleClose}
                            className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs"
                          >
                            閉じる <X size={10} />
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
              {/* Filtered Mountains Interactive Pins */}
              {filteredMountains.map(mountain => {
                const isSelected = selectedMountain?.No === mountain.No;
                const color = getDifficultyColor(mountain.難易度ランク);
                return (
                  <AdvancedMarker 
                    key={`mountain-2d-${mountain.No || 'null'}-${mountain.山名}-${mountain.lat}-${mountain.lon}`} 
                    position={{ lat: mountain.lat, lng: mountain.lon }} 
                    title={`${mountain.山名} (${mountain.標高}m) - ${mountain.市町村}`}
                    onClick={() => handleSelectMountain(mountain.No)}
                  >
                    <Pin 
                      background={color} 
                      borderColor={isSelected ? '#ffffff' : color} 
                      glyphColor="#fff"
                      scale={isSelected ? 1.25 : 0.85}
                    />
                  </AdvancedMarker>
                );
              })}
            </Map>

            {/* Floating difficulty description popup (Auto-closes in 30 seconds) */}
            {showMountainDetails && selectedMountain && (
              <MountainDifficultyExplanation
                mountain={selectedMountain}
                onClose={handleCloseMountainDetails}
                isDrawerVisible={false}
              />
            )}
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
