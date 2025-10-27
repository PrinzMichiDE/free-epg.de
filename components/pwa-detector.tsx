'use client';

import { useState, useEffect } from 'react';

export function usePWAMode() {
  const [isPWA, setIsPWA] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Prüfe ob App als PWA läuft (standalone mode)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsPWA(isStandalone);
    
    // Optional: Für Debugging
    if (isStandalone) {
      console.log('[PWA] App läuft im Standalone-Modus');
    }
  }, []);

  // Verhindere Hydration-Fehler, indem wir während SSR immer false returnen
  if (!isMounted) {
    return false;
  }

  return isPWA;
}

