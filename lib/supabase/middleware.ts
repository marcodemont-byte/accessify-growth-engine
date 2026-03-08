import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Use same credentials as client.ts so middleware always has valid config and
 * can read the session cookie. process.env in Edge can be missing at runtime.
 */
const supabaseUrl = "https://jfzuzilagynaucghdvpd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenV6aWxhZ3luYXVjZ2hkdnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDUyMDAsImV4cCI6MjA4ODQ4MTIwMH0.hQNVOf-dxxItyuO1I46__CQwQyKp961I4iGRG7sSlpU";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = request.nextUrl.pathname === "/login";

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    const setCookies = response.headers.getSetCookie?.() ?? [];
    setCookies.forEach((c) => redirectResponse.headers.append("set-cookie", c));
    return redirectResponse;
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirectResponse = NextResponse.redirect(url);
    const setCookies = response.headers.getSetCookie?.() ?? [];
    setCookies.forEach((c) => redirectResponse.headers.append("set-cookie", c));
    return redirectResponse;
  }

  return response;
}