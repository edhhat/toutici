'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface NewsItem {
  text: string;
  url: string;
}

export interface Quake {
  id: string;
  mag: number;
  place: string;
  time: number;
  lat: number;
  lon: number;
  url: string;
}

export interface WorldCity {
  name: string;
  link: string;
  temp: number;
  icon: string;
  description: string;
  /** Décalage horaire en secondes par rapport à UTC */
  tz: number;
}

type Tab = 'news' | 'quakes' | 'weather';

const ACCENT = '#c8ff3d';
const REFRESH_MS = 120_000;

const magColor = (m: number) => (m >= 6 ? '#ff5a4d' : m >= 5 ? '#ffb400' : ACCENT);
const fmtMag = (m: number) => m.toFixed(1).replace('.', ',');

function ago(ms: number, now: number): string {
  const mins = Math.max(0, Math.round((now - ms) / 60_000));
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.round(mins / 60);
  return `il y a ${h} h`;
}

function localTime(now: number, tz: number): string {
  const d = new Date(now + tz * 1000);
  return `${String(d.getUTCHours()).padStart(2, '0')} h ${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export default function WorldLive({
  news,
  quakes,
  cities,
  className = '',
}: {
  news: NewsItem[];
  quakes: Quake[];
  cities: WorldCity[];
  className?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('news');
  const [now, setNow] = useState(() => Date.now());

  /* Horloge (heures locales, « il y a… ») */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  /* Rafraîchit les données toutes les 2 minutes */
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [router]);

  const tabBtn = (id: Tab, label: string, count?: number) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        tab === id ? 'bg-[#c8ff3d] text-black' : 'bg-white/10 text-zinc-200 hover:bg-white/20'
      }`}
    >
      {label}
      {typeof count === 'number' && count > 0 && (
        <span className={`ml-2 text-xs ${tab === id ? 'text-black/60' : 'text-zinc-400'}`}>{count}</span>
      )}
    </button>
  );

  const recentQuakes = [...quakes].sort((a, b) => b.time - a.time);

  return (
    <section
      aria-label="Le monde en direct"
      className={`relative flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#111113] p-6 sm:p-8 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          Le monde en direct
        </h2>
        <div className="flex flex-wrap gap-2">
          {tabBtn('news', 'À la une', news.length)}
          {tabBtn('quakes', 'Séismes', quakes.length)}
          {tabBtn('weather', 'Météo mondiale')}
        </div>
      </div>

      <div className="mt-6 flex-1">
        {/* ---- Actualités ---- */}
        {tab === 'news' &&
          (news.length === 0 ? (
            <p className="text-zinc-400">Actualités indisponibles pour le moment.</p>
          ) : (
            <>
              <ol className="divide-y divide-white/10">
                {news.map((n, i) => (
                  <li key={n.text} className="py-3 first:pt-0">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-4"
                    >
                      <span className="mt-0.5 w-6 shrink-0 text-sm font-semibold tabular-nums text-zinc-500">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-base leading-snug text-zinc-100 group-hover:text-[#c8ff3d]">
                        {n.text}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-zinc-500">
                Source :{' '}
                <a
                  href="https://fr.wikipedia.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-300"
                >
                  Wikipédia
                </a>{' '}
                (rubrique « À la une »), texte sous licence{' '}
                <a
                  href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-300"
                >
                  CC BY-SA 4.0
                </a>
                . Chaque ligne mène à l’article.
              </p>
            </>
          ))}

        {/* ---- Séismes ---- */}
        {tab === 'quakes' &&
          (quakes.length === 0 ? (
            <p className="text-zinc-400">Séismes indisponibles pour le moment.</p>
          ) : (
            <>
              <svg
                viewBox="0 0 360 180"
                className="w-full rounded-2xl bg-black/30"
                role="img"
                aria-label={`Carte du monde avec ${quakes.length} séismes de magnitude 4,5 ou plus`}
              >
                {/* Quadrillage */}
                {[-60, -30, 0, 30, 60].map((lat) => (
                  <line key={`lat${lat}`} x1="0" x2="360" y1={90 - lat} y2={90 - lat} stroke="#ffffff" strokeOpacity={lat === 0 ? 0.14 : 0.06} />
                ))}
                {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => (
                  <line key={`lon${lon}`} y1="0" y2="180" x1={lon + 180} x2={lon + 180} stroke="#ffffff" strokeOpacity={lon === 0 ? 0.14 : 0.06} />
                ))}
                {recentQuakes.map((q) => (
                  <g key={q.id}>
                    <circle
                      cx={q.lon + 180}
                      cy={90 - q.lat}
                      r={1.5 + q.mag * 0.9}
                      fill={magColor(q.mag)}
                      fillOpacity="0.28"
                    />
                    <circle cx={q.lon + 180} cy={90 - q.lat} r="1.6" fill={magColor(q.mag)} />
                  </g>
                ))}
              </svg>

              <ul className="mt-4 max-h-60 space-y-1 overflow-y-auto pr-1">
                {recentQuakes.slice(0, 15).map((q) => (
                  <li key={q.id}>
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5"
                    >
                      <span
                        className="w-12 shrink-0 rounded-lg py-1 text-center text-sm font-bold tabular-nums text-black"
                        style={{ background: magColor(q.mag) }}
                      >
                        {fmtMag(q.mag)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{q.place}</span>
                      <span className="shrink-0 text-xs text-zinc-500">{ago(q.time, now)}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-zinc-500">
                Séismes de magnitude 4,5 et plus des dernières 24 h · Données :{' '}
                <a
                  href="https://earthquake.usgs.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-300"
                >
                  USGS
                </a>{' '}
                (domaine public)
              </p>
            </>
          ))}

        {/* ---- Météo mondiale ---- */}
        {tab === 'weather' &&
          (cities.length === 0 ? (
            <p className="text-zinc-400">Météo mondiale indisponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {cities.map((c) => (
                <a
                  key={c.name}
                  href={`/meteo/${encodeURIComponent(c.link)}`}
                  className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#c8ff3d]/60 hover:bg-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-300">{c.name}</div>
                      <div className="text-xs tabular-nums text-zinc-500">{localTime(now, c.tz)}</div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://openweathermap.org/img/wn/${c.icon}.png`}
                      alt=""
                      width={40}
                      height={40}
                      className="-mr-1 -mt-1 h-10 w-10"
                    />
                  </div>
                  <div className="mt-2 text-4xl font-semibold tracking-[-0.04em] tabular-nums">{c.temp}°</div>
                  <div className="mt-1 truncate text-xs capitalize text-zinc-500">{c.description}</div>
                </a>
              ))}
            </div>
          ))}
      </div>
    </section>
  );
}
