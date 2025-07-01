'use client';

import { useEffect } from 'react';

export default function ErudaDevTools() {
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      console.log(window.innerWidth)
      if (isLocalhost && window.innerWidth < 1200) {
      const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/eruda';
        script.onload = () => {
          // @ts-ignore
          eruda.init();
        };
        document.body.appendChild(script);
      }
    }
  }, []);

  return null;
}