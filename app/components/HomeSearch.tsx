'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

const CITIES = [
  'Montréal', 'Québec', 'Laval', 'Longueuil', 'Gatineau', 'Sherbrooke', 'Saguenay',
  'Trois-Rivières', 'Lévis', 'Terrebonne', 'Drummondville', 'Saint-Jérôme', 'Granby',
  'Rimouski', 'Rouyn-Noranda', 'Sept-Îles', 'Baie-Comeau', 'Gaspé', 'Chicoutimi',
  'Victoriaville', 'Shawinigan', 'Saint-Hyacinthe', 'Joliette', 'Toronto', 'Ottawa',
  'Vancouver', 'Calgary', 'Edmonton', 'Winnipeg', 'Halifax', 'Paris', 'Londres',
  'Bruxelles', 'Genève', 'Marseille', 'Lyon', 'New York', 'Los Angeles', 'Miami',
  'Boston', 'Chicago', 'Tokyo', 'Casablanca', 'Alger', 'Tunis', 'Dakar',
  'Port-au-Prince', 'Cancún', 'Barcelone', 'Rome',
];

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function HomeSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = norm(value.trim());
    if (!q) return [];
    const starts = CITIES.filter((c) => norm(c).startsWith(q));
    const contains = CITIES.filter((c) => !norm(c).startsWith(q) && norm(c).includes(q));
    return [...starts, ...contains].slice(0, 6);
  }, [value]);

  /* Raccourci clavier : « / » pour chercher */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (city: string) => {
    const c = city.trim();
    if (!c) return;
    setOpen(false);
    router.push(`/meteo/${encodeURIComponent(c)}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    go(active >= 0 && suggestions[active] ? suggestions[active] : value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const locate = () => {
    setMessage(null);
    if (!('geolocation' in navigator)) {
      setMessage('La géolocalisation n’est pas disponible sur cet appareil.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/locate?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const json = await res.json();
          if (!res.ok || !json.name) throw new Error('locate');
          go(json.name as string);
        } catch {
          setMessage('Impossible de trouver ta ville. Essaie avec la recherche.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setMessage('Position refusée. Autorise la localisation ou cherche une ville.');
      },
      { timeout: 10_000, maximumAge: 300_000 }
    );
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={submit}
        role="search"
        className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 p-2 pl-4 transition focus-within:border-[#c8ff3d] focus-within:shadow-[0_0_0_4px_rgba(200,255,61,0.12)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>

        <label htmlFor="home-city" className="sr-only">
          Nom de la ville
        </label>
        <input
          ref={inputRef}
          id="home-city"
          type="text"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="home-city-list"
          aria-autocomplete="list"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Chercher une ville…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none sm:text-lg"
        />

        <kbd className="hidden rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-400 sm:block">
          /
        </kbd>

        <button
          type="submit"
          disabled={!value.trim()}
          className="shrink-0 rounded-xl bg-[#c8ff3d] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#d8ff75] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Go
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="home-city-list"
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/15 bg-[#151517] shadow-2xl"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-3 text-base ${
                i === active ? 'bg-white/10 text-white' : 'text-zinc-300'
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-[#c8ff3d] hover:text-[#c8ff3d] disabled:opacity-60"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {locating ? 'Localisation…' : 'Ma position'}
        </button>
        {message && <span className="text-sm text-amber-300">{message}</span>}
      </div>
    </div>
  );
}
