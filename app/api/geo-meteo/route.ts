// app/api/geo-meteo/route.ts
// Reçoit lat/lon du navigateur et renvoie la météo (la clé API reste côté serveur).

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return Response.json({ error: 'Coordonnées invalides' }, { status: 400 });
  }

  const apiKey =
    process.env.OPENWEATHER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Clé API manquante' }, { status: 500 });
  }

  // Coordonnées arrondies (~1 km) : suffisant pour la météo, plus respectueux de la vie privée
  const la = lat.toFixed(2);
  const lo = lon.toFixed(2);

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${la}&lon=${lo}&appid=${apiKey}&units=metric&lang=fr`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    return Response.json({ error: 'Météo indisponible' }, { status: 502 });
  }

  const d = await res.json();

  return Response.json(
    {
      name: d.name || 'Votre position',
      country: d.sys?.country ?? '',
      temp: Math.round(d.main.temp),
      feelsLike: Math.round(d.main.feels_like),
      tempMin: Math.round(d.main.temp_min),
      tempMax: Math.round(d.main.temp_max),
      humidity: d.main.humidity,
      windKmh: Math.round((d.wind?.speed ?? 0) * 3.6),
      description: d.weather?.[0]?.description ?? '',
      icon: d.weather?.[0]?.icon ?? '01d',
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
