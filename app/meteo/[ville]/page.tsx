export const runtime = 'edge';

interface WeatherData {
  name: string;
  sys: { country: string };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
}

interface ForecastItem {
  dt: number;
  dt_txt: string;
  main: {
    temp_min: number;
    temp_max: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
}

interface ForecastResponse {
  list: ForecastItem[];
}

interface DailyForecast {
  dateKey: string;
  dayName: string;
  dayNumber: string;
  min: number;
  max: number;
  icon: string;
  description: string;
}

function groupForecastByDay(list: ForecastItem[]): DailyForecast[] {
  const daysMap = new Map<
    string,
    {
      date: Date;
      min: number;
      max: number;
      icon: string;
      description: string;
      hasMiddayIcon: boolean;
    }
  >();

  for (const item of list) {
    const dateKey = item.dt_txt.split(' ')[0]; // YYYY-MM-DD
    const hour = item.dt_txt.split(' ')[1]; // HH:MM:SS
    const date = new Date(item.dt * 1000);
    const existing = daysMap.get(dateKey);

    if (!existing) {
      daysMap.set(dateKey, {
        date,
        min: item.main.temp_min,
        max: item.main.temp_max,
        icon: item.weather[0].icon,
        description: item.weather[0].description,
        hasMiddayIcon: hour === '12:00:00',
      });
    } else {
      existing.min = Math.min(existing.min, item.main.temp_min);
      existing.max = Math.max(existing.max, item.main.temp_max);
      if (hour === '12:00:00' || (!existing.hasMiddayIcon && hour === '15:00:00')) {
        existing.icon = item.weather[0].icon;
        existing.description = item.weather[0].description;
        existing.hasMiddayIcon = true;
      }
    }
  }

  return Array.from(daysMap.entries())
    .slice(0, 6)
    .map(([dateKey, d]) => {
      const rawDay = new Intl.DateTimeFormat('fr-CA', {
        weekday: 'short',
      }).format(d.date);
      const dayName =
        rawDay.charAt(0).toUpperCase() + rawDay.slice(1).replace('.', '');
      const dayNumber = new Intl.DateTimeFormat('fr-CA', {
        day: 'numeric',
      }).format(d.date);

      return {
        dateKey,
        dayName,
        dayNumber,
        min: Math.round(d.min),
        max: Math.round(d.max),
        icon: d.icon,
        description: d.description,
      };
    });
}

export default async function MeteoVillePage({
  params,
}: {
  params: Promise<{ ville: string }>;
}) {
  const { ville } = await params;
  const cityName = decodeURIComponent(ville);
  const apiKey =
    process.env.OPENWEATHER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-red-500/40 p-6 text-center">
          <h1 className="text-xl font-bold text-red-400 mb-2">
            Clé API manquante
          </h1>
          <p className="text-slate-300 text-sm">
            Ajoute la variable <code>OPENWEATHER_API_KEY</code> dans Cloudflare
            Pages (Paramètres &gt; Variables et secrets).
          </p>
        </div>
      </main>
    );
  }

  const query = encodeURIComponent(cityName);
  const [weatherRes, forecastRes] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric&lang=fr`,
      { next: { revalidate: 600 } }
    ),
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${apiKey}&units=metric&lang=fr`,
      { next: { revalidate: 600 } }
    ),
  ]);

  if (!weatherRes.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Ville introuvable</h1>
          <p className="text-slate-400">
            Impossible de récupérer la météo pour « {cityName} ».
          </p>
        </div>
      </main>
    );
  }

  const data: WeatherData = await weatherRes.json();
  const forecastData: ForecastResponse | null = forecastRes.ok
    ? await forecastRes.json()
    : null;
  const dailyForecast = forecastData ? groupForecastByDay(forecastData.list) : [];
  const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-slate-950 text-white">
      {/* Carte météo actuelle */}
      <div className="max-w-xl w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <p className="text-slate-400 capitalize">
              {data.weather[0].description}
            </p>
          </div>
          <img
            src={iconUrl}
            alt={data.weather[0].description}
            className="w-20 h-20"
          />
        </div>

        <div className="text-6xl font-extrabold mb-6">
          {Math.round(data.main.temp)}°C
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-slate-300 border-t border-slate-800 pt-4">
          <div>
            <span className="text-slate-500 block">Ressenti</span>
            <span className="font-semibold">
              {Math.round(data.main.feels_like)}°C
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Humidité</span>
            <span className="font-semibold">{data.main.humidity}%</span>
          </div>
          <div>
            <span className="text-slate-500 block">Min / Max</span>
            <span className="font-semibold">
              {Math.round(data.main.temp_min)}° / {Math.round(data.main.temp_max)}°
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Vent</span>
            <span className="font-semibold">
              {Math.round(data.wind.speed * 3.6)} km/h
            </span>
          </div>
        </div>
      </div>

      {/* Barre de prévisions journalières */}
      {dailyForecast.length > 0 && (
        <div className="max-w-xl w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[minmax(88px,1fr)] divide-x divide-slate-800">
            {dailyForecast.map((day, index) => (
              <div
                key={day.dateKey}
                className={`relative flex flex-col items-center py-4 px-2 text-center ${
                  index === 0
                    ? 'bg-slate-800/60 border-b-2 border-cyan-400'
                    : 'hover:bg-slate-800/30 transition-colors'
                }`}
              >
                <span className="text-sm font-medium text-slate-200">
                  {day.dayName}
                </span>
                <span className="text-base font-bold text-white leading-tight">
                  {day.dayNumber}
                </span>

                <img
                  src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                  alt={day.description}
                  title={day.description}
                  className="w-12 h-12 my-1"
                />

                <span className="text-sm font-bold text-rose-400">
                  {day.max}°
                </span>
                <span className="text-sm font-semibold text-sky-400">
                  {day.min}°
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}