'use client';

import { useEffect, useRef, useState } from 'react';

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetch('https://api.counterapi.dev/v1/toutici-ca/visites/up')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') {
          setCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

  if (count === null) return null;

  return (
    <p className="text-xs text-slate-500 mt-4">
      {count.toLocaleString('fr-CA')} visiteur{count > 1 ? 's' : ''}
    </p>
  );
}