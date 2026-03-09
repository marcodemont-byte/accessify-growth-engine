import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = "https://jfzuzilagynaucghdvpd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenV6aWxhZ3luYXVjZ2hkdnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDUyMDAsImV4cCI6MjA4ODQ4MTIwMH0.hQNVOf-dxxItyuO1I46__CQwQyKp961I4iGRG7sSlpU";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}