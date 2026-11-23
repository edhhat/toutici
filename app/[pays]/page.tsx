// app/[pays]/page.tsx

import { notFound } from 'next/navigation';
import VisitorCounter from '@/components/VisitorCounter';
import { COUNTRIES, getWeatherAndForecast } from '../lib/weather';
import Navbar from '../components/Navbar';
import CitySearch from '../components/CitySearch';
import AdBanner from '../components/AdBanner';
import CountryDashboard from '../components/CountryDashboard';
import { MapCity } from '../components/WeatherMap';

export const runtime = 'edge';

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

/* Le ciel de la page change selon la météo (ici : celle de la première ville du pays) */
function getSkyGradient(icon: string): string {
  const isNight = icon.endsWith('n');
  const code = icon.slice(0, 2);

  if (isNight) {
    switch (code) {
      case '01':
      case '02':
        return 'linear-gradient(180deg, #0b1026 0%, #1b2250 55%, #3a3470 100%)';
      case '11':
        return 'linear-gradient(180deg, #0a0a14 0%, #1d1a33 60%, #35224d 100%)';
      case '13':
        return 'linear-gradient(180deg, #141a2b 0%, #2a3550 60%, #4a5876 100%)';
      default:
        return 'linear-gradient(180deg, #0d1220 0%, #1c2336 60%, #2c3447 100%)';
    }
  }

  switch (code) {
    case '01':
      return 'linear-gradient(180deg, #1c6fd1 0%, #4aa3e8 55%, #f2c27a 100%)';
    case '02':
      return 'linear-gradient(180deg, #3a7fc7 0%, #7ab1dc 60%, #cfd9df 100%)';
    case '03':
    case '04':
      return 'linear-gradient(180deg, #56677d 0%, #8394a8 60%, #b4bfca 100%)';
    case '09':
    case '10':
      return 'linear-gradient(180deg, #2c3e56 0%, #46607c 60%, #6c869f 100%)';
    case '11':
      return 'linear-gradient(180deg, #1e1b34 0%, #3b3560 60%, #5b5280 100%)';
    case '13':
      return 'linear-gradient(180deg, #7e97b3 0%, #b4c6d8 60%, #e3ecf4 100%)';
    case '50':
      return 'linear-gradient(180deg, #6b7684 0%, #9aa4af 60%, #c6ccd2 100%)';
    default:
      return 'linear-gradient(180deg, #1c6fd1 0%, #4aa3e8 100%)';
  }
}

export async function generateMetadata({ params }: { params: Promise<{ pays: string }> }) {
  const { pays } = await params;
  const country = COUNTRIES[pays.toLowerCase()];
  if (!country) return { title: 'Pays introuvable - ToutIci' };

  return {
    title: `Météo ${country.name} en temps réel | ToutIci`,
    description: `Consultez la météo actuelle et les prévisions de demain pour les principales villes de ${country.name}.`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ pays: string }> }) {
  const { pays } = await params;
  const country = COUNTRIES[pays.toLowerCase()];

  if (!country) {
    notFound();
  }

  const weatherData = await Promise.all(
    country.cities.map((city) => getWeatherAndForecast(city.query))
  );

  const formatTime = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  // Préparation des données complètes pour la carte et le panneau de droite
  const mapCities: MapCity[] = weatherData
    .map((data, index): MapCity | null => {
      if (!data || !data.list || data.list.length < 9 || !data.city.coord) return null;
      const current = data.list[0];
      const tomorrow = data.list[8];

      return {
        name: country.cities[index].label,
        lat: data.city.coord.lat,
        lon: data.city.coord.lon,
        temp: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        tempMin: Math.round(current.main.temp_min),
        tempMax: Math.round(current.main.temp_max),
        description: current.weather[0]?.description || '',
        icon: current.weather[0]?.icon || '01d',
        windKmh: Math.round((current.wind?.speed || 0) * 3.6),
        gustKmh: current.wind?.gust ? Math.round(current.wind.gust * 3.6) : undefined,
        pressureKpa: (current.main.pressure / 10).toFixed(1),
        humidity: current.main.humidity,
        visibilityKm: Math.round((current.visibility || 10000) / 1000),
        sunrise: formatTime(data.city.sunrise),
        sunset: formatTime(data.city.sunset),
        tomorrowTemp: Math.round(tomorrow.main.temp),
        tomorrowDesc: tomorrow.weather[0]?.description || '',
        hourly: data.list.slice(0, 4).map((slot) => ({
          time: `${new Date(slot.dt * 1000).getHours()}h`,
          temp: Math.round(slot.main.temp),
          feelsLike: Math.round(slot.main.feels_like),
          pop: Math.round((slot.pop || 0) * 100),
          icon: slot.weather[0]?.icon || '01d',
        })),
      };
    })
    .filter((c): c is MapCity => c !== null);

  // Ciel : basé sur la première ville dont les données sont valides
  const skyIcon = mapCities[0]?.icon ?? '01d';

  return (
    <main
      className="min-h-screen flex flex-col items-center gap-5 px-5 py-10 text-white"
      style={{ background: getSkyGradient(skyIcon) }}
    >
      <div className="w-full max-w-4xl">
        <Navbar />
      </div>

      <header className="w-full max-w-4xl px-1 flex flex-col gap-5">
        <ToutIciLogo />
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            <span className="mr-3">{country.flag}</span>
            Météo {country.name}
          </h1>
          <p className="mt-1 text-white/75">
            Conditions actuelles et prévisions pour demain
          </p>
        </div>
      </header>

      <div className="w-full max-w-4xl">
        <CitySearch />
      </div>

      <div className="w-full max-w-4xl">
        <AdBanner label={`Bannière publicitaire - ${country.name}`} />
      </div>

      {/* Carte à gauche + Panneau détaillé à droite */}
      <section className="w-full max-w-4xl rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 overflow-hidden text-slate-800">
        <CountryDashboard
          center={country.mapCenter}
          zoom={country.mapZoom}
          cities={mapCities}
        />
      </section>

      {/* Villes : une ligne par ville, comme les prévisions de la page ville */}
      <section className="w-full max-w-4xl rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 px-6 py-2">
        <h2 className="sr-only">Météo des principales villes</h2>
        <ul className="divide-y divide-white/10">
          {weatherData.map((data, index) => {
            const fallbackName = country.cities[index].label;

            if (!data || !data.list || data.list.length < 9) {
              return (
                <li
                  key={fallbackName}
                  className="flex justify-between items-center py-3 text-sm text-red-300"
                >
                  <span className="font-medium">{fallbackName}</span>
                  <span>Erreur de chargement</span>
                </li>
              );
            }

            const current = data.list[0];
            const tomorrow = data.list[8];
            const icon = current.weather[0]?.icon || '01d';
            const description = current.weather[0]?.description || '';

            return (
              <li key={data.city.id} className="flex items-center gap-3 py-3">
                <img
                  src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                  alt={description}
                  title={description}
                  className="w-11 h-11 shrink-0"
                />
                <div className="min-w-0 flex-1 leading-tight">
                  <span className="block font-medium truncate">{fallbackName}</span>
                  <span className="block text-xs text-white/55 capitalize truncate">
                    {description}
                  </span>
                </div>
                <div className="text-right leading-tight">
                  <span className="block text-2xl font-semibold tabular-nums">
                    {Math.round(current.main.temp)}°
                  </span>
                  <span className="block text-xs text-white/55 capitalize">
                    Demain : {Math.round(tomorrow.main.temp)}°, {tomorrow.weather[0]?.description}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
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
