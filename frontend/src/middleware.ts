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
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value || 'en';
    requestHeaders.set('Accept-Language', localeCookie);
    
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

  const isLoginPage = request.nextUrl.pathname.endsWith('/login');

  // Next-intl routes require token check
  if (!token && !isLoginPage && !request.nextUrl.pathname.startsWith('/api')) {
    const locale = request.nextUrl.pathname.split('/')[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (token && isLoginPage) {
    const locale = request.nextUrl.pathname.split('/')[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return intlMiddleware(request);
}
 
export const config = {
  matcher: ['/', '/(ta|en)/:path*', '/api/v1/:path*']
};
