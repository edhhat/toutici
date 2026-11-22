// app/components/CountryDashboard.tsx
'use client';

import { useState } from 'react';
import WeatherMap, { MapCity } from './WeatherMap';

interface CountryDashboardProps {
  center: [number, number];
  zoom: number;
  cities: MapCity[];
}

export default function CountryDashboard({ center, zoom, cities }: CountryDashboardProps) {
  const [selectedCity, setSelectedCity] = useState<MapCity | null>(cities[0] ?? null);

  return (
    <div className="max-w-6xl mx-auto mb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Colonne de gauche : Carte (7 colonnes sur 12) */}
      <div className="lg:col-span-7">
        <WeatherMap
          center={center}
          zoom={zoom}
          cities={cities}
          selectedCityName={selectedCity?.name}
          onSelectCity={(city) => setSelectedCity(city)}
        />
      </div>

      {/* Colonne de droite : Infos détaillées (5 colonnes sur 12) */}
      <div className="lg:col-span-5">
        {selectedCity ? (
          <div className="h-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-6 shadow-md flex flex-col justify-between gap-5">
            {/* En-tête : Ville + Température principale */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCity.name}</h2>
                  <p className="text-sm text-slate-300 capitalize">{selectedCity.description}</p>
                </div>
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-slate-200">
                  Cliquez sur la carte
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://openweathermap.org/img/wn/${selectedCity.icon}@2x.png`}
                    alt={selectedCity.description}
                    className="w-14 h-14 -my-2"
                  />
                  <span className="text-5xl font-bold">{selectedCity.temp}°C</span>
                </div>
                <div className="text-right text-sm text-slate-200">
                  <p>T. ressentie : <strong className="text-white">{selectedCity.feelsLike}°</strong></p>
                  <p className="text-xs text-slate-300 mt-1">
                    Max : {selectedCity.tempMax}° &nbsp; Min : {selectedCity.tempMin}°
                  </p>
                </div>
              </div>
            </div>

            {/* Prévisions horaires (tranches de 3h) */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Horaire
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {selectedCity.hourly.map((slot, idx) => (
                  <div
                    key={idx}
                    className="bg-white/10 rounded-xl p-2.5 text-center flex flex-col items-center"
                  >
                    <span className="text-xs text-slate-300">{slot.time}</span>
                    <img
                      src={`https://openweathermap.org/img/wn/${slot.icon}.png`}
                      alt=""
                      className="w-8 h-8 my-0.5"
                    />
                    <span className="font-bold text-base">{slot.temp}°</span>
                    <span className="text-[11px] text-slate-300">Ress. {slot.feelsLike}°</span>
                    <span className="text-[11px] text-sky-300 mt-0.5">💧 {slot.pop}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conditions actuelles */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Conditions actuelles
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-sm">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-slate-300">Vents</p>
                  <p className="font-bold text-base mt-0.5">{selectedCity.windKmh} km/h</p>
                  {selectedCity.gustKmh && (
                    <p className="text-[11px] text-slate-300">Rafales : {selectedCity.gustKmh} km/h</p>
                  )}
                </div>

                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-slate-300">Pression</p>
                  <p className="font-bold text-base mt-0.5">{selectedCity.pressureKpa} kPa</p>
                </div>

                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-slate-300">Humidité</p>
                  <p className="font-bold text-base mt-0.5">{selectedCity.humidity}%</p>
                </div>

                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-slate-300">Visibilité</p>
                  <p className="font-bold text-base mt-0.5">{selectedCity.visibilityKm} km</p>
                </div>

                <div className="bg-white/10 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-slate-300">Soleil</p>
                  <p className="font-semibold text-sm mt-1">
                    🌅 {selectedCity.sunrise} &nbsp;&nbsp; 🌇 {selectedCity.sunset}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full rounded-2xl bg-white border border-slate-200 p-6 flex items-center justify-center text-slate-400">
            Sélectionnez une ville sur la carte
          </div>
        )}
      </div>
    </div>
  );
}