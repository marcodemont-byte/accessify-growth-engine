import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Same URL/key as client.ts and middleware.ts so the server can read the same
 * Supabase project. process.env can be missing or empty in some runtimes (e.g.
 * server components), which previously caused a noop client and 0 rows for all
 * dashboard queries.
 */
const supabaseUrl = "https://jfzuzilagynaucghdvpd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenV6aWxhZ3luYXVjZ2hkdnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDUyMDAsImV4cCI6MjA4ODQ4MTIwMH0.hQNVOf-dxxItyuO1I46__CQwQyKp961I4iGRG7sSlpU";

export async function createClient() {
  try {
    const cookieStore = await cookies();
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // no-op in Server Components
        },
      },
    });
  } catch {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }
}