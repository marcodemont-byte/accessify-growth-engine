import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_STATUSES = [
  "new",
  "review",
  "enriched",
  "contacted",
  "follow-up",
  "meeting",
  "won",
  "lost",
];

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await _request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const status = body?.status;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Invalid or missing status" },
      { status: 400 }
    );
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_leads")
    .update({ status })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
