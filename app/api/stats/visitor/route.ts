import { NextResponse } from 'next/server';
import { incrementVisitors, getStats } from '@/lib/stats-service';
import { trackVisitor } from '@/lib/analytics';

/**
 * API Route zum Inkrementieren des Besucherzählers
 * POST /api/stats/visitor
 */
export async function POST() {
  try {
    await incrementVisitors();
    const stats = await getStats();
    
    const response = NextResponse.json(
      {
        success: true,
        visitors: stats.visitors,
      },
      { status: 200 }
    );
    
    // Google Analytics Event Header für Client-Side Tracking
    response.headers.set('X-GA-Event', 'visitor');
    
    return response;
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

