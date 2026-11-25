// app/api/nhl/events/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BASE = 'https://api-web.nhle.com/v1';

const PENALTIES_FR: Record<string, string> = {
  tripping: 'Croc-en-jambe',
  slashing: 'Double échec',
  hooking: 'Accrocher',
  holding: 'Retenir',
  interference: 'Obstruction',
  'high-sticking': 'Bâton élevé',
  roughing: 'Rudesse',
  'cross-checking': 'Mise en échec avec bâton',
  boarding: 'Mise en échec contre la bande',
  charging: 'Charge',
  fighting: 'Bagarre',
  elbowing: 'Coup de coude',
  kneeing: 'Double-échec au genou',
  'delaying-game': 'Retard de jeu',
  'too-many-men-on-the-ice': 'Trop de joueurs sur la glace',
  'unsportsmanlike-conduct': 'Conduite antisportive',
  embellishment: 'Simulation',
  'goalie-leave-crease': 'Gardien hors de son demi-cercle',
  'holding-the-stick': 'Retenir le bâton',
  'interference-goalkeeper': 'Obstruction envers le gardien',
  misconduct: 'Inconduite',
  'game-misconduct': 'Inconduite de partie',
};

function penaltyFr(rawKey: string): string {
  // Ex. « high-sticking-double-minor » -> « Bâton élevé (double mineure) »
  let key = rawKey;
  let suffix = '';
  if (key.endsWith('-double-minor')) {
    key = key.replace(/-double-minor$/, '');
    suffix = ' (double mineure)';
  } else if (key.endsWith('-major')) {
    key = key.replace(/-major$/, '');
    suffix = ' (majeure)';
  }
  if (PENALTIES_FR[key]) return PENALTIES_FR[key] + suffix;
  const s = key.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + suffix;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Identifiant de match invalide.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/gamecenter/${id}/play-by-play`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Événements indisponibles.' }, { status: 502 });
    }
    const json: any = await res.json();

    // playerId -> "A. Nom"
    const names = new Map<number, string>();
    for (const p of json.rosterSpots ?? []) {
      const first: string = p.firstName?.default ?? '';
      const last: string = p.lastName?.default ?? '';
      names.set(p.playerId, first ? `${first[0]}. ${last}` : last);
    }

    const teamOf = (teamId: number): string =>
      teamId === json.homeTeam?.id
        ? (json.homeTeam?.abbrev ?? '')
        : teamId === json.awayTeam?.id
          ? (json.awayTeam?.abbrev ?? '')
          : '';

    const events: {
      id: number;
      type: 'goal' | 'penalty';
      period: number | null;
      periodType: string;
      time: string;
      team: string;
      text: string;
      score?: string;
    }[] = [];

    for (const play of json.plays ?? []) {
      const d = play.details ?? {};
      const base = {
        id: play.eventId as number,
        period: (play.periodDescriptor?.number as number) ?? null,
        periodType: (play.periodDescriptor?.periodType as string) ?? 'REG',
        time: (play.timeInPeriod as string) ?? '',
        team: teamOf(d.eventOwnerTeamId),
      };

      if (play.typeDescKey === 'goal') {
        const scorer = names.get(d.scoringPlayerId) ?? 'Buteur inconnu';
        const assists = [d.assist1PlayerId, d.assist2PlayerId]
          .filter((x) => x != null)
          .map((x) => names.get(x as number))
          .filter(Boolean);
        events.push({
          ...base,
          type: 'goal',
          text: assists.length ? `${scorer} (${assists.join(', ')})` : `${scorer} (sans aide)`,
          score:
            typeof d.awayScore === 'number' && typeof d.homeScore === 'number'
              ? `${d.awayScore}–${d.homeScore}`
              : undefined,
        });
      } else if (play.typeDescKey === 'penalty') {
        const who =
          names.get(d.committedByPlayerId) ??
          names.get(d.servedByPlayerId) ??
          'Banc des joueurs';
        const dur = d.duration ? ` (${d.duration} min)` : '';
        events.push({
          ...base,
          type: 'penalty',
          text: `${who} : ${penaltyFr(String(d.descKey ?? 'pénalité'))}${dur}`,
        });
      }
    }

    // Les plus récents en premier
    events.reverse();

    return NextResponse.json(
      { events },
      { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' } }
    );
  } catch {
    return NextResponse.json({ error: 'Erreur de connexion.' }, { status: 500 });
  }
}
