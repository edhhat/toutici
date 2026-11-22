// app/components/WeatherMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface MapCity {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  windKmh: number;
  gustKmh?: number;
  pressureKpa: string;
  humidity: number;
  visibilityKm: number;
  sunrise: string;
  sunset: string;
  tomorrowTemp: number;
  tomorrowDesc: string;
  hourly: {
    time: string;
    temp: number;
    feelsLike: number;
    pop: number;
    icon: string;
  }[];
}

interface WeatherMapProps {
  center: [number, number];
  zoom: number;
  cities: MapCity[];
  selectedCityName?: string;
  onSelectCity?: (city: MapCity) => void;
}

type LeafletModule = typeof import('leaflet');

function buildIcon(L: LeafletModule, city: MapCity, selected: boolean) {
  const border = selected ? '#dc2626' : '#2563eb';
  const accent = selected ? '#dc2626' : '#2563eb';
  const shadow = selected
    ? '0 4px 12px rgba(220,38,38,0.35)'
    : '0 2px 6px rgba(0,0,0,0.18)';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ffffff;
        border: 2px solid ${border};
        border-radius: 9999px;
        padding: 3px 10px;
        font-family: sans-serif;
        font-size: 12px;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
        box-shadow: ${shadow};
        transform: translate(-50%, -50%);
      ">
        <span>${city.name}</span>
        <span style="color: ${accent}; font-weight: 700;">${city.temp}°C</span>
      </div>
    `,
    iconSize: [0, 0],
  });
}

export default function WeatherMap({
  center,
  zoom,
  cities,
  selectedCityName,
  onSelectCity,
}: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markersRef = useRef<Map<string, import('leaflet').Marker>>(new Map());
  const onSelectRef = useRef(onSelectCity);
  const selectedRef = useRef(selectedCityName);

  // Garde toujours les dernières valeurs sans recréer la carte
  useEffect(() => {
    onSelectRef.current = onSelectCity;
  }, [onSelectCity]);

  useEffect(() => {
    selectedRef.current = selectedCityName;
  }, [selectedCityName]);

  // Création de la carte (uniquement si centre, zoom ou villes changent)
  useEffect(() => {
    if (!mapRef.current) return;

    let mapInstance: import('leaflet').Map | null = null;
    let cancelled = false;
    const markers = markersRef.current;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;
      leafletRef.current = L;

      mapInstance = L.map(mapRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapInstance);

      markers.clear();

      cities.forEach((city) => {
        const marker = L.marker([city.lat, city.lon], {
          icon: buildIcon(L, city, city.name === selectedRef.current),
        })
          .addTo(mapInstance!)
          .on('click', () => onSelectRef.current?.(city));

        markers.set(city.name, marker);
      });
    });

    return () => {
      cancelled = true;
      markers.clear();
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [center, zoom, cities]);

  // Met à jour l'apparence des marqueurs quand la ville sélectionnée change
  useEffect(() => {
    const L = leafletRef.current;
    if (!L) return;

    cities.forEach((city) => {
      markersRef.current
        .get(city.name)
        ?.setIcon(buildIcon(L, city, city.name === selectedCityName));
    });
  }, [selectedCityName, cities]);

  return (
    <div className="max-w-4xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
      <div ref={mapRef} className="w-full h-[420px] z-0" />
    </div>
  );
}