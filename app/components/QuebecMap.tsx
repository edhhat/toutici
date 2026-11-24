'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Marker } from 'leaflet';

export interface DayWeather {
  min: number;
  max: number;
  icon: string;
  description: string;
}

export interface QuebecCity {
  name: string;
  lat: number;
  lon: number;
  days: (DayWeather | null)[];
}

export interface DayOption {
  key: string;
  label: string;
}

type Mode = 'symbole' | 'temperature';

const QUEBEC_BOUNDS: [[number, number], [number, number]] = [
  [44.9, -80.5], // sud-ouest
  [62.9, -56.5], // nord-est
];

const MAP_CSS = `
.qc-marker{background:none;border:none}
.qc-wrap{display:flex;flex-direction:column;align-items:center;width:120px;pointer-events:none;
  font-family:system-ui,sans-serif;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff,0 0 5px #fff}
.qc-row{display:flex;align-items:center;gap:0}
.qc-row img{width:44px;height:44px;margin:-6px -2px -6px 0;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
.qc-t{display:flex;flex-direction:column;line-height:1.05;font-weight:700;font-size:13px}
.qc-max{color:#e11d2e}
.qc-min{color:#1769e0}
.qc-name{margin-top:1px;font-size:13px;font-weight:500;color:#1f2937;text-align:center;line-height:1.1}
.qc-only .qc-t{font-size:16px;flex-direction:row;gap:6px}
`;

function buildHtml(city: QuebecCity, dayIdx: number, mode: Mode): string {
  const d = city.days[dayIdx];
  if (!d) {
    return `<div class="qc-wrap"><div class="qc-name">${city.name}</div></div>`;
  }
  const img =
    mode === 'symbole'
      ? `<img src="https://openweathermap.org/img/wn/${d.icon}@2x.png" alt="${d.description}" title="${d.description}">`
      : '';
  return `<div class="qc-wrap ${mode === 'temperature' ? 'qc-only' : ''}">
    <div class="qc-row">${img}<div class="qc-t"><span class="qc-max">${d.max}°</span><span class="qc-min">${d.min}°</span></div></div>
    <div class="qc-name">${city.name}</div>
  </div>`;
}

export default function QuebecMap({
  cities,
  days,
}: {
  cities: QuebecCity[];
  days: DayOption[];
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const markersRef = useRef<{ marker: Marker; city: QuebecCity }[]>([]);

  const [ready, setReady] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const [mode, setMode] = useState<Mode>('symbole');

  /* Création de la carte (une seule fois) */
  useEffect(() => {
    let cancelled = false;
    let cleanupResize = () => {};

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapEl.current || mapRef.current) return;

      // Carte verrouillée : pas de zoom ni de déplacement
      const map = L.map(mapEl.current, {
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomSnap: 0,
        attributionControl: true,
      });

      // Tout le Québec (sud de Montréal -> nord du Nunavik, Blanc-Sablon -> Kuujjuarapik)
      const fit = () => {
        map.invalidateSize();
        map.fitBounds(QUEBEC_BOUNDS, { padding: [10, 10], animate: false });
      };
      fit();
      window.addEventListener('resize', fit);
      cleanupResize = () => window.removeEventListener('resize', fit);

      // Fond de carte SANS noms de villes (les nôtres sont ajoutés par-dessus)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        }
      ).addTo(map);

      markersRef.current = cities.map((city) => ({
        city,
        marker: L.marker([city.lat, city.lon], {
          keyboard: false,
          interactive: false,
          icon: L.divIcon({
            className: 'qc-marker',
            html: buildHtml(city, 0, 'symbole'),
            iconSize: [120, 66],
            iconAnchor: [60, 33],
          }),
        }),
      }));

      markersRef.current.forEach(({ marker }) => marker.addTo(map));

      LRef.current = L;
      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      cleanupResize();
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
      setReady(false);
    };
  }, [cities]);

  /* Mise à jour des symboles quand le jour ou l'affichage change */
  useEffect(() => {
    const L = LRef.current;
    if (!ready || !L) return;
    for (const { marker, city } of markersRef.current) {
      marker.setIcon(
        L.divIcon({
          className: 'qc-marker',
          html: buildHtml(city, dayIdx, mode),
          iconSize: [120, 66],
          iconAnchor: [60, 33],
        })
      );
    }
  }, [ready, dayIdx, mode]);

  const selectClass =
    'rounded-xl bg-white text-slate-800 text-base px-4 py-2 shadow border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400';

  return (
    <div className="relative z-0 w-full">
      <style>{MAP_CSS}</style>

      <div className="mb-3 flex flex-wrap gap-3">
        <select
          aria-label="Jour"
          value={dayIdx}
          onChange={(e) => setDayIdx(Number(e.target.value))}
          className={selectClass}
        >
          {days.map((d, i) => (
            <option key={d.key} value={i}>
              {d.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Affichage"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className={selectClass}
        >
          <option value="symbole">Symbole</option>
          <option value="temperature">Température</option>
        </select>
      </div>

      <div
        ref={mapEl}
        className="h-[80vh] min-h-[480px] w-full overflow-hidden rounded-3xl border border-white/20 shadow-xl"
      />
    </div>
  );
}
