/**
 * Statistics Service für Besucher- und Download-Counter
 */

interface Stats {
  visitors: number;
  downloads: number;
  lastReset: number;
}

// Startwerte für Counter
const INITIAL_VISITORS = 224232;
const INITIAL_DOWNLOADS = 12231082;

// In-Memory Stats (auf Vercel wird dies pro Serverless Function Instance sein)
let stats: Stats = {
  visitors: INITIAL_VISITORS,
  downloads: INITIAL_DOWNLOADS,
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
 * Setzt die Statistiken zurück (behält aber die Basiswerte)
 */
export function resetStats(): void {
  stats = {
    visitors: INITIAL_VISITORS,
    downloads: INITIAL_DOWNLOADS,
    lastReset: Date.now(),
  };
}

