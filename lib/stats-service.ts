/**
 * Statistics Service für Besucher- und Download-Counter
 * Mit täglicher Nutzung und Player-Erkennung
 * Verwendet In-Memory-Speicherung
 */

interface Stats {
  visitors: number;
  downloads: number;
  lastReset: number;
}

interface DailyUsage {
  date: string; // YYYY-MM-DD
  downloads: number;
  uniqueIPs: string[];
}

interface PlayerStats {
  [playerName: string]: number;
}

// Startwerte für Counter
const INITIAL_VISITORS = 224232;
const INITIAL_DOWNLOADS = 12231082;

// In-Memory Stats
let stats: Stats = {
  visitors: INITIAL_VISITORS,
  downloads: INITIAL_DOWNLOADS,
  lastReset: Date.now(),
};

// Tägliche Nutzung (pro Datum)
const dailyUsage: Map<string, DailyUsage> = new Map();

// Player-Statistiken
const playerStats: PlayerStats = {};

/**
 * Erkennt den Player aus dem User-Agent String
 */
export function detectPlayer(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  // Bekannte IPTV-Apps erkennen
  if (ua.includes('tivimate')) return 'TiviMate';
  if (ua.includes('iptv') && ua.includes('smarters')) return 'IPTV Smarters Pro';
  if (ua.includes('perfect') && ua.includes('player')) return 'Perfect Player';
  if (ua.includes('kodi')) return 'Kodi';
  if (ua.includes('vlc')) return 'VLC';
  if (ua.includes('mx player')) return 'MX Player';
  if (ua.includes('exo')) return 'ExoPlayer';
  if (ua.includes('ffmpeg')) return 'FFmpeg';
  if (ua.includes('mpv')) return 'MPV';
  if (ua.includes('iina')) return 'IINA';
  if (ua.includes('plex')) return 'Plex';
  if (ua.includes('jellyfin')) return 'Jellyfin';
  if (ua.includes('emby')) return 'Emby';
  if (ua.includes('smart') && ua.includes('iptv')) return 'Smart IPTV';
  if (ua.includes('ss') && ua.includes('iptv')) return 'SS IPTV';
  if (ua.includes('gse')) return 'GSE Smart IPTV';
  if (ua.includes('ott')) return 'OTT Navigator';
  if (ua.includes('xmtv')) return 'XM TV';
  if (ua.includes('iptv') && ua.includes('extreme')) return 'IPTV Extreme';
  
  // Browser erkennen
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  
  // Mobile Apps
  if (ua.includes('android')) return 'Android App';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS App';
  
  // Fallback
  if (ua.includes('curl')) return 'cURL';
  if (ua.includes('wget')) return 'Wget';
  if (ua.includes('python')) return 'Python';
  if (ua.includes('node')) return 'Node.js';
  
  return 'Other';
}

/**
 * Gibt das aktuelle Datum im Format YYYY-MM-DD zurück
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Inkrementiert den Besucherzähler
 */
export async function incrementVisitors(): Promise<void> {
  stats.visitors++;
}

/**
 * Inkrementiert den Download-Zähler mit Player-Erkennung
 */
export async function incrementDownloads(userAgent?: string | null, ip?: string | null): Promise<void> {
  stats.downloads++;
  
  // Player erkennen und zählen
  const player = detectPlayer(userAgent || null);
  playerStats[player] = (playerStats[player] || 0) + 1;
  
  // Tägliche Nutzung tracken
  const todayKey = getTodayKey();
  const todayUsage = dailyUsage.get(todayKey) || {
    date: todayKey,
    downloads: 0,
    uniqueIPs: [],
  };
  
  todayUsage.downloads++;
  if (ip && !todayUsage.uniqueIPs.includes(ip)) {
    todayUsage.uniqueIPs.push(ip);
  }
  
  dailyUsage.set(todayKey, todayUsage);
  
  // Alte Einträge bereinigen (älter als 30 Tage)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const [dateKey] of dailyUsage) {
    const date = new Date(dateKey);
    if (date < thirtyDaysAgo) {
      dailyUsage.delete(dateKey);
    }
  }
}

/**
 * Gibt die aktuellen Statistiken zurück
 */
export async function getStats(): Promise<Stats> {
  return { ...stats };
}

/**
 * Gibt die tägliche Nutzung zurück (letzte 7 Tage)
 */
export async function getDailyUsage(): Promise<Array<{ date: string; downloads: number; uniqueIPs: number }>> {
  const result: Array<{ date: string; downloads: number; uniqueIPs: number }> = [];
  const today = new Date();
  
  // Letzte 7 Tage
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const usage = dailyUsage.get(dateKey);
    
    if (usage && usage.downloads > 0) {
      result.push({
        date: dateKey,
        downloads: usage.downloads,
        uniqueIPs: usage.uniqueIPs.length,
      });
    } else {
      // Fallback: 0 wenn keine Daten vorhanden
      result.push({
        date: dateKey,
        downloads: 0,
        uniqueIPs: 0,
      });
    }
  }
  
  return result;
}

/**
 * Gibt die Player-Statistiken zurück
 */
export async function getPlayerStats(): Promise<PlayerStats> {
  // Wenn keine Daten vorhanden, gib leeres Objekt zurück
  if (Object.keys(playerStats).length === 0) {
    return {};
  }
  
  return { ...playerStats };
}

/**
 * Setzt die Statistiken zurück (behält aber die Basiswerte)
 */
export async function resetStats(): Promise<void> {
  stats = {
    visitors: INITIAL_VISITORS,
    downloads: INITIAL_DOWNLOADS,
    lastReset: Date.now(),
  };
  dailyUsage.clear();
  Object.keys(playerStats).forEach(key => delete playerStats[key]);
}
