/**
 * Google Analytics 4 Event Tracking Utility
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Sendet ein Custom Event an Google Analytics 4
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    [key: string]: string | number | boolean | null | undefined;
  }
): void {
  if (typeof window === 'undefined') return;
  
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    // Fallback: Push to dataLayer wenn gtag noch nicht geladen
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
}

/**
 * Trackt EPG Download Event
 */
export function trackEpgDownload(country: string, userAgent?: string | null): void {
  trackEvent('epg_download', {
    country,
    user_agent: userAgent || 'unknown',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trackt EPG Preview Event
 */
export function trackEpgPreview(country: string): void {
  trackEvent('epg_preview', {
    country,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trackt Visitor Event
 */
export function trackVisitor(): void {
  trackEvent('visitor', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trackt API Error Event
 */
export function trackApiError(endpoint: string, status: number, error?: string): void {
  trackEvent('api_error', {
    endpoint,
    status_code: status,
    error_message: error || 'unknown',
    timestamp: new Date().toISOString(),
  });
}
