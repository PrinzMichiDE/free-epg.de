import { NextResponse } from 'next/server';
import { getStats, getDailyUsage, getPlayerStats } from '@/lib/stats-service';

/**
 * API Route für Statistiken
 * GET /api/stats
 * 
 * Gibt die aktuellen Besucher- und Download-Statistiken zurück.
 * Inkludiert tägliche Nutzung und Player-Statistiken.
 */
export async function GET() {
  try {
    const stats = await getStats();
    const dailyUsage = await getDailyUsage();
    const playerStats = await getPlayerStats();
    
    // Top 10 Player sortieren
    const topPlayers = Object.entries(playerStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    
    return NextResponse.json(
      {
        success: true,
        stats: {
          visitors: stats.visitors,
          downloads: stats.downloads,
          lastReset: stats.lastReset,
          dailyUsage,
          topPlayers,
          totalPlayers: Object.keys(playerStats).length,
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

