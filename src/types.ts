export type WaypointType = 'start' | 'end' | 'summit' | 'point';

export interface Waypoint {
  id: string;
  name: string;
  type: WaypointType;
  location: { lat: number; lng: number };
  elevation?: number;
}

export interface PathPoint {
  lat: number;
  lng: number;
  elevation?: number;
}

// Minimal metadata for list viewing (and future Firestore top-level docs)
export interface Hike {
  id: string;
  title: string;
  date: string; // ISO string e.g. "2023-10-15"
  yamapUrl: string;
  startLocation: { lat: number; lng: number }; // For initial map markers
  distanceKm?: number;
  durationHours?: number;
}

// Detailed path data (For large GPX paths, later subcollections in Firestore)
export interface HikeDetail {
  hikeId: string;
  waypoints: Waypoint[];
  path: PathPoint[];
}
