import { createBrowserClient } from "@supabase/ssr";

/**
 * Hardcoded so the client bundle never depends on process.env at runtime.
 * NEXT_PUBLIC_* are inlined at build time; if build runs without env, the client
 * would get undefined and Supabase would throw. This file must not use process.env.
 */
const supabaseUrl = "https://jfzuzilagynaucghdvpd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenV6aWxhZ3luYXVjZ2hkdnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDUyMDAsImV4cCI6MjA4ODQ4MTIwMH0.hQNVOf-dxxItyuO1I46__CQwQyKp961I4iGRG7sSlpU";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}