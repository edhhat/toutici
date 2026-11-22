// app/components/Navbar.tsx
import Link from 'next/link';
import { COUNTRIES } from '../app/lib/weather';

export default function Navbar() {
  return (
    <nav className="max-w-4xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
      <Link href="/" className="text-xl font-bold text-slate-800 hover:text-blue-600 transition">
        ToutIci Météo
      </Link>
      <div className="flex flex-wrap gap-2">
        {Object.values(COUNTRIES).map((country) => (
          <Link
            key={country.slug}
            href={`/${country.slug}`}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-medium text-sm transition"
          >
            {country.flag} {country.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}