// app/page.tsx
import Link from 'next/link';
import { COUNTRIES } from './lib/weather';
import Navbar from './components/Navbar';
import CitySearch from './components/CitySearch';
import AdBanner from './components/AdBanner';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8 flex flex-col justify-between">
      <div>
        <Navbar />

        <header className="max-w-4xl mx-auto mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            ToutIci - Météo
          </h1>
          <p className="text-slate-600">
            Recherchez n'importe quelle ville ou choisissez une destination
          </p>
        </header>

        <CitySearch />
        <AdBanner label="Bannière publicitaire - Accueil" />

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(COUNTRIES).map((country) => (
            <Link
              key={country.slug}
              href={`/${country.slug}`}
              className="group p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition">
                  {country.flag} {country.name}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Voir les {country.cities.length} principales villes →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <footer className="max-w-4xl mx-auto mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-500 w-full">
        Données météorologiques fournies par{' '}
        <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer" className="underline">
          OpenWeather
        </a>.
      </footer>
    </main>
  );
}