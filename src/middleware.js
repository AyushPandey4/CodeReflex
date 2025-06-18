import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the existing response headers
  const response = NextResponse.next();

  // Add security headers
  const headers = response.headers;

  // HSTS - Force HTTPS
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
    `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://cdn.jsdelivr.net https://*.monaco-editor.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
      img-src 'self' blob: data: https://*.googleusercontent.com https://cdn.jsdelivr.net;
      font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
      frame-src 'self' https://accounts.google.com;
      worker-src 'self' blob:;
      connect-src 'self' https://*.supabase.co https://openrouter.ai https://apis.google.com https://cdn.jsdelivr.net https://*.monaco-editor.net;
    `.replace(/\s+/g, ' ').trim()
  );
  
  // Permissions Policy
  headers.set(
    'Permissions-Policy',
    'camera=self, microphone=self, geolocation=(), payment=()'
  );

  return response;
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}; 