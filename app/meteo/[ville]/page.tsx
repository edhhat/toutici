import VisitorCounter from '@/components/VisitorCounter';
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
      label: 'Aujourd’hui',
      value: `${Math.round(data.main.temp_min)}° / ${Math.round(data.main.temp_max)}°`,
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

          {/* Né ce jour : à droite du chiffre (écrans ≥ sm) */}
          {bornToday.length > 0 && (
            <aside className="hidden sm:block w-48 shrink-0 pb-2">
              <h2 className="text-xs uppercase tracking-wider text-white/55 mb-2 text-right">
                Né ce jour
              </h2>
              <ul className="space-y-2">
                {bornToday.slice(0, 3).map((p) => (
                  <li
                    key={`${p.year}-${p.name}`}
                    className="flex items-center justify-end gap-2"
                  >
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 text-right leading-tight hover:underline"
                    >
                      <span className="block text-sm font-medium truncate">
                        {p.name}
                      </span>
                      <span className="block text-xs text-white/55">
                        {p.year}
                      </span>
                    </a>
                    {p.thumbnail ? (
                      <img
                        src={p.thumbnail}
                        alt={p.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/15 shrink-0" />
                    )}
                  </li>
                ))}
              </ul>
            </aside>
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
                  <div className="relative h-1.5 rounded-full bg-white/15">
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
        </section>
      )}

      {/* Né ce jour (petits écrans seulement) */}
      {bornToday.length > 0 && (
        <section className="sm:hidden w-full max-w-xl rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 px-6 py-5">
          <h2 className="text-sm uppercase tracking-wider text-white/60 mb-3">
            Né ce jour
          </h2>
          <ul className="divide-y divide-white/10">
            {bornToday.map((p) => (
              <li
                key={`${p.year}-${p.name}`}
                className="flex items-center gap-3 py-2.5"
              >
                {p.thumbnail ? (
                  <img
                    src={p.thumbnail}
                    alt={p.name}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/15 shrink-0" />
                )}
                <div className="min-w-0 leading-tight">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium truncate hover:underline"
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
        </section>
      )}

      <div className="mt-2 text-white/70">
        <VisitorCounter />
      </div>
    </main>
  );
}
