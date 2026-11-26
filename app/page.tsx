// app/page.tsx
import VisitorCounter from '@/components/VisitorCounter';
import HomeSearch from './components/HomeSearch';
import HeroPhotos, { type HeroPhoto } from './components/HeroPhotos';
import WorldLive, { type NewsItem, type Quake, type WorldCity } from './components/WorldLive';

export const runtime = 'edge';

export const metadata = {
  title: 'ToutIci · Météo, carte du Québec et LNH en direct',
  description:
    'Tout ici, tout de suite. Météo des villes du Québec et du Canada, carte météo du Québec, LNH en direct et actualités du monde.',
};

const ACCENT = '#c8ff3d';

/* ---------- Logo ---------- */
function ToutIciLogo() {
  return (
    <svg
      viewBox="-12 -24 276 96"
      role="img"
      aria-label="ToutIci"
      className="h-auto w-36 text-white sm:w-44"
    >
      <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 6V44Q10 60 26 60" />
        <path d="M-2 22H24" />
        <circle cx="54" cy="40" r="20" />
        <path d="M84 20V40A20 20 0 0 0 124 40V20M124 38V60" />
        <path d="M144 6V44Q144 60 160 60" />
        <path d="M132 22H158" />
        <path d="M229.3 27.1A20 20 0 1 0 229.3 52.9" />
        <path d="M178 20V60" />
        <path d="M250 20V60" />
      </g>
      <g stroke="#ffb400" strokeWidth="2.6" strokeLinecap="round">
        <line x1="188.0" y1="-4.0" x2="192.5" y2="-4.0" />
        <line x1="185.1" y1="3.1" x2="188.3" y2="6.3" />
        <line x1="178.0" y1="6.0" x2="178.0" y2="10.5" />
        <line x1="170.9" y1="3.1" x2="167.7" y2="6.3" />
        <line x1="168.0" y1="-4.0" x2="163.5" y2="-4.0" />
        <line x1="170.9" y1="-11.1" x2="167.7" y2="-14.3" />
        <line x1="178.0" y1="-14.0" x2="178.0" y2="-18.5" />
        <line x1="185.1" y1="-11.1" x2="188.3" y2="-14.3" />
      </g>
      <circle cx="178" cy="-4" r="7.5" fill="#ffc21a" />
      <path
        fill="#ff5a4d"
        fillRule="evenodd"
        d="M250 10L244.7 1.4A7 7 0 1 1 255.3 1.4ZM247.5 -3a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z"
      />
    </svg>
  );
}

/* ---------- Données : météo des villes du Québec ---------- */
const HOME_CITIES = [
  { name: 'Montréal', q: 'Montréal,CA', lat: 45.5, lon: -73.57 },
  { name: 'Québec', q: 'Québec,CA', lat: 46.81, lon: -71.21 },
  { name: 'Gatineau', q: 'Gatineau,CA', lat: 45.48, lon: -75.7 },
  { name: 'Sherbrooke', q: 'Sherbrooke,CA', lat: 45.4, lon: -71.89 },
  { name: 'Saguenay', q: 'Saguenay,CA', lat: 48.43, lon: -71.07 },
  { name: 'Trois-Rivières', q: 'Trois-Rivières,CA', lat: 46.35, lon: -72.55 },
];

/** Points décoratifs supplémentaires pour dessiner le Québec sur la carte */
const MAP_EXTRA_DOTS: [number, number][] = [
  [62.2, -75.64], [61.6, -71.95], [60.02, -70.03], [58.45, -78.1], [58.1, -68.4],
  [55.28, -77.77], [54.8, -66.82], [51.42, -57.12], [50.23, -63.6], [50.2, -66.38],
  [49.22, -68.15], [48.85, -67.53], [48.83, -64.48], [50.42, -73.87], [49.75, -77.63],
  [48.1, -77.78], [48.24, -79.02], [48.45, -68.52],
];

interface CityNow {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  feels: number;
  icon: string;
  description: string;
}

async function getCitiesNow(apiKey: string | undefined): Promise<CityNow[]> {
  if (!apiKey) return [];

  const results = await Promise.all(
    HOME_CITIES.map(async (c): Promise<CityNow | null> => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(c.q)}&units=metric&lang=fr&appid=${apiKey}`,
          { next: { revalidate: 600 } }
        );
        if (!res.ok) return null;
        const d = await res.json();
        return {
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          temp: Math.round(d.main.temp),
          feels: Math.round(d.main.feels_like),
          icon: d.weather?.[0]?.icon ?? '01d',
          description: d.weather?.[0]?.description ?? '',
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is CityNow => r !== null);
}

/* ---------- Données : LNH du jour ---------- */
interface NhlRow {
  id: number;
  away: string;
  home: string;
  awayScore: number | null;
  homeScore: number | null;
  status: string;
  live: boolean;
}

interface NhlSummary {
  total: number;
  live: number;
  rows: NhlRow[];
}

function periodShort(n: number | null, type: string): string {
  if (type === 'OT') return 'Prol.';
  if (type === 'SO') return 'TB';
  if (n === 1) return '1re';
  return n ? `${n}e` : '';
}

async function getNhlSummary(): Promise<NhlSummary | null> {
  try {
    const res = await fetch('https://api-web.nhle.com/v1/score/now', {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const json: any = await res.json();
    const games: any[] = json.games ?? [];

    const isLive = (g: any) => g.gameState === 'LIVE' || g.gameState === 'CRIT';
    const isFuture = (g: any) => g.gameState === 'FUT' || g.gameState === 'PRE';
    const rank = (g: any) => (isLive(g) ? 0 : isFuture(g) ? 1 : 2);

    const rows: NhlRow[] = [...games]
      .sort((a, b) => rank(a) - rank(b) || String(a.startTimeUTC).localeCompare(String(b.startTimeUTC)))
      .slice(0, 4)
      .map((g) => {
        let status = 'Final';
        if (isLive(g)) {
          const p = periodShort(g.periodDescriptor?.number ?? null, g.periodDescriptor?.periodType ?? 'REG');
          status = g.clock?.inIntermission ? 'Entracte' : `${p} ${g.clock?.timeRemaining ?? ''}`.trim();
        } else if (isFuture(g)) {
          status = new Intl.DateTimeFormat('fr-CA', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Toronto',
          }).format(new Date(g.startTimeUTC));
        } else if (g.gameOutcome?.lastPeriodType === 'OT') {
          status = 'Final / Prol.';
        } else if (g.gameOutcome?.lastPeriodType === 'SO') {
          status = 'Final / TB';
        }
        return {
          id: g.id,
          away: g.awayTeam?.abbrev ?? '',
          home: g.homeTeam?.abbrev ?? '',
          awayScore: typeof g.awayTeam?.score === 'number' ? g.awayTeam.score : null,
          homeScore: typeof g.homeTeam?.score === 'number' ? g.homeTeam.score : null,
          status,
          live: isLive(g),
        };
      });

    return { total: games.length, live: games.filter(isLive).length, rows };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  } catch {
    return null;
  }
}

/* ---------- Plan B : « Image du jour » de Wikimedia Commons ---------- */
async function getWikimediaPhotos(): Promise<HeroPhoto[]> {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86_400_000);
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${d.getUTCFullYear()}/${mm}/${dd}`;
  });

  const results = await Promise.all(
    days.map(async (day): Promise<HeroPhoto | null> => {
      try {
        const res = await fetch(`https://fr.wikipedia.org/api/rest_v1/feed/featured/${day}`, {
          headers: { 'User-Agent': 'ToutIci/1.0 (https://toutici.ca)', Accept: 'application/json' },
          next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const json: any = await res.json();
        const img = json.image;
        if (!img) return null;

        // Seulement de vraies photos paysage (pas de vidéos, de cartes SVG ni de portraits)
        const full = img.image;
        if (!full?.source || !/\.(jpe?g|png|webp)$/i.test(full.source)) return null;
        if (typeof full.width === 'number' && typeof full.height === 'number' && full.width < full.height) {
          return null;
        }

        let src: string | undefined = img.thumbnail?.source;
        if (!src) return null;
        if (typeof full.width === 'number' && full.width >= 1280) {
          src = src.replace(/\/\d+px-([^/]+)$/, '/1280px-$1');
        }

        const credit: string = String(img.artist?.text ?? img.credit?.text ?? 'Wikimedia Commons')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 60);

        return {
          src,
          alt: String(img.description?.text ?? img.title ?? '').slice(0, 160),
          credit: credit || 'Wikimedia Commons',
          license: String(img.license?.type ?? ''),
          source: 'Wikimedia Commons',
          page:
            img.file_page ??
            `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(img.title ?? ''))}`,
        };
        /* eslint-enable @typescript-eslint/no-explicit-any */
      } catch {
        return null;
      }
    })
  );

  const seen = new Set<string>();
  return results.filter((r): r is HeroPhoto => {
    if (!r || seen.has(r.src)) return false;
    seen.add(r.src);
    return true;
  });
}

/* ---------- Photos précises (Québec, hiver, hockey…) : recherche sur Wikimedia Commons, sans clé ---------- */
const COMMONS_QUERIES = [
  'Quebec City',
  'Montreal skyline',
  'Quebec winter snow',
  'ice hockey',
  'Quebec autumn',
];

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();

async function getCommonsPhotos(): Promise<HeroPhoto[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const lists: HeroPhoto[][] = await Promise.all(
    COMMONS_QUERIES.map(async (q): Promise<HeroPhoto[]> => {
      try {
        const params = new URLSearchParams({
          action: 'query',
          format: 'json',
          generator: 'search',
          gsrsearch: `${q} filetype:bitmap`,
          gsrnamespace: '6',
          gsrlimit: '20',
          prop: 'imageinfo',
          iiprop: 'url|size|mime|extmetadata',
          iiurlwidth: '1280',
          iiextmetadatafilter: 'Artist|LicenseShortName|ObjectName',
        });
        const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
          headers: { 'User-Agent': 'ToutIci/1.0 (https://toutici.ca)', Accept: 'application/json' },
          next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json: any = await res.json();
        const pages: any[] = Object.values(json?.query?.pages ?? {});
        pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

        const out: HeroPhoto[] = [];
        for (const pg of pages) {
          const info = pg.imageinfo?.[0];
          if (!info?.thumburl) continue;
          // Seulement de vraies photos JPEG en paysage et de bonne taille
          if (info.mime !== 'image/jpeg') continue;
          if (typeof info.width !== 'number' || typeof info.height !== 'number') continue;
          const ratio = info.width / info.height;
          if (info.width < 1600 || ratio < 1.3 || ratio > 2.4) continue;

          const meta = info.extmetadata ?? {};
          const artist = stripHtml(String(meta.Artist?.value ?? '')).slice(0, 60);
          out.push({
            src: String(info.thumburl),
            alt: stripHtml(String(meta.ObjectName?.value ?? pg.title ?? '')).slice(0, 160),
            credit: artist || 'Wikimedia Commons',
            license: stripHtml(String(meta.LicenseShortName?.value ?? '')).slice(0, 30),
            source: 'Wikimedia Commons',
            page: String(info.descriptionurl ?? 'https://commons.wikimedia.org'),
          });
          if (out.length >= 6) break;
        }
        return out;
      } catch {
        return [];
      }
    })
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Une photo de chaque recherche à tour de rôle, sans doublon
  const mixed: HeroPhoto[] = [];
  const seen = new Set<string>();
  for (let round = 0; round < 6; round++) {
    for (const list of lists) {
      const ph = list[round];
      if (ph && !seen.has(ph.src)) {
        seen.add(ph.src);
        mixed.push(ph);
      }
    }
  }

  // Le point de départ change chaque jour, pour que la page se renouvelle
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  const offset = mixed.length ? dayNumber % mixed.length : 0;
  return [...mixed.slice(offset), ...mixed.slice(0, offset)].slice(0, 12);
}

async function getHeroPhotos(): Promise<HeroPhoto[]> {
  const photos = await getCommonsPhotos();
  if (photos.length >= 3) return photos;
  return getWikimediaPhotos(); // plan B : image du jour
}

/* ---------- Le monde en direct ---------- */
const WIKI_HEADERS = { 'User-Agent': 'ToutIci/1.0 (https://toutici.ca)', Accept: 'application/json' };

function stripHtmlText(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, '’')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:)])/g, '$1')
    .trim();
}

/* Actualités : rubrique « À la une » de Wikipédia en français (texte CC BY-SA 4.0) */
async function getWorldNews(): Promise<NewsItem[]> {
  for (const back of [0, 1]) {
    try {
      const d = new Date(Date.now() - back * 86_400_000);
      const day = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
      const res = await fetch(`https://fr.wikipedia.org/api/rest_v1/feed/featured/${day}`, {
        headers: WIKI_HEADERS,
        next: { revalidate: 600 },
      });
      if (!res.ok) continue;
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const json: any = await res.json();
      const items: NewsItem[] = (json.news ?? [])
        .map((n: any) => {
          const text = stripHtmlText(String(n.story ?? ''));
          const url = n.links?.[0]?.content_urls?.desktop?.page ?? 'https://fr.wikipedia.org';
          return { text, url: String(url) };
        })
        .filter((n: NewsItem) => n.text.length > 10)
        .slice(0, 8);
      /* eslint-enable @typescript-eslint/no-explicit-any */
      if (items.length > 0) return items;
    } catch {
      /* on essaie la veille */
    }
  }
  return [];
}

/* Séismes M4,5+ des dernières 24 h : USGS (domaine public) */
async function getQuakes(): Promise<Quake[]> {
  try {
    const res = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const json: any = await res.json();
    return (json.features ?? [])
      .map((f: any): Quake | null => {
        const c = f.geometry?.coordinates;
        const pr = f.properties;
        if (!Array.isArray(c) || typeof pr?.mag !== 'number') return null;
        return {
          id: String(f.id),
          mag: pr.mag,
          place: String(pr.place ?? 'Lieu inconnu'),
          time: Number(pr.time),
          lat: Number(c[1]),
          lon: Number(c[0]),
          url: String(pr.url ?? 'https://earthquake.usgs.gov'),
        };
      })
      .filter((q: Quake | null): q is Quake => q !== null);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  } catch {
    return [];
  }
}

const WORLD_CITIES = [
  { name: 'Paris', q: 'Paris,FR', link: 'Paris' },
  { name: 'Londres', q: 'London,GB', link: 'London' },
  { name: 'New York', q: 'New York,US', link: 'New York' },
  { name: 'Los Angeles', q: 'Los Angeles,US', link: 'Los Angeles' },
  { name: 'Tokyo', q: 'Tokyo,JP', link: 'Tokyo' },
  { name: 'Sydney', q: 'Sydney,AU', link: 'Sydney' },
  { name: 'Dubaï', q: 'Dubai,AE', link: 'Dubai' },
  { name: 'Rio de Janeiro', q: 'Rio de Janeiro,BR', link: 'Rio de Janeiro' },
];

async function getWorldCities(apiKey: string | undefined): Promise<WorldCity[]> {
  if (!apiKey) return [];
  const results = await Promise.all(
    WORLD_CITIES.map(async (c): Promise<WorldCity | null> => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(c.q)}&units=metric&lang=fr&appid=${apiKey}`,
          { next: { revalidate: 600 } }
        );
        if (!res.ok) return null;
        const d = await res.json();
        return {
          name: c.name,
          link: c.link,
          temp: Math.round(d.main.temp),
          icon: d.weather?.[0]?.icon ?? '01d',
          description: d.weather?.[0]?.description ?? '',
          tz: Number(d.timezone ?? 0),
        };
      } catch {
        return null;
      }
    })
  );
  return results.filter((r): r is WorldCity => r !== null);
}

/* ---------- Style ---------- */
const HOME_CSS = `
@keyframes tici-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes tici-ping { 0% { transform: scale(1); opacity: .7 } 80%,100% { transform: scale(2.6); opacity: 0 } }
@keyframes tici-pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
.tici-marquee { display: flex; width: max-content; animation: tici-marquee 45s linear infinite }
.tici-marquee:hover { animation-play-state: paused }
.tici-ping { transform-origin: center; transform-box: fill-box; animation: tici-ping 2.4s ease-out infinite }
.tici-pulse { animation: tici-pulse 1.4s ease-in-out infinite }
.tici-noise {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>");
}
@media (prefers-reduced-motion: reduce) {
  .tici-marquee, .tici-ping, .tici-pulse { animation: none !important }
}
`;

const tile =
  'relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111113] p-6 sm:p-8';
const tileLink = `${tile} group block transition duration-300 hover:border-[#c8ff3d]/60 hover:bg-[#151517]`;

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 transition group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* Projection simple lat/lon -> SVG (cadre du Québec) */
const MAP_W = 300;
const MAP_H = 330;
const px = (lon: number) => ((lon + 80) / 24) * MAP_W;
const py = (lat: number) => ((62.5 - lat) / 18.5) * MAP_H;

export default async function HomePage() {
  const apiKey =
    process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  const [cities, nhl, photos, news, quakes, worldCities] = await Promise.all([
    getCitiesNow(apiKey),
    getNhlSummary(),
    getHeroPhotos(),
    getWorldNews(),
    getQuakes(),
    getWorldCities(apiKey),
  ]);

  const featured = cities.find((c) => c.name === 'Montréal') ?? null;
  const others = cities.filter((c) => c !== featured);

  const now = new Date();
  const dateLong = new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Toronto',
  }).format(now);
  const dateLabel = dateLong.charAt(0).toUpperCase() + dateLong.slice(1);

  const fmtTemp = (n: number) => `${n}°`;

  return (
    <main className="relative min-h-screen bg-[#09090b] text-zinc-100">
      <style>{HOME_CSS}</style>

      {/* Grain */}
      <div
        aria-hidden="true"
        className="tici-noise pointer-events-none fixed inset-0 z-0 opacity-[0.06] mix-blend-overlay"
      />

      {/* Bandeau défilant */}
      {cities.length > 0 && (
        <div
          className="relative z-10 overflow-hidden border-b border-white/10 bg-black/60 py-2.5 text-xs text-zinc-300"
          aria-label="Températures actuelles au Québec"
        >
          <div className="tici-marquee">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={dup === 1}>
                {cities.map((c) => (
                  <a
                    key={`${dup}-${c.name}`}
                    href={`/meteo/${encodeURIComponent(c.name)}`}
                    className="whitespace-nowrap hover:text-white"
                  >
                    <span className="text-zinc-500">{c.name}</span>{' '}
                    <span className="font-semibold tabular-nums" style={{ color: ACCENT }}>
                      {fmtTemp(c.temp)}
                    </span>
                  </a>
                ))}
                {nhl && nhl.live > 0 && (
                  <a href="/nhl" className="whitespace-nowrap hover:text-white">
                    <span className="tici-pulse mr-2 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />
                    <span className="font-semibold">{nhl.live} match{nhl.live > 1 ? 's' : ''} LNH en direct</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
        {/* En-tête */}
        <header className="flex items-center justify-between gap-4 pb-6">
          <a href="/" aria-label="ToutIci, accueil">
            <ToutIciLogo />
          </a>
          <nav aria-label="Navigation principale" className="flex items-center gap-1 text-sm font-medium">
            <a href="/quebec" className="rounded-full px-4 py-2 text-zinc-300 transition hover:bg-white/10 hover:text-white">
              Québec
            </a>
            <a
              href="/nhl"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              LNH
              {nhl && nhl.live > 0 && <span className="tici-pulse h-2 w-2 rounded-full bg-red-500" />}
            </a>
          </nav>
        </header>

        {/* Bandeau titre + recherche, avec les photos */}
        <section className={`${tile} mb-4`} aria-label="Recherche">
          <HeroPhotos photos={photos} />
          {photos.length === 0 && (
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 70%)` }}
            />
          )}
          <div className="relative z-10 grid items-end gap-8 pt-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <span className="inline-block rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur">
                {dateLabel}
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Météo. Hockey.
                <br />
                <span style={{ color: ACCENT }}>Maintenant.</span>
              </h1>
              <p className="mt-4 max-w-md text-base text-zinc-300 sm:text-lg">
                <span className="font-semibold text-white">Tout ici, tout de suite.</span>{' '}
                Du Québec au Canada, jusqu’au reste du monde.
              </p>
            </div>
            <HomeSearch />
          </div>
        </section>

        {/* Grille bento */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Le monde en direct */}
          <WorldLive
            news={news}
            quakes={quakes}
            cities={worldCities}
            className="lg:col-span-8 lg:row-span-2"
          />

          {/* Montréal en grand */}
          {featured ? (
            <a
              href={`/meteo/${encodeURIComponent(featured.name)}`}
              className={`${tileLink} lg:col-span-4`}
              style={{ background: 'linear-gradient(160deg, #1b1d22 0%, #111113 60%)' }}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-zinc-400">{featured.name}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://openweathermap.org/img/wn/${featured.icon}@2x.png`}
                  alt=""
                  width={72}
                  height={72}
                  className="-mr-2 -mt-3 h-[72px] w-[72px]"
                />
              </div>
              <div className="mt-2 text-8xl font-semibold leading-none tracking-[-0.06em] tabular-nums">
                {fmtTemp(featured.temp)}
              </div>
              <p className="mt-3 text-sm capitalize text-zinc-400">
                {featured.description} · ressenti {fmtTemp(featured.feels)}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: ACCENT }}>
                Prévisions détaillées <Arrow />
              </span>
            </a>
          ) : (
            <div className={`${tile} flex items-center lg:col-span-4`}>
              <p className="text-zinc-400">Cherche une ville pour voir sa météo.</p>
            </div>
          )}

          {/* LNH */}
          <a href="/nhl" className={`${tileLink} lg:col-span-4`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-400">LNH</span>
              {nhl && nhl.live > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300">
                  <span className="tici-pulse h-1.5 w-1.5 rounded-full bg-red-500" />
                  {nhl.live} en direct
                </span>
              ) : nhl && nhl.total > 0 ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
                  {nhl.total} match{nhl.total > 1 ? 's' : ''} aujourd’hui
                </span>
              ) : null}
            </div>

            {nhl && nhl.rows.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {nhl.rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 text-sm tabular-nums">
                    <span className="font-semibold">
                      {r.away}
                      <span className={r.live ? 'mx-2 text-white' : 'mx-2 text-zinc-300'}>
                        {r.awayScore !== null && r.homeScore !== null
                          ? `${r.awayScore} – ${r.homeScore}`
                          : 'vs'}
                      </span>
                      {r.home}
                    </span>
                    <span className={r.live ? 'font-semibold text-red-300' : 'text-zinc-500'}>
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">Aucun match aujourd’hui.</p>
            )}

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: ACCENT }}>
              Résultats et classement <Arrow />
            </span>
          </a>

          {/* Carte du Québec */}
          <a href="/quebec" className={`${tileLink} lg:col-span-7`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-400">Carte météo</span>
                <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Tout le Québec
                  <br />
                  en un coup d’œil.
                </h2>
                <p className="mt-3 max-w-sm text-sm text-zinc-400">
                  Températures min et max de Montréal jusqu’au Nunavik, pour aujourd’hui et les
                  4 prochains jours.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: ACCENT }}>
                  Ouvrir la carte <Arrow />
                </span>
              </div>

              <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="mx-auto h-56 w-auto shrink-0 sm:h-64"
                role="img"
                aria-label="Carte stylisée du Québec avec les températures de Montréal, Québec et Saguenay"
              >
                {MAP_EXTRA_DOTS.map(([lat, lon]) => (
                  <circle key={`${lat}-${lon}`} cx={px(lon)} cy={py(lat)} r="3" fill="#3f3f46" />
                ))}
                {HOME_CITIES.map((c) => (
                  <circle key={c.name} cx={px(c.lon)} cy={py(c.lat)} r="4" fill="#71717a" />
                ))}
                {cities
                  .filter((c) => ['Montréal', 'Québec', 'Saguenay'].includes(c.name))
                  .map((c) => {
                    const x = px(c.lon);
                    const y = py(c.lat);
                    const left = c.name === 'Montréal';
                    return (
                      <g key={c.name}>
                        <circle cx={x} cy={y} r="5" fill={ACCENT} className="tici-ping" />
                        <circle cx={x} cy={y} r="5" fill={ACCENT} />
                        <text
                          x={left ? x - 11 : x + 11}
                          y={y + 4}
                          textAnchor={left ? 'end' : 'start'}
                          fontSize="13"
                          fontWeight="600"
                          fill="#fafafa"
                        >
                          {c.name} {fmtTemp(c.temp)}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            </div>
          </a>

          {/* Autres villes du Québec */}
          {others.length > 0 && (
            <section className={`${tile} lg:col-span-5`} aria-label="Autres villes du Québec">
              <span className="text-sm font-medium text-zinc-400">Ailleurs au Québec</span>
              <ul className="mt-3 divide-y divide-white/10">
                {others.map((c) => (
                  <li key={c.name}>
                    <a
                      href={`/meteo/${encodeURIComponent(c.name)}`}
                      className="group flex items-center gap-3 py-2.5 transition hover:text-[#c8ff3d]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://openweathermap.org/img/wn/${c.icon}.png`}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-medium">{c.name}</span>
                        <span className="block truncate text-xs capitalize text-zinc-500">{c.description}</span>
                      </span>
                      <span className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                        {fmtTemp(c.temp)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Pied de page */}
        <div className="mt-12 text-center text-zinc-500">
          <VisitorCounter />
        </div>

        <footer className="mt-6 border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-zinc-500">
          <nav
            aria-label="Liens du pied de page"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-zinc-400"
          >
            <a href="/" className="hover:text-white">Accueil</a>
            <a href="/quebec" className="hover:text-white">Météo Québec</a>
            <a href="/nhl" className="hover:text-white">LNH</a>
            <a href="/conditions" className="hover:text-white">Conditions d’utilisation</a>
            <a href="/confidentialite" className="hover:text-white">Politique de confidentialité</a>
          </nav>

          <p className="mt-5">
            Données météo :{' '}
            <a href="https://openweathermap.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
              OpenWeather
            </a>
            {' · '}Hockey : LNH (site non affilié à la LNH)
            {' · '}Actualités :{' '}
            <a href="https://fr.wikipedia.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
              Wikipédia
            </a>
            {' · '}Séismes :{' '}
            <a href="https://earthquake.usgs.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
              USGS
            </a>
            {photos.length > 0 && (
              <>
                {' · '}Photos :{' '}
                <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                  Wikimedia Commons
                </a>
              </>
            )}
          </p>
          <p className="mt-3">© {now.getFullYear()} Eddy Huart. Tous droits réservés.</p>
          <p className="mt-1">ToutIci est la propriété d’Eddy Huart.</p>
        </footer>
      </div>
    </main>
  );
}
