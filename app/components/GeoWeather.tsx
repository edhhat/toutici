'use client';

// app/components/GeoWeather.tsx
// Météo à la position de l'utilisateur (géolocalisation du navigateur, avec son accord).

import { useCallback, useEffect, useState } from 'react';

interface GeoData {
  name: string;
  country: string;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windKmh: number;
  description: string;
  icon: string;
  lat: number;
  lon: number;
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: GeoData };

export default function GeoWeather() {
  const [state, setState] = useState<State>({ status: 'idle' });

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({
        status: 'error',
        message: 'La géolocalisation n’est pas disponible sur cet appareil.',
      });
      return;
    }

    setState({ status: 'loading' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/geo-meteo?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (!res.ok) throw new Error('bad response');
          const json = await res.json();
          const data: GeoData = {
            ...json,
            // coordonnées arrondies (~1 km) pour la carte
            lat: Number(pos.coords.latitude.toFixed(2)),
            lon: Number(pos.coords.longitude.toFixed(2)),
          };
          setState({ status: 'ok', data });
        } catch {
          setState({
            status: 'error',
            message: 'Impossible de récupérer la météo pour le moment.',
          });
        }
      },
      (err) => {
        setState({
          status: 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Accès à la position refusé. Autorise-le dans ton navigateur pour voir la météo locale.'
              : 'Position introuvable. Réessaie dans un instant.',
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  // Si la permission est déjà accordée, on affiche directement la météo locale
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((r) => {
        if (r.state === 'granted') locate();
      })
      .catch(() => {});
  }, [locate]);

  const card =
    'rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-5';

  if (state.status === 'idle') {
    return (
      <div className={card}>
        <button
          type="button"
          onClick={locate}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white/15 border border-white/20 px-5 py-3 font-medium transition hover:bg-white/25"
        >
          <span aria-hidden="true">📍</span>
          Afficher la météo à ma position
        </button>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className={`${card} text-center text-white/75`} role="status">
        Recherche de ta position…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className={card}>
        <p className="text-sm text-red-200">{state.message}</p>
        <button
          type="button"
          onClick={locate}
          className="mt-3 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm transition hover:bg-white/25"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const d = state.data;

  // Extrait de carte OpenStreetMap centré sur la position
  const dLat = 0.03;
  const dLon = 0.05;
  const bbox = [d.lon - dLon, d.lat - dLat, d.lon + dLon, d.lat + dLat].join(',');
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${d.lat},${d.lon}`;
  const mapLink = `https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lon}#map=12/${d.lat}/${d.lon}`;

  return (
    <div className={card}>
      <div className="flex items-center gap-4">
        <img
          src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
          alt={d.description}
          className="w-16 h-16 shrink-0 drop-shadow-lg"
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="flex items-center gap-1 text-sm text-white/65">
            <span aria-hidden="true">📍</span>
            <span className="truncate">
              Ma position · {d.name}
              {d.country ? `, ${d.country}` : ''}
            </span>
          </p>
          <p className="mt-1 text-lg capitalize text-white/90">{d.description}</p>
        </div>
        <span className="text-5xl font-extralight tabular-nums">{d.temp}°</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <dt className="text-white/55">Ressenti</dt>
          <dd className="font-semibold tabular-nums">{d.feelsLike}°</dd>
        </div>
        <div>
          <dt className="text-white/55">Humidité</dt>
          <dd className="font-semibold tabular-nums">{d.humidity} %</dd>
        </div>
        <div>
          <dt className="text-white/55">Vent</dt>
          <dd className="font-semibold tabular-nums">{d.windKmh} km/h</dd>
        </div>
        <div>
          <dt className="text-white/55">Aujourd’hui</dt>
          <dd className="font-semibold tabular-nums">
            {d.tempMin}° / {d.tempMax}°
          </dd>
        </div>
      </dl>

      {/* Carte figée : l'iframe est plus grande que son cadre (rognée de 4rem sur les côtés et 3rem en haut/bas)
          pour masquer les boutons +/− et le bandeau de crédits intégrés ; le crédit OSM est affiché en dessous. */}
      <a
        href={mapLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ouvrir la carte complète dans un nouvel onglet"
        className="relative mt-4 block h-44 overflow-hidden rounded-2xl border border-white/15"
      >
        <iframe
          title="Carte de ma position"
          src={mapSrc}
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute -left-16 -top-12 block h-[calc(100%+6rem)] w-[calc(100%+8rem)] max-w-none border-0"
        />
      </a>

      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <button
          type="button"
          onClick={locate}
          className="underline hover:text-white"
        >
          Actualiser
        </button>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/45 hover:text-white hover:underline"
        >
          © Contributeurs OpenStreetMap
        </a>
        <a
          href={mapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          Agrandir la carte
        </a>
      </div>
    </div>
  );
}
