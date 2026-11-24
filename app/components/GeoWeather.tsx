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
          const data: GeoData = await res.json();
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

      <button
        type="button"
        onClick={locate}
        className="mt-4 text-xs text-white/60 underline hover:text-white"
      >
        Actualiser
      </button>
    </div>
  );
}
