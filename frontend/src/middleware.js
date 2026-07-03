import { NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['vi', 'en'];
const defaultLocale = 'vi';
const homeTabRoutes = ['gallery', 'rules', 'wiki', 'donate', 'profile'];
const discordInviteUrl = 'https://discord.com/invite/znHfuc6hCR';

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
  const normalizedPathname = pathname.replace(/\/$/, '') || '/';
  const sectionWithLocale = normalizedPathname.match(/^\/(gallery|rules|wiki|donate|profile|discord)\/(vi|en)$/);
  const sectionWithoutLocale = normalizedPathname.match(/^\/(gallery|rules|wiki|donate|profile|discord)$/);

  if (sectionWithLocale) {
    const [, section, locale] = sectionWithLocale;

    if (section === 'discord') {
      return NextResponse.redirect(discordInviteUrl);
    }

    const url = request.nextUrl.clone();
    if (homeTabRoutes.includes(section)) {
      url.pathname = `/${locale}`;
      url.searchParams.set('tab', section);
    } else {
      url.pathname = `/${locale}/${section}`;
    }

    return NextResponse.rewrite(url);
  }

  if (sectionWithoutLocale) {
    const [, section] = sectionWithoutLocale;
    if (section === 'discord') {
      return NextResponse.redirect(discordInviteUrl);
    }

    const locale = getLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${section}/${locale}`;
    return NextResponse.redirect(url);
  }

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
