import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_leads")
    .select("*")
    .order("event_date", { ascending: true });
  return NextResponse.json({ events: data ?? [] });
}
