import { NextResponse } from 'next/server';
import { resetEpgCache } from '@/lib/epg-service';

/**
 * API Route zum manuellen Zurücksetzen des EPG Caches
 * POST /api/epg/refresh
 * 
 * Setzt den Cache zurück, sodass beim nächsten Request
 * die Daten neu geladen werden.
 */
export async function POST() {
  try {
    resetEpgCache();
    
    return NextResponse.json(
      {
        success: true,
        message: 'EPG Cache wurde zurückgesetzt. Daten werden beim nächsten Request neu geladen.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Fehler beim Zurücksetzen des Caches:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Zurücksetzen des Caches',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

