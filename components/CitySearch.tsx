// app/components/CitySearch.tsx
'use client';

import { useState, FormEvent } from 'react';

interface SearchResult {
  city: { name: string; country: string };
  list: {
    main: { temp: number };
    weather: { description: string }[];
  }[];
}

export default function CitySearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la recherche.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mb-10">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une ville (ex: Rimouski,CA ou Annecy,FR)..."
          className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
        >
          {loading ? '...' : 'Chercher'}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-center text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
          {error}
        </p>
      )}

      {result && result.list && result.list.length >= 9 && (
        <div className="mt-4 p-5 bg-white rounded-2xl shadow-sm border border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="font-bold text-slate-800 text-xl">
                {result.city.name}, {result.city.country}
              </span>
              <p className="text-sm text-slate-500 capitalize">
                {result.list[0].weather[0]?.description}
              </p>
            </div>
            <div className="text-4xl font-bold text-blue-600">
              {Math.round(result.list[0].main.temp)}°C
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
            <span className="text-slate-500">Demain :</span>
            <span className="text-slate-700 font-medium capitalize">
              {Math.round(result.list[8].main.temp)}°C, {result.list[8].weather[0]?.description}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}