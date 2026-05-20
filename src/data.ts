import { Hike, HikeDetail } from './types';

// Dummy Data for Ehime Mountains
export const hikes: Hike[] = [
  {
    id: 'hike-1',
    title: '石鎚山 (Mt. Ishizuchi)',
    date: '2023-11-03',
    yamapUrl: 'https://yamap.com/activities/dummy1',
    startLocation: { lat: 33.7661, lng: 133.1118 }, // Tsuchigoya
    summitLocation: { lat: 33.7668, lng: 133.1145, elevation: 1982 },
    distanceKm: 9.2,
    durationHours: 6.5,
  },
  {
    id: 'hike-2',
    title: '瓶ヶ森 (Mt. Kamegamori)',
    date: '2023-10-15',
    yamapUrl: 'https://yamap.com/activities/dummy2',
    startLocation: { lat: 33.7847, lng: 133.2081 },
    summitLocation: { lat: 33.7880, lng: 133.2030, elevation: 1896 },
    distanceKm: 5.5,
    durationHours: 3.5,
  },
  {
    id: 'hike-3',
    title: '高縄山 (Mt. Takanawa)',
    date: '2024-03-20',
    yamapUrl: 'https://yamap.com/activities/dummy3',
    startLocation: { lat: 33.9538, lng: 132.8532 },
    summitLocation: { lat: 33.9580, lng: 132.8500, elevation: 986 },
    distanceKm: 6.0,
    durationHours: 3.0,
  }
];

export const hikeDetails: Record<string, HikeDetail> = {
  'hike-1': {
    hikeId: 'hike-1',
    waypoints: [
      { id: 'w1', name: '土小屋登山口', type: 'start', location: { lat: 33.7661, lng: 133.1118 }, elevation: 1492 },
      { id: 'w2', name: '石鎚山（天狗岳）', type: 'summit', location: { lat: 33.7668, lng: 133.1145 }, elevation: 1982 }, // slightly offset for dummy
      { id: 'w3', name: '土小屋登山口', type: 'end', location: { lat: 33.7661, lng: 133.1118 }, elevation: 1492 }
    ],
    path: [
      { lat: 33.7661, lng: 133.1118, elevation: 1492 },
      { lat: 33.7665, lng: 133.1125, elevation: 1600 },
      { lat: 33.7668, lng: 133.1145, elevation: 1982 },
      { lat: 33.7665, lng: 133.1125, elevation: 1600 },
      { lat: 33.7661, lng: 133.1118, elevation: 1492 }
    ]
  },
  'hike-2': {
    hikeId: 'hike-2',
    waypoints: [
      { id: 'k1', name: '瓶ヶ森登山口', type: 'start', location: { lat: 33.7847, lng: 133.2081 }, elevation: 1600 },
      { id: 'k2', name: '女山', type: 'summit', location: { lat: 33.7880, lng: 133.2030 }, elevation: 1896 },
      { id: 'k3', name: '瓶ヶ森登山口', type: 'end', location: { lat: 33.7847, lng: 133.2081 }, elevation: 1600 }
    ],
    path: [
      { lat: 33.7847, lng: 133.2081 },
      { lat: 33.7860, lng: 133.2050 },
      { lat: 33.7880, lng: 133.2030 },
      { lat: 33.7860, lng: 133.2050 },
      { lat: 33.7847, lng: 133.2081 }
    ]
  },
  'hike-3': {
    hikeId: 'hike-3',
    waypoints: [
      { id: 't1', name: '高縄寺', type: 'start', location: { lat: 33.9538, lng: 132.8532 }, elevation: 800 },
      { id: 't2', name: '高縄山', type: 'summit', location: { lat: 33.9580, lng: 132.8500 }, elevation: 986 },
      { id: 't3', name: '高縄寺', type: 'end', location: { lat: 33.9538, lng: 132.8532 }, elevation: 800 }
    ],
    path: [
      { lat: 33.9538, lng: 132.8532 },
      { lat: 33.9550, lng: 132.8520 },
      { lat: 33.9580, lng: 132.8500 },
      { lat: 33.9550, lng: 132.8520 },
      { lat: 33.9538, lng: 132.8532 }
    ]
  }
};
