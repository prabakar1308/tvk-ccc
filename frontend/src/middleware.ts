import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
 
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('tcc_auth_token')?.value;
  
  // Handle API proxies to attach Authorization and Language headers
  if (request.nextUrl.pathname.startsWith('/api/v1')) {
    const requestHeaders = new Headers(request.headers);
    
    // Add Accept-Language for backend localization interceptor
    const explicitLang =
      request.headers.get('x-lang') ||
      request.nextUrl.searchParams.get('lang') ||
      request.headers.get('accept-language');
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
    const finalLang = explicitLang || localeCookie || 'en';
    requestHeaders.set('Accept-Language', finalLang);
    
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
