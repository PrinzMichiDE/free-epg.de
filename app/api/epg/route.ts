import { NextResponse } from 'next/server';
import { getEpgData } from '@/lib/epg-service';
import { incrementDownloads } from '@/lib/stats-service';

/**
 * API Route Handler für EPG XML
 * GET /api/epg
 * 
 * Liefert die EPG Daten als XML aus.
 * Die Daten werden täglich automatisch aktualisiert.
 */
export async function GET() {
  try {
    const xmlData = await getEpgData();
    
    // Download-Counter inkrementieren
    incrementDownloads();
    
    // XML mit korrektem Content-Type zurückgeben
    return new NextResponse(xmlData, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Cache-Header für Browser/CDN (1 Stunde)
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API] Fehler beim Abrufen der EPG Daten:', error);
    
    return NextResponse.json(
      {
        error: 'Fehler beim Laden der EPG Daten',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

// Route als dynamisch markieren (für Vercel)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

