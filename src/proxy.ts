import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { locales, defaultLocale, type Locale } from "@/navigation";

// Conditional Edge Rate Limiter utilizing Upstash Redis
let ratelimit: any = null;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  try {
    const { Redis } = require("@upstash/redis");
    const { Ratelimit } = require("@upstash/ratelimit");

    const redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    ratelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
    console.log("[Rate Limiter] Berhasil menginisialisasi Upstash Redis Rate Limiter.");
  } catch (error) {
    console.error("[Rate Limiter] Gagal menginisialisasi Upstash Redis Client:", error);
  }
} else {
  console.log("[Rate Limiter] UPSTASH_REDIS_REST_URL atau TOKEN kosong. Rate limiting dinonaktifkan (Bypass).");
}

function detectLocale(request: NextRequest): Locale {
  // 1. Check cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  // 2. Check Accept-Language header
  const acceptLang = request.headers.get("Accept-Language") || "";
  for (const loc of locales) {
    if (acceptLang.toLowerCase().includes(loc)) {
      return loc;
    }
  }

  // 3. Fallback to default
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale handling for static files, images, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.includes(".") // static files
  ) {
    return handleAuth(request);
  }

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale: string) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return handleAuth(request);
  }

  // Redirect: add locale prefix
  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

async function handleAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Apply rate limit on sensitive endpoints
  if (pathname.startsWith("/api/inngest") || pathname.startsWith("/api/chat") || request.method === "POST") {
    if (ratelimit) {
      try {
        const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
        const { success, limit, reset, remaining } = await ratelimit.limit(ip);

        if (!success) {
          console.warn(`[Rate Limiter] Blocked IP: ${ip} on path: ${pathname}`);
          return new NextResponse(
            JSON.stringify({
              error: "Too Many Requests. Please try again later.",
              limit,
              remaining,
              reset,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
              },
            }
          );
        }
      } catch (err: any) {
        console.error("[Rate Limiter] Error evaluating rate limit, bypassing:", err.message);
      }
    }
  }

  // 2. Supabase session & auth redirection
  const response = await updateSession(request);

  let user = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              // Read-only context
            },
          },
        }
      );
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    } catch (error) {
      console.error("Supabase proxy error:", error);
    }
  }

  // Extract locale from pathname
  const localeFromPath = locales.find(
    (loc: string) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  );
  const locale = localeFromPath || defaultLocale;

  // Protect dashboard routes
  if (pathname.startsWith(`/${locale}/dashboard`)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith(`/${locale}/login`) || pathname.startsWith(`/${locale}/register`)) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
