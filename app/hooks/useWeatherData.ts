'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCurrentWeatherByCoords, buildWeatherTileUrl, CurrentWeather } from '@/lib/weather';

interface WeatherDataState {
  current: CurrentWeather | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseWeatherDataOptions {
  lat?: number;
  lon?: number;
  refreshInterval?: number; // milliseconds
  units?: 'metric' | 'imperial' | 'standard';
}

export function useWeatherData(options: UseWeatherDataOptions = {}) {
  const {
    lat = 39.9042, // Beijing default
    lon = 116.4074,
    refreshInterval = 15 * 60 * 1000, // 15 minutes
    units = 'metric',
  } = options;

  const [state, setState] = useState<WeatherDataState>({
    current: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchWeather = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchCurrentWeatherByCoords(lat, lon, units);
      
      if (!isMountedRef.current) return;

      setState({
        current: data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastUpdated: prev.lastUpdated,
      }));
    }
  }, [lat, lon, units]);

  // Initial fetch
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchWeather, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchWeather, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchWeather();
  }, [fetchWeather]);

  // Generate tile URLs for map overlays
  const getCloudTileUrl = useCallback((z: number, x: number, y: number) => {
    return buildWeatherTileUrl('clouds_new', z, x, y);
  }, []);

  const getTempTileUrl = useCallback((z: number, x: number, y: number) => {
    return buildWeatherTileUrl('temp_new', z, x, y);
  }, []);

  return {
    ...state,
    refresh,
    getCloudTileUrl,
    getTempTileUrl,
  };
}

// Hook for layer-specific data
export function useWeatherLayer(layer: 'clouds' | 'temp' | 'precipitation') {
  const { getCloudTileUrl, getTempTileUrl, loading, error } = useWeatherData();

  const getTileUrl = (z: number, x: number, y: number) => {
    switch (layer) {
      case 'clouds':
        return getCloudTileUrl(z, x, y);
      case 'temp':
        return getTempTileUrl(z, x, y);
      default:
        return getCloudTileUrl(z, x, y);
    }
  };

  return {
    getTileUrl,
    loading,
    error,
  };
}
