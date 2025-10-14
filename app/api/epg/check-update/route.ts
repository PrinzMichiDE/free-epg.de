import { NextResponse } from 'next/server';
import { getCacheInfo, loadEpgData, getEpgData } from '@/lib/epg-service';

/**
 * API Route zum Prüfen und Triggern von EPG-Updates
 * POST /api/epg/check-update
 * 
 * Prüft ob ein Update nötig ist und triggert es direkt.
 */
export async function POST() {
  try {
    const cacheInfo = getCacheInfo();
    const revalidateSeconds = parseInt(
      process.env.EPG_REVALIDATE_SECONDS || '86400',
      10
    );

    let needsUpdate = false;
    let message = '';
    let updateStarted = false;

    if (!cacheInfo.cached) {
      // Cache ist leer - Update direkt starten
      needsUpdate = true;
      message = 'Cache ist leer. Starte Update...';
      
      // Direkter Aufruf der Update-Funktion (kein HTTP-Request)
      loadEpgData()
        .then(() => {
          console.log('[EPG] Hintergrund-Update erfolgreich abgeschlossen');
        })
        .catch((error) => {
          console.error('[EPG] Hintergrund-Update fehlgeschlagen:', error);
        });
      
      updateStarted = true;
      message = 'Cache wird geladen. Daten sind in Kürze verfügbar.';
    } else if (cacheInfo.age && cacheInfo.age >= revalidateSeconds * 1000) {
      // Cache ist abgelaufen - Daten neu laden
      needsUpdate = true;
      message = `Cache ist abgelaufen (${cacheInfo.ageFormatted} alt).`;
      
      // Triggere Update direkt im Hintergrund
      getEpgData()
        .then(() => {
          console.log('[EPG] Cache-Refresh erfolgreich');
        })
        .catch((error) => {
          console.error('[EPG] Cache-Refresh fehlgeschlagen:', error);
        });
      
      updateStarted = true;
      message += ' Update im Hintergrund gestartet.';
    } else {
      message = `Cache ist aktuell (${cacheInfo.ageFormatted} alt).`;
    }

    return NextResponse.json(
      {
        success: true,
        needsUpdate,
        updateStarted,
        message,
        cache: {
          active: cacheInfo.cached,
          age: cacheInfo.age,
          ageFormatted: cacheInfo.ageFormatted,
          revalidateSeconds,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Fehler beim Prüfen des Updates:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Prüfen des Updates',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 Sekunden Timeout für Vercel

