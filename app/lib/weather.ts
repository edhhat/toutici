// app/lib/weather.ts

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  visibility?: number;
  pop?: number;
}

export interface ForecastResponse {
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    sunrise: number;
    sunset: number;
  };
  list: ForecastItem[];
}

export interface CityConfig {
  label: string;
  query: string;
}

export interface CountryConfig {
  slug: string;
  name: string;
  flag: string;
  mapCenter: [number, number];
  mapZoom: number;
  cities: CityConfig[];
}

export const COUNTRIES: Record<string, CountryConfig> = {
  quebec: {
    slug: 'quebec',
    name: 'Québec',
    flag: '🇨🇦',
    mapCenter: [46.1, -73.0],
    mapZoom: 8,
    cities: [
      { label: 'Montréal', query: 'Montréal,CA' },
      { label: 'Québec', query: 'Québec,CA' },
      { label: 'Laval', query: 'Laval,CA' },
      { label: 'Gatineau', query: 'Gatineau,CA' },
      { label: 'Longueuil', query: 'Longueuil,CA' },
      { label: 'Sherbrooke', query: 'Sherbrooke,CA' },
      { label: 'Saguenay', query: 'Saguenay,CA' },
      { label: 'Trois-Rivières', query: 'Trois-Rivières,CA' },
    ],
  },
  france: {
    slug: 'france',
    name: 'France',
    flag: '🇫🇷',
    mapCenter: [46.6, 2.2],
    mapZoom: 5,
    cities: [
      { label: 'Paris', query: 'Paris,FR' },
      { label: 'Marseille', query: 'Marseille,FR' },
      { label: 'Lyon', query: 'Lyon,FR' },
      { label: 'Toulouse', query: 'Toulouse,FR' },
      { label: 'Nice', query: 'Nice,FR' },
      { label: 'Nantes', query: 'Nantes,FR' },
      { label: 'Bordeaux', query: 'Bordeaux,FR' },
      { label: 'Lille', query: 'Lille,FR' },
    ],
  },
};

export async function getWeatherAndForecast(query: string): Promise<ForecastResponse | null> {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&units=metric&lang=fr&appid=${apiKey}`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}