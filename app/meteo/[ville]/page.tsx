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

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      cityName
    )}&appid=${apiKey}&units=metric&lang=fr`,
    { next: { revalidate: 600 } }
  );

  if (!res.ok) {
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

  const data: WeatherData = await res.json();
  const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
      <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-xl">
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
    </main>
  );
}