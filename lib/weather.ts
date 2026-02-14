const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_TILE_BASE_URL = 'https://tile.openweathermap.org/map';

export type WeatherTileLayer = 'clouds_new' | 'temp_new';

export interface Coord {
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  coord: Coord;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind?: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds?: {
    all: number;
  };
  dt: number;
  name: string;
}

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_OPENWEATHER_API_KEY environment variable');
  }
  return apiKey;
}

async function weatherRequest<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const apiKey = getApiKey();
  const searchParams = new URLSearchParams({
    appid: apiKey,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const url = `${OPENWEATHER_BASE_URL}${path}?${searchParams.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenWeather request failed (${response.status}): ${body || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchCurrentWeatherByCoords(
  lat: number,
  lon: number,
  units: 'standard' | 'metric' | 'imperial' = 'metric'
): Promise<CurrentWeather> {
  return weatherRequest<CurrentWeather>('/weather', { lat, lon, units });
}

export function buildWeatherTileUrl(
  layer: WeatherTileLayer,
  z: number,
  x: number,
  y: number
): string {
  const apiKey = getApiKey();
  return `${OPENWEATHER_TILE_BASE_URL}/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`;
}
