// app/components/WeatherMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface MapCity {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  description: string;
  tomorrowTemp: number;
  tomorrowDesc: string;
}

interface WeatherMapProps {
  center: [number, number];
  zoom: number;
  cities: MapCity[];
}

export default function WeatherMap({ center, zoom, cities }: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let mapInstance: import('leaflet').Map | null = null;
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;

      mapInstance = L.map(mapRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapInstance);

      cities.forEach((city) => {
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #ffffff;
              border: 2px solid #2563eb;
              border-radius: 9999px;
              padding: 3px 10px;
              font-family: sans-serif;
              font-size: 12px;
              font-weight: 600;
              color: #1e293b;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.18);
              transform: translate(-50%, -50%);
            ">
              <span>${city.name}</span>
              <span style="color: #2563eb; font-weight: 700;">${city.temp}°C</span>
            </div>
          `,
          iconSize: [0, 0],
        });

        L.marker([city.lat, city.lon], { icon })
          .addTo(mapInstance!)
          .bindPopup(`
            <div style="font-family: sans-serif; min-width: 140px;">
              <strong style="font-size: 14px;">${city.name}</strong><br/>
              <span style="color: #2563eb; font-size: 16px; font-weight: bold;">${city.temp}°C</span>
              <span style="text-transform: capitalize; color: #475569;"> — ${city.description}</span>
              <hr style="margin: 6px 0; border: 0; border-top: 1px solid #e2e8f0;" />
              <small style="color: #64748b;">Demain : <strong>${city.tomorrowTemp}°C</strong>, ${city.tomorrowDesc}</small>
            </div>
          `);
      });
    });

    return () => {
      cancelled = true;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [center, zoom, cities]);

  return (
    <div className="max-w-4xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
      <div ref={mapRef} className="w-full h-[420px] z-0" />
    </div>
  );
}