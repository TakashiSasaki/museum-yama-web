import { useState, useEffect } from 'react';
import { hikes, hikeDetails } from '../data';
import { Hike, HikeDetail } from '../types';

// Future Firebase integration point:
// Replace these with async Firestore queries.
export function useHikes() {
  const [data, setData] = useState<Hike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate network fetch
    setTimeout(() => {
      setData(hikes);
      setLoading(false);
    }, 500);
  }, []);

  return { hikes: data, loading };
}

export function useHikeDetail(hikeId: string | null) {
  const [detail, setDetail] = useState<HikeDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hikeId) {
      setDetail(null);
      return;
    }
    
    setLoading(true);
    // Simulate network fetch
    setTimeout(() => {
      setDetail(hikeDetails[hikeId] || null);
      setLoading(false);
    }, 500);
  }, [hikeId]);

  return { detail, loading };
}
