import { NextResponse } from 'next/server';
import { getCacheInfo } from '@/lib/epg-service';

/**
 * API Route zum Prüfen und Triggern von EPG-Updates
 * POST /api/epg/check-update
 * 
 * Prüft ob ein Update nötig ist und gibt entsprechende Info zurück.
 * Triggert das Update im Hintergrund wenn nötig.
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

    if (!cacheInfo.cached) {
      // Cache ist leer - Update wird beim nächsten /api/epg Aufruf passieren
      needsUpdate = true;
      message = 'Cache ist leer. Daten werden beim nächsten EPG-Aufruf geladen.';
    } else if (cacheInfo.age && cacheInfo.age >= revalidateSeconds * 1000) {
      // Cache ist abgelaufen
      needsUpdate = true;
      message = `Cache ist abgelaufen (${cacheInfo.ageFormatted} alt). Update wird vorbereitet.`;
      
      // Triggere Update im Hintergrund durch einen Aufruf an /api/epg
      // Dies wird im Hintergrund ausgeführt ohne auf die Response zu warten
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/epg`, {
        method: 'GET',
      }).catch((error) => {
        console.error('[EPG] Hintergrund-Update fehlgeschlagen:', error);
      });
      
      message += ' Update im Hintergrund gestartet.';
    } else {
      message = `Cache ist aktuell (${cacheInfo.ageFormatted} alt).`;
    }

    return NextResponse.json(
      {
        success: true,
        needsUpdate,
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

