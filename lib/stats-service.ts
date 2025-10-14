/**
 * Statistics Service für Besucher- und Download-Counter
 */

interface Stats {
  visitors: number;
  downloads: number;
  lastReset: number;
}

// In-Memory Stats (auf Vercel wird dies pro Serverless Function Instance sein)
let stats: Stats = {
  visitors: 0,
  downloads: 0,
  lastReset: Date.now(),
};

/**
 * Inkrementiert den Besucherzähler
 */
export function incrementVisitors(): void {
  stats.visitors++;
}

/**
 * Inkrementiert den Download-Zähler
 */
export function incrementDownloads(): void {
  stats.downloads++;
}

/**
 * Gibt die aktuellen Statistiken zurück
 */
export function getStats(): Stats {
  return { ...stats };
}

/**
 * Setzt die Statistiken zurück
 */
export function resetStats(): void {
  stats = {
    visitors: 0,
    downloads: 0,
    lastReset: Date.now(),
  };
}

