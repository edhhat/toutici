// app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city');
  const apiKey = process.env.WEATHER_API_KEY;

  if (!city) {
    return NextResponse.json({ error: 'Veuillez entrer une ville.' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API manquante.' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&lang=fr&appid=${apiKey}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Ville introuvable ou clé API pas encore active.' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erreur de connexion.' }, { status: 500 });
  }
}