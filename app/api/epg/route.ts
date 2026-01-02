import { NextResponse } from 'next/server';
import { getEpgData, getAvailableCountries } from '@/lib/epg-service';
import { incrementDownloads } from '@/lib/stats-service';

/**
 * API Route Handler für EPG XML
 * GET /api/epg?country=DE
 * 
 * Liefert die EPG Daten als XML aus.
 * Die Daten werden täglich automatisch aktualisiert.
 * 
 * Query Parameter:
 * - country: Länder-Code (z.B. DE, US, GB, FR, etc.) - Standard: DE
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country') || 'DE';
    
    const xmlData = await getEpgData(countryCode);
    
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

