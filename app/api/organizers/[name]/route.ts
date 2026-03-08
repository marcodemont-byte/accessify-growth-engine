import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("event_leads")
    .select("*")
    .eq("organizer_name", decodeURIComponent(name))
    .order("event_date");
  return NextResponse.json({ events: events ?? [] });
}
