import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLanguage } from './lib/i18n';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Prüfe ob bereits ein Locale im Pfad ist
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Erkenne Sprache aus Accept-Language Header oder Cookie
  const locale = getLocale(request) || defaultLanguage;
  
  // Redirect zu /locale/pathname
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

function getLocale(request: NextRequest): string | null {
  // Prüfe Cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale;
  }

  // Prüfe Accept-Language Header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    for (const locale of locales) {
      if (acceptLanguage.includes(locale)) {
        return locale;
      }
    }
  }

  return null;
}

export const config = {
  matcher: [
    // Alle Pfade außer:
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js|apple-icon|icon).*)',
  ],
};
