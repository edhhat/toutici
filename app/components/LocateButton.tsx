'use client';

// app/components/LocateButton.tsx
// Icône 📍 : géolocalise l'utilisateur puis ouvre la page météo de sa ville
// (toute la page se met à jour).

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function LocateButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const busy = locating || isPending;

  function locate() {
    if (busy) return;
    setError('');

    if (!('geolocation' in navigator)) {
      setError('La géolocalisation n’est pas disponible sur cet appareil.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/geo-meteo?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (!res.ok) throw new Error('bad response');
          const d: { name: string; country?: string } = await res.json();
          const query = d.country ? `${d.name},${d.country}` : d.name;
          startTransition(() => {
            router.push(`/meteo/${encodeURIComponent(query)}`);
          });
        } catch {
          setError('Impossible de trouver la météo de ta position.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Accès à la position refusé. Autorise-le dans ton navigateur.'
            : 'Position introuvable. Réessaie dans un instant.'
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }

  return (
    <div className="relative shrink-0 pb-3">
      <button
        type="button"
        onClick={locate}
        disabled={busy}
        aria-label="Utiliser ma position"
        title="Utiliser ma position"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition hover:bg-white/20 disabled:cursor-wait"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-6 w-6 ${busy ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        >
          <path
            fill="#ff5a4d"
            d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
          />
        </svg>
      </button>

      {error && (
        <p
          role="alert"
          className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-white/15 bg-slate-900/85 p-2 text-xs text-red-200 backdrop-blur-md"
        >
          {error}
        </p>
      )}
    </div>
  );
}
