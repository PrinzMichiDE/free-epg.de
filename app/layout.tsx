import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.free-epg.de'),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <link rel="apple-touch-icon" href="/apple-icon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased touch-manipulation">
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-340371068"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-340371068', {
              page_path: window.location.pathname,
            });
            
            // Track page views on client-side navigation (Next.js)
            if (typeof window !== 'undefined') {
              const originalPushState = history.pushState;
              const originalReplaceState = history.replaceState;
              
              history.pushState = function(...args) {
                originalPushState.apply(history, args);
                gtag('config', 'G-340371068', {
                  page_path: window.location.pathname + window.location.search,
                });
              };
              
              history.replaceState = function(...args) {
                originalReplaceState.apply(history, args);
                gtag('config', 'G-340371068', {
                  page_path: window.location.pathname + window.location.search,
                });
              };
              
              window.addEventListener('popstate', function() {
                gtag('config', 'G-340371068', {
                  page_path: window.location.pathname + window.location.search,
                });
              });
            }
            
            // Intercept fetch requests to track API calls
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
              const url = args[0] instanceof Request ? args[0].url : args[0];
              return originalFetch.apply(this, args).then(response => {
                // Check for GA Event headers
                const gaEvent = response.headers.get('X-GA-Event');
                const gaCountry = response.headers.get('X-GA-Country');
                
                if (gaEvent && window.gtag) {
                  if (gaEvent === 'epg_download' && gaCountry) {
                    window.gtag('event', 'epg_download', {
                      country: gaCountry,
                      user_agent: navigator.userAgent,
                      timestamp: new Date().toISOString(),
                    });
                  } else if (gaEvent === 'epg_preview' && gaCountry) {
                    window.gtag('event', 'epg_preview', {
                      country: gaCountry,
                      timestamp: new Date().toISOString(),
                    });
                  } else if (gaEvent === 'visitor') {
                    window.gtag('event', 'visitor', {
                      timestamp: new Date().toISOString(),
                    });
                  }
                }
                
                return response;
              });
            };
            }
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9024379936764895"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
