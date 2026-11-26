'use client';

import { useEffect, useState } from 'react';

export interface HeroPhoto {
  src: string;
  alt: string;
  credit: string;
  license: string;
  /** Nom de la banque d'images (affiché dans le crédit) */
  source: string;
  page: string;
}

export default function HeroPhotos({
  photos,
  intervalMs = 8000,
}: {
  photos: HeroPhoto[];
  intervalMs?: number;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % photos.length), intervalMs);
    return () => clearInterval(t);
  }, [photos.length, intervalMs, i]);

  if (photos.length === 0) return null;
  const current = photos[i];

  return (
    <>
      {/* Photos en fondu enchaîné, avec un léger zoom */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {photos.map((p, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.src}
            src={p.src}
            alt=""
            loading={idx === 0 ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: idx === i ? 1 : 0,
              transform: idx === i ? 'scale(1.06)' : 'scale(1)',
              transition: 'opacity 1.5s ease, transform 9s ease-out',
            }}
          />
        ))}
        {/* Voile sombre pour garder le texte lisible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(9,9,11,.94) 0%, rgba(9,9,11,.78) 45%, rgba(9,9,11,.35) 100%), linear-gradient(0deg, rgba(9,9,11,.8) 0%, rgba(9,9,11,0) 45%)',
          }}
        />
      </div>

      {/* Crédit de la photo (obligatoire avec les licences Creative Commons) */}
      <div className="absolute right-4 top-4 z-20 flex max-w-[60%] items-center gap-3 text-[11px] text-white/75">
        <a
          href={current.page}
          target="_blank"
          rel="noopener noreferrer"
          title={current.alt}
          className="truncate rounded-full bg-black/40 px-3 py-1 backdrop-blur hover:text-white"
        >
          Photo : {current.credit}
          {current.license ? ` · ${current.license}` : ''} · {current.source}
        </a>
      </div>

      {/* Points de navigation */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5">
          {photos.map((p, idx) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Afficher la photo ${idx + 1}`}
              aria-current={idx === i}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? 'w-6 bg-[#c8ff3d]' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
