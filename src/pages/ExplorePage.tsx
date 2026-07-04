import React, { useState, useCallback, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Home, ChevronLeft, Search, Navigation } from 'lucide-react';
import heroBg from '../assets/background_new.jpg';
import yamaIcon from '../assets/yama_icon.svg';
import mountainsData from '../../mountain_all.json';

import { calculateDistance, MAP_RESTRICTION, MountainRecord } from '../features/explore/exploreUtils';
import { ExploreSearchPanel } from '../features/explore/ExploreSearchPanel';
import { ExploreTitleDialog } from '../features/explore/ExploreTitleDialog';
import { ExploreMap } from '../features/explore/ExploreMap';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const validMountains = (mountainsData as any[]).filter(
  (m) => m.lat !== null && m.lon !== null
) as MountainRecord[];

export default function ExplorePage() {
  const { hikeId } = useParams();
  const navigate = useNavigate();
  const selectedMountainNo = hikeId ? parseInt(hikeId, 10) : null;

  const selectedMountain = useMemo(() => {
    if (!selectedMountainNo) return null;
    return validMountains.find(m => m.No === selectedMountainNo) || null;
  }, [selectedMountainNo]);

  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [edgeGlow, setEdgeGlow] = useState({ top: false, bottom: false, left: false, right: false });

  const [filterRecommended, setFilterRecommended] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'none' | 'distance'>('none');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [showMountainDetails, setShowMountainDetails] = useState(false);
  const mountainTimerRef = useRef<any>(null);

  const handleLocateCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      alert('現在地を取得できませんでした。');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(loc);
        setSortBy('distance');
        setIsLocating(false);
      },
      () => {
        alert('現在地を取得できませんでした。');
        setIsLocating(false);
      }
    );
  }, []);

  const handleCloseMountainDetails = useCallback(() => {
    setShowMountainDetails(false);
    if (mountainTimerRef.current) {
      clearTimeout(mountainTimerRef.current);
      mountainTimerRef.current = null;
    }
  }, []);

  const handleSelectMountain = useCallback((no: number) => {
    navigate(`/explore/${no}`);
    setIsSearchDialogOpen(false);
    
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

  const uniqueMunicipalities = useMemo(() => {
    return Array.from(new Set(validMountains.map(m => m.市町村).filter(Boolean))).sort() as string[];
  }, []);

  const muniCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    validMountains.forEach(m => {
      if (m.市町村) {
        counts[m.市町村] = (counts[m.市町村] || 0) + 1;
      }
    });
    return counts;
  }, []);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredMountains = useMemo(() => {
    let list = validMountains.filter((m) => {
      const matchesMuni = !selectedMunicipality || m.市町村 === selectedMunicipality;
      const matchesRec = !filterRecommended || m.エントリーコースお勧め山 === true;
      const matchesSearch = !deferredSearchQuery || m.山名.includes(deferredSearchQuery);
      return matchesMuni && matchesRec && matchesSearch;
    });
    
    if (sortBy === 'distance' && userLocation) {
      list = [...list].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lon);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lon);
        return distA - distB;
      });
    }
    
    return list;
  }, [selectedMunicipality, filterRecommended, deferredSearchQuery, sortBy, userLocation]);

  const handleMapIdle = useCallback((ev: any) => {
    const mapCenter = ev.map.getCenter();
    if (!mapCenter) return;
    
    const lat = mapCenter.lat();
    const lng = mapCenter.lng();
    const TOLERANCE = 0.005;
    
    const newTop = lat >= MAP_RESTRICTION.north - TOLERANCE;
    const newBottom = lat <= MAP_RESTRICTION.south + TOLERANCE;
    const newRight = lng >= MAP_RESTRICTION.east - TOLERANCE;
    const newLeft = lng <= MAP_RESTRICTION.west + TOLERANCE;

    setEdgeGlow(prev => {
      if (prev.top !== newTop || prev.bottom !== newBottom || prev.left !== newLeft || prev.right !== newRight) {
        return { top: newTop, bottom: newBottom, left: newLeft, right: newRight };
      }
      return prev;
    });
  }, []);

  const navigateHome = useCallback(() => {
    navigate('/');
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
          <div className="flex items-center relative z-10 gap-2">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="py-1 md:py-2 pr-2 md:pr-4 pl-0 md:pl-2 -ml-1 md:-ml-2 text-white/90 hover:text-emerald-300 transition-colors flex items-center"
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
            
            {/* Mobile Search Open Button */}
            <button
              onClick={() => setIsSearchDialogOpen(true)}
              className="md:hidden ml-1 px-3 py-1.5 text-white/90 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center gap-1"
              aria-label="検索して探す"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">探す</span>
            </button>

            {/* Locate Current Position Button */}
            <button
              onClick={handleLocateCurrentPosition}
              disabled={isLocating}
              className="ml-1 px-3 py-1.5 text-white/90 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              aria-label="現在地に移動"
              title="現在地に移動"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-bold">現在地</span>
            </button>
          </div>
          <button 
            onClick={navigateHome}
            className="p-1.5 md:p-2 -mr-1 md:-mr-2 text-white/90 hover:text-emerald-300 transition-colors relative z-10"
            aria-label="ホームに戻る"
            title="オープニング画面に戻る"
          >
            <Home className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col-reverse md:flex-row w-full overflow-hidden">
          <ExploreTitleDialog 
            isTitleDialogOpen={isTitleDialogOpen}
            setIsTitleDialogOpen={setIsTitleDialogOpen}
            navigateHome={navigateHome}
          />

          <ExploreSearchPanel 
            isSearchDialogOpen={isSearchDialogOpen}
            setIsSearchDialogOpen={setIsSearchDialogOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedMunicipality={selectedMunicipality}
            setSelectedMunicipality={setSelectedMunicipality}
            filterRecommended={filterRecommended}
            setFilterRecommended={setFilterRecommended}
            handleLocateCurrentPosition={handleLocateCurrentPosition}
            isLocating={isLocating}
            sortBy={sortBy}
            uniqueMunicipalities={uniqueMunicipalities}
            muniCounts={muniCounts}
            filteredMountains={filteredMountains}
            selectedMountainNo={selectedMountainNo}
            handleSelectMountain={handleSelectMountain}
          />

          <ExploreMap
            filteredMountains={filteredMountains}
            selectedMountain={selectedMountain}
            handleSelectMountain={handleSelectMountain}
            userLocation={userLocation}
            edgeGlow={edgeGlow}
            handleMapIdle={handleMapIdle}
            showMountainDetails={showMountainDetails}
            handleCloseMountainDetails={handleCloseMountainDetails}
          />
        </div>
      </div>
    </APIProvider>
  );
}
