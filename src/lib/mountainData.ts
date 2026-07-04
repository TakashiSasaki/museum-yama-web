import mountainsData from '../../mountain_all.json';

export interface MountainRecord {
  No: number;
  山名: string;
  市町村?: string | null;
  lat: number;
  lon: number;
  標高: string | number;
  ele_gps?: number | null;
  難易度ランク: number;
  エントリーコースお勧め山?: boolean | null;
  YAMAPアクティビティID?: string | number | null;
}

export const getValidMountains = (): MountainRecord[] => {
  return (mountainsData as MountainRecord[]).filter(
    (m) => m.lat !== null && m.lon !== null && m.lat !== undefined && m.lon !== undefined
  );
};
