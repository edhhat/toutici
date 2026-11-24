// app/api/geo-meteo/route.ts
// Reçoit lat/lon du navigateur et renvoie la météo (la clé API reste côté serveur).

export const runtime = 'edge';

/* Nom de la ville via OpenStreetMap (Nominatim) : plus fiable que le nom de station météo
   (ex. « Laflèche » au lieu de « Longueuil »). Retourne null si indisponible. */
async function getPlaceName(lat: string, lon: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=fr`,
      {
        headers: { 'User-Agent': 'ToutIci/1.0 (meteo)' },
        signal: AbortSignal.timeout(3000),
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const a = json.address ?? {};
    return a.city || a.town || a.village || a.municipality || a.county || null;
  } catch {
    return null;
  }
}

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

  const [res, placeName] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${la}&lon=${lo}&appid=${apiKey}&units=metric&lang=fr`,
      { cache: 'no-store' }
    ),
    getPlaceName(la, lo),
  ]);
  if (!res.ok) {
    return Response.json({ error: 'Météo indisponible' }, { status: 502 });
  }

  const d = await res.json();

  return Response.json(
    {
      name: placeName || d.name || 'Votre position',
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
