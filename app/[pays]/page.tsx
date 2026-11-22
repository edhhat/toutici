// app/[pays]/page.tsx

import { notFound } from 'next/navigation';
import { COUNTRIES, getWeatherAndForecast } from '../lib/weather';
import Navbar from '../components/Navbar';
import CitySearch from '../components/CitySearch';
import AdBanner from '../components/AdBanner';
import CountryDashboard from '../components/CountryDashboard';
import { MapCity } from '../components/WeatherMap';

export const runtime = 'edge';
 

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

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8 flex flex-col justify-between">
      <div>
        <Navbar />

        <header className="max-w-4xl mx-auto mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            {country.flag} Météo {country.name}
          </h1>
          <p className="text-slate-600">
            Conditions actuelles et prévisions pour demain
          </p>
        </header>

        <CitySearch />
        <AdBanner label={`Bannière publicitaire - ${country.name}`} />

        {/* Carte à gauche + Panneau détaillé à droite */}
        <CountryDashboard
          center={country.mapCenter}
          zoom={country.mapZoom}
          cities={mapCities}
        />

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {weatherData.map((data, index) => {
            const fallbackName = country.cities[index].label;

            if (!data || !data.list || data.list.length < 9) {
              return (
                <div
                  key={fallbackName}
                  className="flex justify-between p-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm"
                >
                  <span className="font-medium">{fallbackName}</span>
                  <span>Erreur de chargement</span>
                </div>
              );
            }

            const current = data.list[0];
            const tomorrow = data.list[8];

            return (
              <div
                key={data.city.id}
                className="p-5 bg-white hover:border-blue-300 transition rounded-2xl shadow-sm border border-slate-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold text-slate-800 text-lg">{fallbackName}</span>
                    <p className="text-sm text-slate-500 capitalize">
                      {current.weather[0]?.description}
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(current.main.temp)}°C
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Demain :</span>
                  <span className="text-slate-700 font-medium capitalize">
                    {Math.round(tomorrow.main.temp)}°C, {tomorrow.weather[0]?.description}
                  </span>
                </div>
              </div>
            );
          })}
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