import mountainsData from '../../mountain_all.json';

export interface RawMountainRecord {
  No: number;
  山名: string;
  市町村?: string | null;
  lat?: number | null;
  lon?: number | null;
  標高?: string | number | null;
  ele_gps?: number | null;
  難易度ランク?: number | null;
  エントリーコースお勧め山?: boolean | null;
  YAMAPアクティビティID?: string | number | null;
}

export interface MountainRecord extends Omit<RawMountainRecord, 'lat' | 'lon' | '難易度ランク'> {
  lat: number;
  lon: number;
  難易度ランク: number;
}

export const getValidMountains = (): MountainRecord[] => {
  return (mountainsData as RawMountainRecord[])
    .filter(
      (m): m is MountainRecord => 
        typeof m.lat === 'number' && 
        typeof m.lon === 'number' && 
        typeof m.難易度ランク === 'number'
    );
};
