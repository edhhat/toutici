// app/api/nhl/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BASE = 'https://api-web.nhle.com/v1';

/* eslint-disable @typescript-eslint/no-explicit-any */
function slimTeam(t: any) {
  return {
    abbrev: t?.abbrev ?? '',
    name: t?.name?.default ?? t?.commonName?.default ?? t?.abbrev ?? '',
    logo: t?.logo ?? '',
    score: typeof t?.score === 'number' ? t.score : null,
    sog: typeof t?.sog === 'number' ? t.sog : null,
  };
}

function slimGame(g: any) {
  return {
    id: g.id,
    state: g.gameState as string,
    startTimeUTC: g.startTimeUTC as string,
    period: g.periodDescriptor?.number ?? g.period ?? null,
    periodType: (g.periodDescriptor?.periodType as string) ?? 'REG',
    timeRemaining: g.clock?.timeRemaining ?? null,
    inIntermission: Boolean(g.clock?.inIntermission),
    lastPeriodType: (g.gameOutcome?.lastPeriodType as string) ?? null,
    away: slimTeam(g.awayTeam),
    home: slimTeam(g.homeTeam),
  };
}

function slimStanding(s: any) {
  return {
    abbrev: s.teamAbbrev?.default ?? '',
    name: s.teamName?.default ?? s.teamCommonName?.default ?? '',
    logo: s.teamLogo ?? '',
    conference: s.conferenceName as string,
    division: s.divisionName as string,
    gp: s.gamesPlayed,
    w: s.wins,
    l: s.losses,
    otl: s.otLosses,
    pts: s.points,
    diff: s.goalDifferential,
    streak: s.streakCode ? `${s.streakCode}${s.streakCount}` : '',
    l10: `${s.l10Wins}-${s.l10Losses}-${s.l10OtLosses}`,
    divSeq: s.divisionSequence,
    confSeq: s.conferenceSequence,
    leagueSeq: s.leagueSequence,
    wcSeq: s.wildcardSequence,
  };
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  const scoreUrl =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${BASE}/score/${date}` : `${BASE}/score/now`;

  try {
    const [sRes, stRes] = await Promise.all([
      fetch(scoreUrl, { cache: 'no-store' }),
      fetch(`${BASE}/standings/now`, { cache: 'no-store' }),
    ]);

    if (!sRes.ok || !stRes.ok) {
      return NextResponse.json({ error: 'Données NHL indisponibles.' }, { status: 502 });
    }

    const [scores, standings] = await Promise.all([sRes.json(), stRes.json()]);

    // Derniers matchs joués : les 3 jours précédents (seulement pour la vue « aujourd'hui »)
    let recent: { date: string; games: ReturnType<typeof slimGame>[] }[] = [];
    const baseDate: string | null = scores.currentDate ?? null;

    if (!date && baseDate) {
      const dates = [1, 2, 3].map((n) => {
        const d = new Date(`${baseDate}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() - n);
        return d.toISOString().slice(0, 10);
      });

      const settled = await Promise.allSettled(
        dates.map(async (d) => {
          const res = await fetch(`${BASE}/score/${d}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('score');
          const json: any = await res.json();
          return { date: d, games: (json.games ?? []).map(slimGame) };
        })
      );

      recent = settled
        .filter(
          (s): s is PromiseFulfilledResult<{ date: string; games: ReturnType<typeof slimGame>[] }> =>
            s.status === 'fulfilled'
        )
        .map((s) => s.value)
        .filter((d) => d.games.length > 0);
    }

    return NextResponse.json(
      {
        currentDate: scores.currentDate ?? date ?? null,
        prevDate: scores.prevDate ?? null,
        nextDate: scores.nextDate ?? null,
        games: (scores.games ?? []).map(slimGame),
        recent,
        standings: (standings.standings ?? []).map(slimStanding),
        fetchedAt: Date.now(),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' } }
    );
  } catch {
    return NextResponse.json({ error: 'Erreur de connexion.' }, { status: 500 });
  }
}
