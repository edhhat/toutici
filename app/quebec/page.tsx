// app/quebec/page.tsx
import QuebecMap, {
  type DayOption,
  type DayWeather,
  type QuebecCity,
} from '../components/QuebecMap';

export const runtime = 'edge';

export const metadata = {
  title: 'Météo pour la province du Québec · ToutIci',
};

const NB_DAYS = 5;

interface CityDef {
  name: string;
  lat: number;
  lon: number;
  /** 0 = toujours visible ; plus grand = visible seulement en zoomant */
  minZoom: number;
}

const CITIES: CityDef[] = [
  // Nord
  { name: 'Salluit', lat: 62.2, lon: -75.64, minZoom: 0 },
  { name: 'Kangiqsujuaq', lat: 61.6, lon: -71.95, minZoom: 0 },
  { name: 'Kangirsuk', lat: 60.02, lon: -70.03, minZoom: 0 },
  { name: 'Puvirnituq', lat: 60.04, lon: -77.28, minZoom: 0 },
  { name: 'Inukjuak', lat: 58.45, lon: -78.1, minZoom: 0 },
  { name: 'Kuujjuaq', lat: 58.1, lon: -68.4, minZoom: 0 },
  { name: 'Kuujjuarapik', lat: 55.28, lon: -77.77, minZoom: 5 },
  { name: 'Schefferville', lat: 54.8, lon: -66.82, minZoom: 0 },
  // Centre / Abitibi
  { name: 'Matagami', lat: 49.75, lon: -77.63, minZoom: 0 },
  { name: 'Val-d’Or', lat: 48.1, lon: -77.78, minZoom: 0 },
  { name: 'Rouyn-Noranda', lat: 48.24, lon: -79.02, minZoom: 6 },
  { name: 'Mistissini', lat: 50.42, lon: -73.87, minZoom: 0 },
  { name: 'Chibougamau', lat: 49.92, lon: -74.37, minZoom: 6 },
  // Côte-Nord / Gaspésie
  { name: 'Blanc-Sablon', lat: 51.42, lon: -57.12, minZoom: 0 },
  { name: 'Havre-Saint-Pierre', lat: 50.23, lon: -63.6, minZoom: 0 },
  { name: 'Sept-Îles', lat: 50.2, lon: -66.38, minZoom: 6 },
  { name: 'Baie-Comeau', lat: 49.22, lon: -68.15, minZoom: 6 },
  { name: 'Matane', lat: 48.85, lon: -67.53, minZoom: 0 },
  { name: 'Rimouski', lat: 48.45, lon: -68.52, minZoom: 6 },
  { name: 'Gaspé', lat: 48.83, lon: -64.48, minZoom: 5 },
  // Sud
  { name: 'Saguenay', lat: 48.43, lon: -71.07, minZoom: 0 },
  { name: 'Québec', lat: 46.81, lon: -71.21, minZoom: 0 },
  { name: 'Trois-Rivières', lat: 46.35, lon: -72.55, minZoom: 6 },
  { name: 'Montréal', lat: 45.5, lon: -73.57, minZoom: 0 },
  { name: 'Gatineau', lat: 45.48, lon: -75.7, minZoom: 6 },
  { name: 'Sherbrooke', lat: 45.4, lon: -71.89, minZoom: 6 },
];

interface ForecastItem {
  dt: number;
  main: { temp_min: number; temp_max: number };
  weather: { description: string; icon: string }[];
}

const DAY_MS = 86_400_000;

/** Regroupe les prévisions (aux 3 h) en NB_DAYS jours, selon l'heure locale de la ville */
function buildDays(list: ForecastItem[], tzOffset: number): (DayWeather | null)[] {
  const todayKey = new Date(Date.now() + tzOffset * 1000).toISOString().slice(0, 10);
  const keys = Array.from({ length: NB_DAYS }, (_, i) =>
    new Date(Date.parse(todayKey) + i * DAY_MS).toISOString().slice(0, 10)
  );

  const acc = new Map<
    string,
    { min: number; max: number; icon: string; description: string; gap: number }
  >();

  for (const item of list) {
    const local = new Date((item.dt + tzOffset) * 1000);
    const key = local.toISOString().slice(0, 10);
    if (!keys.includes(key)) continue;

    // On garde le symbole le plus proche de midi (heure locale)
    const gap = Math.abs(local.getUTCHours() - 13);
    const w = item.weather[0];
    const icon = `${w.icon.slice(0, 2)}d`;
    const cur = acc.get(key);

    if (!cur) {
      acc.set(key, {
        min: item.main.temp_min,
        max: item.main.temp_max,
        icon,
        description: w.description,
        gap,
      });
    } else {
      cur.min = Math.min(cur.min, item.main.temp_min);
      cur.max = Math.max(cur.max, item.main.temp_max);
      if (gap < cur.gap) {
        cur.icon = icon;
        cur.description = w.description;
        cur.gap = gap;
      }
    }
  }

  return keys.map((key) => {
    const d = acc.get(key);
    return d
      ? {
          min: Math.round(d.min),
          max: Math.round(d.max),
          icon: d.icon,
          description: d.description,
        }
      : null;
  });
}

async function fetchCity(def: CityDef, apiKey: string): Promise<QuebecCity | null> {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${def.lat}&lon=${def.lon}&units=metric&lang=fr&appid=${apiKey}`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return null;
    const json: { list: ForecastItem[]; city: { timezone: number } } = await res.json();
    return {
      name: def.name,
      lat: def.lat,
      lon: def.lon,
      minZoom: def.minZoom,
      days: buildDays(json.list, json.city.timezone),
    };
  } catch {
    return null;
  }
}

function buildDayOptions(): DayOption[] {
  return Array.from({ length: NB_DAYS }, (_, i) => {
    const date = new Date(Date.now() + i * DAY_MS);
    const fmt = (opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Toronto', ...opts }).format(date);

    const dayMonth = fmt({ day: 'numeric', month: 'long' });
    const weekday = fmt({ weekday: 'long' });
    const label =
      i === 0
        ? `Aujourd’hui, ${dayMonth}`
        : i === 1
          ? `Demain, ${dayMonth}`
          : `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dayMonth}`;

    return { key: fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }), label };
  });
}

export default async function QuebecPage() {
  const apiKey =
    process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
        <div className="max-w-md w-full rounded-3xl bg-white/5 backdrop-blur border border-red-400/30 p-8 text-center">
          <h1 className="text-xl font-semibold text-red-300 mb-2">Clé API manquante</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Ajoute la variable <code>OPENWEATHER_API_KEY</code> dans Cloudflare Pages
            (Paramètres &gt; Variables et secrets).
          </p>
        </div>
      </main>
    );
  }

  const results = await Promise.all(CITIES.map((c) => fetchCity(c, apiKey)));
  const cities = results.filter((c): c is QuebecCity => c !== null);
  const days = buildDayOptions();

  return (
    <main
      className="min-h-screen flex flex-col items-center gap-5 px-4 py-8 text-white"
      style={{ background: 'linear-gradient(180deg, #1c6fd1 0%, #4aa3e8 55%, #cfd9df 100%)' }}
    >
      <div className="w-full max-w-5xl">
        <a href="/" className="text-sm text-white/80 hover:text-white hover:underline">
          ← Accueil
        </a>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight drop-shadow">
          Météo pour la province du Québec
        </h1>
        <p className="mt-1 text-white/80 text-sm">
          Températures maximales (rouge) et minimales (bleu) prévues par ville.
        </p>
      </div>

      <div className="w-full max-w-5xl">
        {cities.length > 0 ? (
          <QuebecMap cities={cities} days={days} />
        ) : (
          <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-8 text-center">
            Impossible de récupérer la météo pour le moment. Réessaie dans quelques minutes.
          </div>
        )}
      </div>

      <footer className="w-full max-w-5xl mt-4 pt-6 border-t border-white/25 text-center text-xs leading-relaxed text-white/80">
        <nav
          aria-label="Liens du pied de page"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
        >
          <a href="/" className="hover:underline">Accueil</a>
          <a href="/conditions" className="hover:underline">Conditions d’utilisation</a>
          <a href="/confidentialite" className="hover:underline">Politique de confidentialité</a>
        </nav>
        <p className="mt-4">
          Données météo :{' '}
          <a
            href="https://openweathermap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            OpenWeather
          </a>
          {' · '}
          Carte : © Esri, Leaflet
        </p>
        <p className="mt-3">© {new Date().getFullYear()} Eddy Huart. Tous droits réservés.</p>
      </footer>
    </main>
  );
}
