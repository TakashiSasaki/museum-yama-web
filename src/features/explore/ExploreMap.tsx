import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { getDifficultyColor, MAP_RESTRICTION, defaultCenter, isMarkerVisible, PlainBounds } from './exploreUtils';
import { MountainRecord } from '../../lib/mountainData';
import { MountainDifficultyExplanation } from '../../components/MountainDifficultyExplanation';

import { logPerformanceMetrics } from './performanceDebug';

const HeartMarker = ({ color, isSelected }: { color: string; isSelected?: boolean }) => (
  <svg width={isSelected ? "46" : "34"} height={isSelected ? "46" : "34"} viewBox="0 0 24 24" fill={color} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.45))', transition: 'all 0.15s ease-out' }}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const PinMarker = ({ color, isSelected }: { color: string; isSelected?: boolean }) => (
  <svg width={isSelected ? "46" : "34"} height={isSelected ? "46" : "34"} viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.45))', transition: 'all 0.15s ease-out' }}>
    <path d="M12 2L2.5 21h19L12 2z" fill="#ffffff" />
    <path d="M12 3.8L4.2 20h15.6L12 3.8z" fill={color} />
    <path d="M12 3.8L9.5 9l1.2 1 1.3-1.5 1.3 1.5 1.2-1L12 3.8z" fill="#ffffff" />
    <path d="M16.5 9.5L11.5 21h10L16.5 9.5z" fill="#ffffff" />
    <path d="M16.5 11L12.8 20h7.4L16.5 11z" fill={color} />
    <path d="M16.5 11l-1.5 3.3.7.7.8-1 1 1 .5-.5L16.5 11z" fill="#ffffff" />
  </svg>
);

// Component to handle imperative camera updates
function CameraControl({ selectedMountain, userLocation }: { 
  selectedMountain: MountainRecord | null, 
  userLocation: {lat: number, lng: number} | null
}) {
  const map = useMap(); // Get map without ID since it's a child of Map

  useEffect(() => {
    if (!map) return;
    if (selectedMountain) {
      map.panTo({ lat: selectedMountain.lat, lng: selectedMountain.lon });
      map.setZoom(13);
    } else {
      map.panTo(defaultCenter);
      map.setZoom(9);
    }
  }, [map, selectedMountain]);

  const prevUserLoc = useRef(userLocation);
  useEffect(() => {
    if (!map) return;
    if (userLocation && userLocation !== prevUserLoc.current) {
      map.panTo(userLocation);
      map.setZoom(13);
    }
    prevUserLoc.current = userLocation;
  }, [map, userLocation]);

  return null;
}

interface ExploreMapProps {
  filteredMountains: MountainRecord[];
  selectedMountain: MountainRecord | null;
  handleSelectMountain: (no: number) => void;
  userLocation: {lat: number, lng: number} | null;
  edgeGlow: { top: boolean, bottom: boolean, left: boolean, right: boolean };
  handleMapIdle: (ev: any) => void;
  showMountainDetails: boolean;
  handleCloseMountainDetails: () => void;
}

export const ExploreMap = React.memo(({
  filteredMountains,
  selectedMountain,
  handleSelectMountain,
  userLocation,
  edgeGlow,
  handleMapIdle,
  showMountainDetails,
  handleCloseMountainDetails
}: ExploreMapProps) => {
  const [visibleBounds, setVisibleBounds] = useState<PlainBounds | null>(null);

  const onMapIdle = useCallback((ev: any) => {
    // Let parent handle edge glow
    handleMapIdle(ev);
    
    // Update local bounds for culling
    if (ev.map) {
      const bounds = ev.map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const newBounds = {
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        };

        setVisibleBounds((prev) => {
          if (!prev) return newBounds;
          // Only update if changed significantly (e.g. > 0.001 deg) to avoid excessive re-renders
          if (
            Math.abs(prev.north - newBounds.north) > 0.001 ||
            Math.abs(prev.south - newBounds.south) > 0.001 ||
            Math.abs(prev.east - newBounds.east) > 0.001 ||
            Math.abs(prev.west - newBounds.west) > 0.001
          ) {
            return newBounds;
          }
          return prev;
        });
      }
    }
  }, [handleMapIdle]);

  // Memoize visible mountains based on current bounds and selected mountain
  const visibleMarkerMountains = useMemo(() => {
    if (!visibleBounds) return filteredMountains;
    
    const visible = filteredMountains.filter(mountain => {
      // Always show selected mountain regardless of bounds
      if (selectedMountain && selectedMountain.No === mountain.No) {
        return true;
      }
      return isMarkerVisible(mountain.lat, mountain.lon, visibleBounds);
    });

    logPerformanceMetrics('ExploreMap', {
      filteredCount: filteredMountains.length,
      visibleMarkerCount: visible.length,
    });

    return visible;
  }, [filteredMountains, visibleBounds, selectedMountain]);

  return (
    <div className="flex-1 relative h-full w-full overflow-hidden">
      {/* Boundary Glow Effects */}
      <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-orange-500/30 to-transparent z-10 transition-opacity duration-300 pointer-events-none ${edgeGlow.top ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-orange-500/30 to-transparent z-10 transition-opacity duration-300 pointer-events-none ${edgeGlow.bottom ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-orange-500/30 to-transparent z-10 transition-opacity duration-300 pointer-events-none ${edgeGlow.left ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-orange-500/30 to-transparent z-10 transition-opacity duration-300 pointer-events-none ${edgeGlow.right ? 'opacity-100' : 'opacity-0'}`} />

      <Map
        defaultCenter={defaultCenter}
        defaultZoom={9}
        minZoom={8}
        maxZoom={18}
        restriction={{
          latLngBounds: MAP_RESTRICTION,
          strictBounds: false,
        }}
        onIdle={onMapIdle}
        mapId="EHIME_HIKE_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        disableDefaultUI={true}
        gestureHandling="greedy"
        reuseMaps={true}
      >
        <CameraControl selectedMountain={selectedMountain} userLocation={userLocation} />
        
        {/* Filtered Mountains Interactive Pins */}
        {visibleMarkerMountains.map(mountain => {
          const isSelected = selectedMountain?.No === mountain.No;
          const color = getDifficultyColor(mountain.難易度ランク);
          const isRecommended = mountain.エントリーコースお勧め山 === true;
          return (
            <AdvancedMarker 
              key={`mountain-2d-${mountain.No || 'null'}-${mountain.山名}-${mountain.lat}-${mountain.lon}`} 
              position={{ lat: mountain.lat, lng: mountain.lon }} 
              title={`${mountain.山名} (${mountain.標高}m) - ${mountain.市町村}`}
              onClick={() => handleSelectMountain(mountain.No)}
            >
              {isRecommended ? (
                <HeartMarker color={isSelected ? '#ef4444' : color} isSelected={isSelected} />
              ) : (
                <PinMarker color={isSelected ? '#fcd34d' : color} isSelected={isSelected} />
              )}
            </AdvancedMarker>
          );
        })}

        {/* User Location Marker */}
        {userLocation && (
          <AdvancedMarker
            position={userLocation}
            title="現在地"
            zIndex={100}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-500/30 rounded-full animate-ping absolute"></div>
              <div className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md relative z-10"></div>
            </div>
          </AdvancedMarker>
        )}
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
  );
});
ExploreMap.displayName = 'ExploreMap';
