import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { classifyEventCategory } from "@/lib/event-categorization";

const SOURCE = "auto_rule";

function needsBackfill(row: {
  event_category?: string | null;
  category_source?: string | null;
}): boolean {
  const c = row.event_category;
  const src = row.category_source;
  const categoryEmptyOrUnknown =
    c == null ||
    c === "" ||
    (typeof c === "string" && c.toLowerCase() === "unknown") ||
    (typeof c === "string" && c.toLowerCase() === "unbekannt");
  const sourceNotSet = src == null || src === "";
  return categoryEmptyOrUnknown || sourceNotSet;
}

/**
 * POST /api/admin/backfill-event-categories
 *
 * Backfills event_category, category_confidence, category_source for all event_leads
 * where event_category is null, 'unknown', or 'Unbekannt'. Uses classifyEventCategory().
 *
 * Optional: x-api-key header (DISCOVERY_API_KEY) for auth.
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.DISCOVERY_API_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const { data: allRows, error: fetchError } = await supabase
      .from("event_leads")
      .select("id, event_name, organizer_name, event_url, event_category, category_confidence, category_source")
      .limit(5000);

    if (fetchError) {
      if (fetchError.message.includes("event_category") && fetchError.message.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "event_category column missing",
            hint: "Run database/migrations/004_event_category_fields.sql in Supabase SQL Editor, then call this again.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const rows = (allRows || []).filter(needsBackfill);
    let updated = 0;
    let failed = 0;

    for (const row of rows) {
      const { category, confidence } = classifyEventCategory({
        event_name: row.event_name,
        organizer_name: row.organizer_name,
        event_url: row.event_url ?? null,
      });
      const payload = {
        event_category: category,
        category_confidence: confidence,
        category_source: SOURCE,
      };
      const { data: updatedRow, error: updateError } = await supabase
        .from("event_leads")
        .update(payload)
        .eq("id", row.id)
        .select("id")
        .single();

      if (updateError) {
        failed++;
      } else if (!updatedRow) {
        failed++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      updated,
      failed,
      message: `Backfilled ${updated} rows.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
