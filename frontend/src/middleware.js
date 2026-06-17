import { NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['vi', 'en'];
const defaultLocale = 'vi';

// Get the preferred locale, similar to above or using a library
function getLocale(request) {
  const negotiatorHeaders = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  let languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  if (languages.includes('*')) {
    languages = [defaultLocale];
  }

  try {
    return match(languages, locales, defaultLocale);
  } catch (e) {
    return defaultLocale;
  }
}

export function middleware(request) {
  // Check if there is any supported locale in the pathname
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    // Ignore internal requests
    if (pathname.startsWith('/_next') || pathname.startsWith('/assets') || pathname.startsWith('/favicon')) {
      return NextResponse.next();
    }

    const locale = getLocale(request);

    // e.g. incoming request is /signup
    // The new URL is now /vi/signup
    return NextResponse.redirect(
      new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
    );
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|assets|favicon|api).*)',
  ],
};
