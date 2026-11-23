// app/page.tsx
import Link from 'next/link';
import VisitorCounter from '@/components/VisitorCounter';
import { COUNTRIES } from './lib/weather';
import Navbar from './components/Navbar';
import CitySearch from './components/CitySearch';
import AdBanner from './components/AdBanner';

/* Logo ToutIci : les deux « i » portent un soleil et un repère de position */
function ToutIciLogo() {
  return (
    <svg
      viewBox="-12 -24 276 96"
      role="img"
      aria-label="ToutIci"
      className="w-44 h-auto text-white drop-shadow-lg"
    >
      <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
<path d="M10 6V44Q10 60 26 60"/><path d="M-2 22H24"/>
<circle cx="54" cy="40" r="20"/>
<path d="M84 20V40A20 20 0 0 0 124 40V20M124 38V60"/>
<path d="M144 6V44Q144 60 160 60"/><path d="M132 22H158"/>
<path d="M229.3 27.1A20 20 0 1 0 229.3 52.9"/>
<path d="M178 20V60"/><path d="M250 20V60"/>
</g><g stroke="#ffb400" strokeWidth="2.6" strokeLinecap="round"><line x1="188.0" y1="-4.0" x2="192.5" y2="-4.0"/><line x1="185.1" y1="3.1" x2="188.3" y2="6.3"/><line x1="178.0" y1="6.0" x2="178.0" y2="10.5"/><line x1="170.9" y1="3.1" x2="167.7" y2="6.3"/><line x1="168.0" y1="-4.0" x2="163.5" y2="-4.0"/><line x1="170.9" y1="-11.1" x2="167.7" y2="-14.3"/><line x1="178.0" y1="-14.0" x2="178.0" y2="-18.5"/><line x1="185.1" y1="-11.1" x2="188.3" y2="-14.3"/></g><circle cx="178" cy="-4" r="7.5" fill="#ffc21a"/><path fill="#ff5a4d" fillRule="evenodd" d="M250 10L244.7 1.4A7 7 0 1 1 255.3 1.4ZM247.5 -3a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z"/>
    </svg>
  );
}

/* Ciel dégagé de jour (même dégradé que la page ville par temps clair) */
const SKY = 'linear-gradient(180deg, #1c6fd1 0%, #4aa3e8 55%, #f2c27a 100%)';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center gap-5 px-5 py-10 text-white"
      style={{ background: SKY }}
    >
      <div className="w-full max-w-4xl">
        <Navbar />
      </div>

      <header className="w-full max-w-4xl px-1 flex flex-col gap-5">
        <ToutIciLogo />
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Météo</h1>
          <p className="mt-1 text-white/75">
            Recherchez n’importe quelle ville ou choisissez une destination
          </p>
        </div>
      </header>

      <div className="w-full max-w-4xl">
        <CitySearch />
      </div>

      <div className="w-full max-w-4xl">
        <AdBanner label="Bannière publicitaire - Accueil" />
      </div>

      <section className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5">
        <h2 className="sr-only">Destinations</h2>
        {Object.values(COUNTRIES).map((country) => (
          <Link
            key={country.slug}
            href={`/${country.slug}`}
            className="group rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-7 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          >
            <h3 className="text-2xl font-semibold">
              <span className="mr-2">{country.flag}</span>
              {country.name}
            </h3>
            <p className="mt-1 text-sm text-white/70">
              Voir les {country.cities.length} principales villes →
            </p>
          </Link>
        ))}
      </section>

      <footer className="w-full max-w-4xl mt-2 text-center text-sm text-white/60">
        Données météorologiques fournies par{' '}
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          OpenWeather
        </a>
        .
        <div className="mt-3 text-white/70">
          <VisitorCounter />
        </div>
      </footer>
    </main>
  );
}
