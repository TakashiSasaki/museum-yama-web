import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { PathPoint } from '../types';

interface PolylineProps {
  path: PathPoint[];
  strokeColor?: string;
  strokeWeight?: number;
}

export function HikePolyline({ path, strokeColor = '#FF0000', strokeWeight = 4 }: PolylineProps) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length === 0) return;

    // Convert PathPoint to google.maps.LatLngLiteral
    const gmapPath = path.map(p => ({ lat: p.lat, lng: p.lng }));

    if (polylineRef.current) {
      polylineRef.current.setPath(gmapPath);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path: gmapPath,
        strokeColor,
        strokeOpacity: 0.8,
        strokeWeight,
        map
      });
    }

    return () => {
      // Clean up on unmount
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path, strokeColor, strokeWeight]);

  return null;
}
