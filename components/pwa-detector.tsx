'use client';

import { useState, useEffect } from 'react';

export function usePWAMode() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
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

  return isPWA;
}

