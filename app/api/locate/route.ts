// app/api/locate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get('lat'));
  const lon = Number(request.nextUrl.searchParams.get('lon'));
  const apiKey = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Position invalide.' }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API manquante.' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Ville introuvable.' }, { status: 502 });
    }
    const data = await res.json();
    if (!data?.name) {
      return NextResponse.json({ error: 'Ville introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ name: data.name as string });
  } catch {
    return NextResponse.json({ error: 'Erreur de connexion.' }, { status: 500 });
  }
}
