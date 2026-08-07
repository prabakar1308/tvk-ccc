import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
 
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('tcc_auth_token')?.value;
  
  // Handle API proxies to attach Authorization header
  if (request.nextUrl.pathname.startsWith('/api/v1')) {
    const requestHeaders = new Headers(request.headers);
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
    return NextResponse.next({
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
