export const getDifficultyColor = (rank: number) => {
  switch (rank) {
    case 1: return '#8b5cf6';
    case 2: return '#3b82f6';
    case 3: return '#10b981';
    case 4: return '#f97316';
    case 5: return '#ef4444';
    default: return '#6b7280';
  }
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const MAP_RESTRICTION = {
  north: 34.45,
  south: 32.7,
  east: 133.85,
  west: 131.95,
};

export const defaultCenter = { lat: 33.8416, lng: 132.7661 };

export interface MountainRecord {
  No: number;
  山名: string;
  市町村: string | null;
  lat: number;
  lon: number;
  標高: string | number;
  難易度ランク: number;
  エントリーコースお勧め山?: boolean | null;
  YAMAPアクティビティID?: string | number | null;
}

export interface PlainBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const MARKER_CULLING_PADDING_DEGREES = 0.05; // approx 5km

export const isMarkerVisible = (
  lat: number,
  lng: number,
  bounds: PlainBounds | null
) => {
  if (!bounds) return true;
  
  return (
    lat >= bounds.south - MARKER_CULLING_PADDING_DEGREES &&
    lat <= bounds.north + MARKER_CULLING_PADDING_DEGREES &&
    lng >= bounds.west - MARKER_CULLING_PADDING_DEGREES &&
    lng <= bounds.east + MARKER_CULLING_PADDING_DEGREES
  );
};
