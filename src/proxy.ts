import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['en', 'fr'];
const DEFAULT_LOCALE = 'en';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Check if pathname starts with a supported locale
  const pathnameHasLocale = LOCALES.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Always default to English ('en') when no locale is specified in the URL
  const targetLocale = DEFAULT_LOCALE;

  // Redirect to localized URL (e.g. / -> /en, /articles -> /en/articles)
  const newPathname = pathname === '/' ? `/${targetLocale}` : `/${targetLocale}${pathname}`;
  const redirectUrl = new URL(`${newPathname}${search}`, request.url);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    // Skip internal Next.js paths, api routes, and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
