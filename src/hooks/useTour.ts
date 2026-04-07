import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_KEY = 'pbp_tour_v3_completed'; // v3 key — forces tour on first launch after upgrade

export function useTour() {
  const [tourVisible, setTourVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  // Check on mount (handles first-ever launch)
  useEffect(() => {
    AsyncStorage.getItem(TOUR_KEY).then(val => {
      setChecked(true);
      if (!val) {
        setTimeout(() => setTourVisible(true), 1200);
      }
    }).catch(() => setChecked(true));
  }, []);

  // Call this when the screen regains focus (e.g. returning from Settings after resetting tour)
  const recheckTour = useCallback(async () => {
    const val = await AsyncStorage.getItem(TOUR_KEY);
    if (!val) {
      setTimeout(() => setTourVisible(true), 600);
    }
  }, []);

  const startTour = useCallback(() => {
    setTourVisible(true);
  }, []);

  const dismissTour = useCallback(async () => {
    setTourVisible(false);
    await AsyncStorage.setItem(TOUR_KEY, 'true');
  }, []);

  // Only clears the key — Dashboard's useFocusEffect picks it up on the next focus
  const resetTour = useCallback(async () => {
    await AsyncStorage.removeItem(TOUR_KEY);
  }, []);

  return { tourVisible, startTour, dismissTour, resetTour, recheckTour, checked };
}
