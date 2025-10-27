import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const secretM3uUrl = process.env.SECRETM3U;

  if (!secretM3uUrl) {
    return NextResponse.json(
      { error: 'SECRETM3U environment variable not set' },
      { status: 500 }
    );
  }

  try {
    // Konvertiere Dropbox-URLs zu Direct Download URLs
    let downloadUrl = secretM3uUrl;
    if (downloadUrl.includes('dropbox.com')) {
      // Ersetze www.dropbox.com mit dl.dropboxusercontent.com für direkte Downloads
      downloadUrl = downloadUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      // Stelle sicher, dass dl=1 gesetzt ist
      downloadUrl = downloadUrl.replace('dl=0', 'dl=1');
      if (!downloadUrl.includes('dl=')) {
        downloadUrl += downloadUrl.includes('?') ? '&dl=1' : '?dl=1';
      }
    }

    // Lade M3U von Dropbox
    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'EPG-Service/1.0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch M3U: ${response.statusText}`);
    }

    const m3uContent = await response.text();

    // Gebe M3U-Content mit korrekten Headers zurück
    return new NextResponse(m3uContent, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching secret M3U:', error);
    return NextResponse.json(
      { error: 'Failed to fetch M3U playlist' },
      { status: 500 }
    );
  }
}

