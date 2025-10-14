import { NextResponse } from 'next/server';
import { getStats } from '@/lib/stats-service';

/**
 * API Route für Statistiken
 * GET /api/stats
 * 
 * Gibt die aktuellen Besucher- und Download-Statistiken zurück.
 */
export async function GET() {
  try {
    const stats = getStats();
    
    return NextResponse.json(
      {
        success: true,
        stats: {
          visitors: stats.visitors,
          downloads: stats.downloads,
          lastReset: stats.lastReset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Fehler beim Abrufen der Statistiken:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Abrufen der Statistiken',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

