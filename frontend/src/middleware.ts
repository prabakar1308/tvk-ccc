import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
 
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('tcc_auth_token')?.value;
  
  // Handle API proxies to attach Authorization and Language headers
  if (request.nextUrl.pathname.startsWith('/api/v1')) {
    const requestHeaders = new Headers(request.headers);
    
    // Add Accept-Language for backend localization interceptor:
    // Prioritize explicit lang param/header, then referer path locale (/ta/...), then user session locale cookie, then browser accept-language
    const referer = request.headers.get('referer');
    let refererLang: string | null = null;
    if (referer) {
      try {
        const refUrl = new URL(referer);
        const refSeg = refUrl.pathname.split('/').filter(Boolean)[0];
        if (refSeg === 'ta' || refSeg === 'en') {
          refererLang = refSeg;
        }
      } catch {}
    }

    const explicitLang =
      request.headers.get('x-lang') ||
      request.nextUrl.searchParams.get('lang');
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
    const browserLang = request.headers.get('accept-language');
    const finalLang = explicitLang || refererLang || localeCookie || browserLang || 'en';
    requestHeaders.set('Accept-Language', finalLang);
    requestHeaders.set('x-lang', finalLang);
    
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
    
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const rewriteUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, backendUrl);
    
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  const hasLocale = routing.locales.includes(firstSegment as any);
  const locale = hasLocale ? firstSegment : (request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale);
  const pathWithoutLocale = hasLocale 
    ? '/' + segments.slice(1).join('/')
    : request.nextUrl.pathname;

  const isLoginPage = pathWithoutLocale === '/login' || request.nextUrl.pathname.endsWith('/login');

  // Next-intl routes require token check
  if (!token && !isLoginPage && !request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return intlMiddleware(request);
}
 
export const config = {
  matcher: ['/((?!api/auth|_next|_vercel|.*\\..*).*)', '/api/v1/:path*']
};
