import { NextResponse } from 'next/server';
import { incrementVisitors, getStats } from '@/lib/stats-service';

/**
 * API Route zum Inkrementieren des Besucherzählers
 * POST /api/stats/visitor
 */
export async function POST() {
  try {
    incrementVisitors();
    const stats = getStats();
    
    return NextResponse.json(
      {
        success: true,
        visitors: stats.visitors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Fehler beim Inkrementieren des Besucherzählers:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Inkrementieren',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

