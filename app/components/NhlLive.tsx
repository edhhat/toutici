'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/* ---------- Types ---------- */
interface Team {
  abbrev: string;
  name: string;
  logo: string;
  score: number | null;
  sog: number | null;
}

interface Game {
  id: number;
  state: string;
  startTimeUTC: string;
  period: number | null;
  periodType: string;
  timeRemaining: string | null;
  inIntermission: boolean;
  lastPeriodType: string | null;
  away: Team;
  home: Team;
}

interface Standing {
  abbrev: string;
  name: string;
  logo: string;
  conference: string;
  division: string;
  gp: number;
  w: number;
  l: number;
  otl: number;
  pts: number;
  diff: number;
  streak: string;
  l10: string;
  divSeq: number;
  confSeq: number;
  leagueSeq: number;
  wcSeq: number;
}

interface NhlData {
  currentDate: string | null;
  prevDate: string | null;
  nextDate: string | null;
  games: Game[];
  recent: { date: string; games: Game[] }[];
  standings: Standing[];
  fetchedAt: number;
}

type Tab = 'resultats' | 'classement';
type View = 'division' | 'conference' | 'ligue';

const POLL_MS = 20_000;

const DIVISIONS_FR: Record<string, string> = {
  Atlantic: 'Atlantique',
  Metropolitan: 'Métropolitaine',
  Central: 'Centrale',
  Pacific: 'Pacifique',
};

const CONFERENCES_FR: Record<string, string> = {
  Eastern: 'Association de l’Est',
  Western: 'Association de l’Ouest',
};

/* ---------- Utilitaires ---------- */
const isLive = (s: string) => s === 'LIVE' || s === 'CRIT';
const isFinal = (s: string) => s === 'FINAL' || s === 'OFF';
const isFuture = (s: string) => s === 'FUT' || s === 'PRE';

function periodLabel(n: number | null, type: string): string {
  if (type === 'OT') return 'Prol.';
  if (type === 'SO') return 'TB';
  if (n === 1) return '1re';
  return n ? `${n}e` : '';
}

function statusText(g: Game): string {
  if (isFuture(g.state)) {
    return new Intl.DateTimeFormat('fr-CA', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    }).format(new Date(g.startTimeUTC));
  }
  if (isLive(g.state)) {
    const p = periodLabel(g.period, g.periodType);
    if (g.inIntermission) return `Entracte · ${p}`;
    return `${p} · ${g.timeRemaining ?? ''}`.trim();
  }
  if (isFinal(g.state)) {
    if (g.lastPeriodType === 'OT') return 'Final / Prol.';
    if (g.lastPeriodType === 'SO') return 'Final / TB';
    return 'Final';
  }
  if (g.state === 'PPD') return 'Reporté';
  return g.state;
}

function formatLongDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  const s = new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function qualifies(s: Standing): boolean {
  // Top 3 de la division, ou l'une des 2 places de meilleur deuxième
  return s.divSeq <= 3 || s.wcSeq === 1 || s.wcSeq === 2;
}

/* ---------- Sous-composants ---------- */
function Logo({ src, alt, size = 28 }: { src: string; alt: string; size?: number }) {
  if (!src) return <span style={{ width: size, height: size }} className="inline-block" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={size} height={size} loading="lazy" />;
}

interface GameEvent {
  id: number;
  type: 'goal' | 'penalty';
  period: number | null;
  periodType: string;
  time: string;
  team: string;
  text: string;
  score?: string;
}

function GameEvents({ id, live }: { id: number; live: boolean }) {
  const [events, setEvents] = useState<GameEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stop = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/nhl/events?id=${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error('events');
        if (!stop) {
          setEvents(json.events as GameEvent[]);
          setFailed(false);
        }
      } catch {
        if (!stop) setFailed(true);
      }
    };

    load();
    if (!live) return () => { stop = true; };

    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id, live]);

  if (failed && !events) {
    return <p className="mt-3 text-xs text-white/60">Événements indisponibles.</p>;
  }
  if (!events) return <p className="mt-3 text-xs text-white/60">Chargement des événements…</p>;
  if (events.length === 0) {
    return <p className="mt-3 text-xs text-white/60">Aucun but ni pénalité pour l’instant.</p>;
  }

  return (
    <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto border-t border-white/15 pt-3 pr-1 text-xs">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-2">
          <span
            className={`mt-0.5 w-[68px] shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-bold ${
              e.type === 'goal' ? 'bg-amber-300 text-slate-900' : 'bg-white/20 text-white'
            }`}
          >
            {e.type === 'goal' ? 'BUT' : 'PÉNALITÉ'}
          </span>
          <span className="shrink-0 tabular-nums text-white/60">
            {periodLabel(e.period, e.periodType)} {e.time}
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{e.team}</span> · {e.text}
            {e.score && <span className="ml-1 font-bold text-amber-200">{e.score}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function GameCard({ g }: { g: Game }) {
  const live = isLive(g.state);
  const fin = isFinal(g.state);
  const future = isFuture(g.state);
  const [open, setOpen] = useState(false);

  const awayWins = fin && (g.away.score ?? 0) > (g.home.score ?? 0);
  const homeWins = fin && (g.home.score ?? 0) > (g.away.score ?? 0);

  const Row = ({ t, bold }: { t: Team; bold: boolean }) => (
    <div className="flex items-center gap-3">
      <Logo src={t.logo} alt={t.name} size={32} />
      <span className={`flex-1 truncate ${bold ? 'font-bold' : 'text-white/85'}`}>{t.name}</span>
      {!future && (
        <span className={`text-xl tabular-nums ${bold ? 'font-bold' : ''}`}>{t.score ?? 0}</span>
      )}
    </div>
  );

  return (
    <div
      className={`rounded-2xl p-4 backdrop-blur border ${
        live ? 'bg-red-500/15 border-red-300/50' : 'bg-white/10 border-white/15'
      }`}
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <span
          className={`inline-flex items-center gap-1.5 font-semibold ${
            live ? 'text-red-200' : 'text-white/70'
          }`}
        >
          {live && <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />}
          {statusText(g)}
        </span>
        {!future && g.away.sog !== null && g.home.sog !== null && (
          <span className="text-white/60">
            Tirs : {g.away.sog} – {g.home.sog}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <Row t={g.away} bold={awayWins || (live && (g.away.score ?? 0) > (g.home.score ?? 0))} />
        <Row t={g.home} bold={homeWins || (live && (g.home.score ?? 0) > (g.away.score ?? 0))} />
      </div>

      {/* Événements : toujours visibles en direct, à la demande pour les matchs terminés */}
      {live && <GameEvents id={g.id} live />}
      {fin && (
        <>
          <button
            className="mt-3 text-xs font-semibold text-white/80 underline"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Masquer les événements' : 'Voir les événements'}
          </button>
          {open && <GameEvents id={g.id} live={false} />}
        </>
      )}
    </div>
  );
}

function StandingsTable({
  title,
  rows,
  showQualifyLine,
}: {
  title: string;
  rows: Standing[];
  showQualifyLine?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-white/60">
              <th className="w-8 py-1 pr-2">#</th>
              <th className="py-1 pr-2">Équipe</th>
              <th className="px-2 py-1 text-right">PJ</th>
              <th className="px-2 py-1 text-right">V</th>
              <th className="px-2 py-1 text-right">D</th>
              <th className="px-2 py-1 text-right">DP</th>
              <th className="px-2 py-1 text-right font-bold text-white">PTS</th>
              <th className="px-2 py-1 text-right">+/-</th>
              <th className="px-2 py-1 text-right">10 der.</th>
              <th className="px-2 py-1 text-right">Série</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const q = qualifies(s);
              return (
                <tr
                  key={s.abbrev}
                  className={`border-t border-white/10 ${
                    showQualifyLine && !q ? 'text-white/60' : ''
                  } ${
                    showQualifyLine && rows[i - 1] && qualifies(rows[i - 1]) && !q
                      ? 'border-t-2 border-t-amber-300/70'
                      : ''
                  }`}
                >
                  <td className="py-1.5 pr-2 tabular-nums text-white/60">{i + 1}</td>
                  <td className="py-1.5 pr-2">
                    <span className="flex items-center gap-2">
                      <Logo src={s.logo} alt={s.name} size={24} />
                      <span className="whitespace-nowrap font-medium">{s.name}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{s.gp}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{s.w}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{s.l}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{s.otl}</td>
                  <td className="px-2 py-1.5 text-right font-bold tabular-nums">{s.pts}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {s.diff > 0 ? `+${s.diff}` : s.diff}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{s.l10}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{s.streak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Composant principal ---------- */
export default function NhlLive() {
  const [tab, setTab] = useState<Tab>('resultats');
  const [view, setView] = useState<View>('division');
  const [date, setDate] = useState<string | null>(null); // null = aujourd'hui
  const [data, setData] = useState<NhlData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/nhl${date ? `?date=${date}` : ''}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Erreur');
      setData(json as NhlData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion.');
    }
  }, [date]);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const games = useMemo(() => {
    if (!data) return [];
    const rank = (g: Game) => (isLive(g.state) ? 0 : isFuture(g.state) ? 1 : 2);
    return [...data.games].sort(
      (a, b) => rank(a) - rank(b) || a.startTimeUTC.localeCompare(b.startTimeUTC)
    );
  }, [data]);

  const liveCount = games.filter((g) => isLive(g.state)).length;

  const byConf = (conf: string, key: 'confSeq') =>
    (data?.standings ?? [])
      .filter((s) => s.conference === conf)
      .sort((a, b) => a[key] - b[key]);

  const byDiv = (div: string) =>
    (data?.standings ?? []).filter((s) => s.division === div).sort((a, b) => a.divSeq - b.divSeq);

  const league = [...(data?.standings ?? [])].sort((a, b) => a.leagueSeq - b.leagueSeq);

  const pill = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-white text-slate-900 shadow' : 'bg-white/10 text-white hover:bg-white/20'
    }`;

  return (
    <div className="w-full">
      {/* Onglets */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
        <button className={pill(tab === 'resultats')} onClick={() => setTab('resultats')}>
          Résultats{liveCount > 0 ? ` · ${liveCount} en direct` : ''}
        </button>
        <button className={pill(tab === 'classement')} onClick={() => setTab('classement')}>
          Classement
        </button>
        {data && (
          <span className="w-full text-center text-xs text-white/70">
            Mis à jour à{' '}
            {new Date(data.fetchedAt).toLocaleTimeString('fr-CA', { timeStyle: 'medium' })}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-300/40 bg-red-500/15 p-3 text-sm">
          {error} Nouvelle tentative automatique…
        </div>
      )}

      {!data && !error && <p className="py-10 text-center text-white/80">Chargement…</p>}

      {/* Résultats */}
      {data && tab === 'resultats' && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              className={pill(false)}
              disabled={!data.prevDate}
              onClick={() => data.prevDate && setDate(data.prevDate)}
              aria-label="Jour précédent"
            >
              ←
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">{formatLongDate(data.currentDate)}</div>
              {date && (
                <button className="text-xs underline text-white/80" onClick={() => setDate(null)}>
                  Revenir à aujourd’hui
                </button>
              )}
            </div>
            <button
              className={pill(false)}
              disabled={!data.nextDate}
              onClick={() => data.nextDate && setDate(data.nextDate)}
              aria-label="Jour suivant"
            >
              →
            </button>
          </div>

          {games.length === 0 ? (
            <p className="py-10 text-center text-white/80">Aucun match ce jour-là.</p>
          ) : (
            <div className="grid justify-center gap-3 grid-cols-[repeat(auto-fit,minmax(280px,380px))]">
              {games.map((g) => (
                <GameCard key={g.id} g={g} />
              ))}
            </div>
          )}

          {/* Derniers matchs joués (jours précédents) */}
          {!date && data.recent && data.recent.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-center text-xl font-bold">Derniers matchs joués</h2>
              <div className="space-y-6">
                {data.recent.map((day) => (
                  <div key={day.date}>
                    <h3 className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-white/70">
                      {formatLongDate(day.date)}
                    </h3>
                    <div className="grid justify-center gap-3 grid-cols-[repeat(auto-fit,minmax(280px,380px))]">
                      {[...day.games]
                        .sort((a, b) => a.startTimeUTC.localeCompare(b.startTimeUTC))
                        .map((g) => (
                          <GameCard key={g.id} g={g} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Classement */}
      {data && tab === 'classement' && (
        <div>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            <button className={pill(view === 'division')} onClick={() => setView('division')}>
              Division
            </button>
            <button className={pill(view === 'conference')} onClick={() => setView('conference')}>
              Association
            </button>
            <button className={pill(view === 'ligue')} onClick={() => setView('ligue')}>
              Ligue
            </button>
          </div>

          {view === 'division' && (
            <div className="space-y-6">
              {(['Eastern', 'Western'] as const).map((conf) => (
                <div key={conf}>
                  <h2 className="mb-3 text-center text-xl font-bold">{CONFERENCES_FR[conf]}</h2>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {(conf === 'Eastern' ? ['Atlantic', 'Metropolitan'] : ['Central', 'Pacific']).map(
                      (div) => (
                        <StandingsTable key={div} title={DIVISIONS_FR[div]} rows={byDiv(div)} />
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'conference' && (
            <div className="grid gap-4 lg:grid-cols-2">
              {(['Eastern', 'Western'] as const).map((conf) => (
                <StandingsTable
                  key={conf}
                  title={CONFERENCES_FR[conf]}
                  rows={byConf(conf, 'confSeq')}
                  showQualifyLine
                />
              ))}
            </div>
          )}

          {view === 'ligue' && <StandingsTable title="Toute la LNH" rows={league} />}

          <p className="mt-3 text-xs text-white/70">
            PJ : parties jouées · V : victoires · D : défaites · DP : défaites en prolongation ou
            en tirs de barrage · Dans la vue Association, la ligne jaune sépare les équipes
            qualifiées (3 premières de chaque division + 2 meilleures deuxièmes) des autres.
          </p>
        </div>
      )}
    </div>
  );
}
