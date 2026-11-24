'use client';

// app/components/FavoriteButton.tsx
// Ville favorite : mémorisée dans le navigateur du visiteur (localStorage).
// - bouton ★ pour ajouter/retirer la ville affichée
// - si une autre ville est en favori, un raccourci y mène en un clic

import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'toutici-favorite-city';

interface Fav {
  query: string; // ex. « Longueuil,CA » (sert dans l'adresse /meteo/...)
  label: string; // ex. « Longueuil »
}

function isFav(value: unknown): value is Fav {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Fav).query === 'string' &&
    typeof (value as Fav).label === 'string'
  );
}

export default function FavoriteButton({
  query,
  label,
}: {
  query: string;
  label: string;
}) {
  const [fav, setFav] = useState<Fav | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isFav(parsed)) setFav(parsed);
      }
    } catch {
      /* stockage indisponible ou valeur invalide : aucun favori */
    }
    setReady(true);
  }, []);

  const current = fav?.query.toLowerCase() === query.toLowerCase();

  function toggle() {
    try {
      if (current) {
        localStorage.removeItem(KEY);
        setFav(null);
      } else {
        const next: Fav = { query, label };
        localStorage.setItem(KEY, JSON.stringify(next));
        setFav(next);
      }
    } catch {
      /* ignoré */
    }
  }

  // Évite un « clignotement » avant la lecture du stockage
  if (!ready) return <div className="h-8" />;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={current}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${
          current
            ? 'border-amber-300/60 bg-amber-300/20 text-amber-100'
            : 'border-white/20 bg-white/10 text-white/85 hover:bg-white/20'
        }`}
      >
        <span aria-hidden="true">{current ? '★' : '☆'}</span>
        {current ? 'Ville favorite' : 'Ajouter aux favoris'}
      </button>

      {fav && !current && (
        <Link
          href={`/meteo/${encodeURIComponent(fav.query)}`}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white/85 transition hover:bg-white/20"
        >
          <span aria-hidden="true" className="text-amber-300">
            ★
          </span>
          {fav.label}
        </Link>
      )}
    </div>
  );
}
