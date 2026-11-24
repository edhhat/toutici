import VisitorCounter from '@/components/VisitorCounter';
import GeoWeather from '../../components/GeoWeather';
export const runtime = 'edge';

interface WeatherData {
  name: string;
  dt: number;
  timezone: number;
  sys: { country: string; sunrise: number; sunset: number };
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

/* Le ciel de la page change selon la météo et le moment de la journée */
/* Logo ToutIci : les deux « i » portent un soleil et un repère de position */
function ToutIciLogo() {
  return (
    <svg
      viewBox="-12 -24 276 96"
      role="img"
      aria-label="ToutIci"
      className="w-44 h-auto text-white drop-shadow-lg"
    >
      <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
<path d="M10 6V44Q10 60 26 60"/><path d="M-2 22H24"/>
<circle cx="54" cy="40" r="20"/>
<path d="M84 20V40A20 20 0 0 0 124 40V20M124 38V60"/>
<path d="M144 6V44Q144 60 160 60"/><path d="M132 22H158"/>
<path d="M229.3 27.1A20 20 0 1 0 229.3 52.9"/>
<path d="M178 20V60"/><path d="M250 20V60"/>
</g><g stroke="#ffb400" strokeWidth="2.6" strokeLinecap="round"><line x1="188.0" y1="-4.0" x2="192.5" y2="-4.0"/><line x1="185.1" y1="3.1" x2="188.3" y2="6.3"/><line x1="178.0" y1="6.0" x2="178.0" y2="10.5"/><line x1="170.9" y1="3.1" x2="167.7" y2="6.3"/><line x1="168.0" y1="-4.0" x2="163.5" y2="-4.0"/><line x1="170.9" y1="-11.1" x2="167.7" y2="-14.3"/><line x1="178.0" y1="-14.0" x2="178.0" y2="-18.5"/><line x1="185.1" y1="-11.1" x2="188.3" y2="-14.3"/></g><circle cx="178" cy="-4" r="7.5" fill="#ffc21a"/><path fill="#ff5a4d" fillRule="evenodd" d="M250 10L244.7 1.4A7 7 0 1 1 255.3 1.4ZM247.5 -3a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z"/>
    </svg>
  );
}

function getSkyGradient(icon: string): string {
  const isNight = icon.endsWith('n');
  const code = icon.slice(0, 2);

  if (isNight) {
    switch (code) {
      case '01':
      case '02':
        return 'linear-gradient(180deg, #0b1026 0%, #1b2250 55%, #3a3470 100%)';
      case '11':
        return 'linear-gradient(180deg, #0a0a14 0%, #1d1a33 60%, #35224d 100%)';
      case '13':
        return 'linear-gradient(180deg, #141a2b 0%, #2a3550 60%, #4a5876 100%)';
      default:
        return 'linear-gradient(180deg, #0d1220 0%, #1c2336 60%, #2c3447 100%)';
    }
  }

  switch (code) {
    case '01':
      return 'linear-gradient(180deg, #1c6fd1 0%, #4aa3e8 55%, #f2c27a 100%)';
    case '02':
      return 'linear-gradient(180deg, #3a7fc7 0%, #7ab1dc 60%, #cfd9df 100%)';
    case '03':
    case '04':
      return 'linear-gradient(180deg, #56677d 0%, #8394a8 60%, #b4bfca 100%)';
    case '09':
    case '10':
      return 'linear-gradient(180deg, #2c3e56 0%, #46607c 60%, #6c869f 100%)';
    case '11':
      return 'linear-gradient(180deg, #1e1b34 0%, #3b3560 60%, #5b5280 100%)';
    case '13':
      return 'linear-gradient(180deg, #7e97b3 0%, #b4c6d8 60%, #e3ecf4 100%)';
    case '50':
      return 'linear-gradient(180deg, #6b7684 0%, #9aa4af 60%, #c6ccd2 100%)';
    default:
      return 'linear-gradient(180deg, #1c6fd1 0%, #4aa3e8 100%)';
  }
}

function getCityLocalNow(timezoneOffset: number): Date {
  return new Date(Date.now() + timezoneOffset * 1000);
}

function formatCityDateTime(timezoneOffset: number): string {
  const localNow = getCityLocalNow(timezoneOffset);
  const datePart = new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(localNow);

  const timePart = new Intl.DateTimeFormat('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(localNow);

  return `${datePart.charAt(0).toUpperCase() + datePart.slice(1)}, ${timePart}`;
}

function formatCityTime(timestamp: number, timezoneOffset: number): string {
  return new Intl.DateTimeFormat('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date((timestamp + timezoneOffset) * 1000));
}

function groupForecastByDay(
  list: ForecastItem[],
  timezoneOffset: number
): DailyForecast[] {
  const todayKey = getCityLocalNow(timezoneOffset).toISOString().split('T')[0];

  const daysMap = new Map<
    string,
    {
      localDate: Date;
      min: number;
      max: number;
      icon: string;
      description: string;
      hasMiddayIcon: boolean;
    }
  >();

  for (const item of list) {
    const localDate = new Date((item.dt + timezoneOffset) * 1000);
    const dateKey = localDate.toISOString().split('T')[0];

    // Exclut aujourd'hui (selon le fuseau horaire de la ville) pour éviter le doublon
    if (dateKey <= todayKey) continue;

    const localHour = localDate.getUTCHours();
    const dayIcon = item.weather[0].icon.replace('n', 'd');
    const existing = daysMap.get(dateKey);

    if (!existing) {
      daysMap.set(dateKey, {
        localDate,
        min: item.main.temp_min,
        max: item.main.temp_max,
        icon: dayIcon,
        description: item.weather[0].description,
        hasMiddayIcon: localHour >= 11 && localHour <= 15,
      });
    } else {
      existing.min = Math.min(existing.min, item.main.temp_min);
      existing.max = Math.max(existing.max, item.main.temp_max);
      if (localHour >= 11 && localHour <= 15 && !existing.hasMiddayIcon) {
        existing.icon = dayIcon;
        existing.description = item.weather[0].description;
        existing.hasMiddayIcon = true;
      }
    }
  }

  return Array.from(daysMap.entries())
    .slice(0, 5)
    .map(([dateKey, d]) => {
      const rawDay = new Intl.DateTimeFormat('fr-CA', {
        weekday: 'long',
        timeZone: 'UTC',
      }).format(d.localDate);
      const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
      const dayNumber = new Intl.DateTimeFormat('fr-CA', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }).format(d.localDate);

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

interface BornToday {
  name: string;
  year: number;
  description: string;
  thumbnail?: string;
  url?: string;
}

/* Personnalités nées ce jour-là (API « Ce jour-là » de Wikipédia en français) */
async function getBornToday(timezoneOffset: number): Promise<BornToday[]> {
  try {
    const now = getCityLocalNow(timezoneOffset);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');

    const res = await fetch(
      `https://api.wikimedia.org/feed/v1/wikipedia/fr/onthisday/births/${mm}/${dd}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];

    const json = await res.json();
    const births: {
      text: string;
      year: number;
      pages?: {
        titles?: { normalized?: string };
        description?: string;
        thumbnail?: { source: string };
        content_urls?: { desktop?: { page?: string } };
      }[];
    }[] = json.births ?? [];

    return births
      .filter((b) => b.pages && b.pages.length > 0)
      .sort((a, b) => b.year - a.year)
      .slice(0, 5)
      .map((b) => {
        const page = b.pages![0];
        return {
          name: page.titles?.normalized ?? b.text,
          year: b.year,
          description: page.description ?? '',
          thumbnail: page.thumbnail?.source,
          url: page.content_urls?.desktop?.page,
        };
      });
  } catch {
    return [];
  }
}

/* Animation du gâteau qui se fait manger : 5 bouchées successives, puis il réapparaît */
const BITE_TIMES = [12, 27, 42, 57, 72];
const BITE_CSS = `
${BITE_TIMES.map(
  (t, i) =>
    `@keyframes bite${i}{0%,${t}%{transform:scale(0)}${t + 5}%,90%{transform:scale(1)}100%{transform:scale(0)}}`
).join('\n')}
.bite{transform-box:fill-box;transform-origin:center;transform:scale(0)}
${BITE_TIMES.map(
  (_, i) => `.bite${i}{animation:bite${i} 7s ease-in-out infinite}`
).join('\n')}
details[open] .bite{animation:none;transform:scale(0)}
@media (prefers-reduced-motion:reduce){.bite{animation:none!important}}
`;

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
        <div className="max-w-md w-full rounded-3xl bg-white/5 backdrop-blur border border-red-400/30 p-8 text-center">
          <h1 className="text-xl font-semibold text-red-300 mb-2">
            Clé API manquante
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
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
        <div className="max-w-md w-full rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">Ville introuvable</h1>
          <p className="text-slate-400 leading-relaxed">
            Impossible de récupérer la météo pour « {cityName} ». Vérifie
            l’orthographe et réessaie.
          </p>
        </div>
      </main>
    );
  }

  const data: WeatherData = await weatherRes.json();
  const forecastData: ForecastResponse | null = forecastRes.ok
    ? await forecastRes.json()
    : null;
  const dailyForecast = forecastData
    ? groupForecastByDay(forecastData.list, data.timezone)
    : [];
  const bornToday = await getBornToday(data.timezone);
  const todayFormatted = formatCityDateTime(data.timezone);
  const currentIcon = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${currentIcon}@4x.png`;

  const weekMin = Math.min(...dailyForecast.map((d) => d.min));
  const weekMax = Math.max(...dailyForecast.map((d) => d.max));
  const weekSpan = Math.max(weekMax - weekMin, 1);

  const details: { label: string; value: string }[] = [
    { label: 'Ressenti', value: `${Math.round(data.main.feels_like)}°` },
    { label: 'Humidité', value: `${data.main.humidity} %` },
    { label: 'Vent', value: `${Math.round(data.wind.speed * 3.6)} km/h` },
    {
      label: 'Température du jour',
      value: `Min ${Math.round(data.main.temp_min)}° · Max ${Math.round(data.main.temp_max)}°`,
    },
    {
      label: 'Lever du soleil',
      value: formatCityTime(data.sys.sunrise, data.timezone),
    },
    {
      label: 'Coucher du soleil',
      value: formatCityTime(data.sys.sunset, data.timezone),
    },
  ];

  return (
    <main
      className="min-h-screen flex flex-col items-center gap-5 px-5 py-10 text-white"
      style={{ background: getSkyGradient(currentIcon) }}
    >
      <style>{BITE_CSS}</style>

      <header className="w-full max-w-xl px-1">
        <ToutIciLogo />
      </header>

      {/* Météo actuelle */}
      <section className="w-full max-w-xl px-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-semibold tracking-tight truncate">
              {data.name}
              <span className="ml-2 text-xl font-normal text-white/60">
                {data.sys.country}
              </span>
            </h1>
            <p className="mt-1 text-white/75">{todayFormatted}</p>
          </div>
          <img
            src={iconUrl}
            alt={data.weather[0].description}
            className="w-24 h-24 -mt-3 -mr-2 drop-shadow-lg shrink-0"
          />
        </div>

        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="flex items-end gap-4 min-w-0">
            <span className="text-[7.5rem] leading-[0.9] font-extralight tracking-tighter tabular-nums">
              {Math.round(data.main.temp)}°
            </span>
            <span className="pb-3 text-xl capitalize text-white/85">
              {data.weather[0].description}
            </span>
          </div>

          {/* Né ce jour : s'ouvre au clic sur l'icône */}
          {bornToday.length > 0 && (
            <details className="relative shrink-0 pb-3 group">
              <summary
                className="relative list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-2xl transition hover:bg-white/20 group-open:bg-white/25"
                aria-label="Né ce jour"
                title="Né ce jour"
              >
                {/* Onde qui pulse pour inviter au clic (disparaît à l'ouverture) */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-white/30 motion-safe:animate-ping group-open:hidden"
                />
                <svg
                  viewBox="0 0 40 40"
                  className="relative w-8 h-8"
                  aria-hidden="true"
                >
                  <defs>
                    <mask id="cakeBites">
                      <rect width="40" height="40" fill="white" />
                      <circle className="bite bite0" cx="32" cy="20" r="5" fill="black" />
                      <circle className="bite bite1" cx="31" cy="27" r="5.5" fill="black" />
                      <circle className="bite bite2" cx="24" cy="22" r="7" fill="black" />
                      <circle className="bite bite3" cx="15" cy="25" r="9" fill="black" />
                      <circle className="bite bite4" cx="17" cy="12" r="8" fill="black" />
                    </mask>
                  </defs>
                  <ellipse cx="20" cy="33" rx="16" ry="3" fill="#e5e7eb" />
                  <g mask="url(#cakeBites)">
                    <rect x="8" y="22" width="24" height="10" rx="2" fill="#e8955a" />
                    <rect x="8" y="14" width="24" height="9" rx="2" fill="#f7c6d9" />
                    <path d="M8 14H32V18Q29 22 26 18Q23 22 20 18Q17 22 14 18Q11 22 8 18Z" fill="#ffffff" />
                    <rect x="19" y="7" width="2" height="7" fill="#60a5fa" />
                    <ellipse cx="20" cy="5" rx="1.6" ry="2.4" fill="#fbbf24" />
                    <circle cx="13" cy="28" r="1" fill="#fde68a" />
                    <circle cx="20" cy="27" r="1" fill="#fde68a" />
                    <circle cx="27" cy="28" r="1" fill="#fde68a" />
                  </g>
                </svg>
              </summary>

              <div className="absolute right-0 top-full z-20 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/15 p-4 shadow-xl">
                <h2 className="text-xs uppercase tracking-wider text-white/60 mb-2">
                  Né ce jour
                </h2>
                <ul className="divide-y divide-white/10">
                  {bornToday.map((p) => (
                    <li
                      key={`${p.year}-${p.name}`}
                      className="flex items-center gap-3 py-2"
                    >
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/15 shrink-0" />
                      )}
                      <div className="min-w-0 leading-tight">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm font-medium truncate hover:underline"
                        >
                          {p.name}
                        </a>
                        <span className="block text-xs text-white/55 truncate">
                          {p.year}
                          {p.description ? ` · ${p.description}` : ''}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}
        </div>
      </section>

      {/* Détails */}
      <section className="w-full max-w-xl rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
          {details.map((item) => (
            <div key={item.label}>
              <dt className="text-sm text-white/60">{item.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Prévisions : la barre situe chaque journée dans l’écart de la semaine */}
      {dailyForecast.length > 0 && (
        <section className="w-full max-w-xl rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 px-6 py-2">
          <h2 className="sr-only">Prévisions des prochains jours</h2>
          <div
            aria-hidden="true"
            className="grid grid-cols-[6.5rem_2.75rem_2rem_1fr_2rem] items-center gap-2 pt-3 pb-1 text-[0.7rem] uppercase tracking-wider text-white/50"
          >
            <span />
            <span />
            <span className="text-right">Min</span>
            <span />
            <span>Max</span>
          </div>
          <ul className="divide-y divide-white/10">
            {dailyForecast.map((day) => {
              const left = ((day.min - weekMin) / weekSpan) * 100;
              const width = Math.max(((day.max - day.min) / weekSpan) * 100, 6);

              return (
                <li
                  key={day.dateKey}
                  className="grid grid-cols-[6.5rem_2.75rem_2rem_1fr_2rem] items-center gap-2 py-2.5"
                >
                  <div className="leading-tight">
                    <span className="block font-medium">{day.dayName}</span>
                    <span className="block text-xs text-white/55">
                      {day.dayNumber}
                    </span>
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                    alt={day.description}
                    title={day.description}
                    className="w-11 h-11"
                  />
                  <span className="text-right text-sm tabular-nums text-white/70">
                    {day.min}°
                  </span>
                  <div
                    className="relative h-1.5 rounded-full bg-white/15"
                    title={`Minimum ${day.min}° – Maximum ${day.max}°`}
                  >
                    <div
                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-200 to-amber-300"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {day.max}°
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="py-3 text-xs text-white/45">
            Min : température la plus basse du jour · Max : la plus élevée. La
            barre situe ces deux valeurs par rapport à l’écart de la semaine.
          </p>
        </section>
      )}

      {/* Météo à la position de l'utilisateur */}
      <div className="w-full max-w-xl">
        <GeoWeather />
      </div>

      <div className="mt-2 text-white/70">
        <VisitorCounter />
      </div>

      <footer className="w-full max-w-xl mt-6 pt-6 border-t border-white/15 text-center text-xs leading-relaxed text-white/55">
        <nav
          aria-label="Liens du pied de page"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/75"
        >
          <a href="/" className="hover:text-white hover:underline">
            Accueil
          </a>
          <a href="/conditions" className="hover:text-white hover:underline">
            Conditions d’utilisation
          </a>
          <a href="/confidentialite" className="hover:text-white hover:underline">
            Politique de confidentialité
          </a>
        </nav>

        <p className="mt-5">
          Données météo :{' '}
          <a
            href="https://openweathermap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            OpenWeather
          </a>
          {' · '}
          Personnalités :{' '}
          <a
            href="https://fr.wikipedia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            Wikipédia
          </a>
        </p>

        <p className="mt-3">
          © {getCityLocalNow(data.timezone).getUTCFullYear()} Eddy Huart. Tous
          droits réservés.
        </p>
        <p className="mt-1">ToutIci est la propriété d’Eddy Huart.</p>
      </footer>
    </main>
  );
}
