import { NextResponse } from "next/server";
import { ingestSampleEventLeads } from "@/lib/event-leads";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/discovery/run
 *
 * Runs DACH lead discovery. By default uses MOCK/SAMPLE data (no Apify).
 * Writes clean sample event leads into Supabase event_leads table.
 *
 * Query params:
 * - mock=true (default) — use sample DACH data only
 * - mock=false — future: run live Apify scraper (requires APIFY_API_TOKEN)
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.DISCOVERY_API_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const useMock = url.searchParams.get("mock") !== "false" || process.env.USE_MOCK_DISCOVERY === "true";

  if (useMock) {
    try {
      const result = await ingestSampleEventLeads();
      return NextResponse.json({
        ok: result.status === "success",
        runId: result.runId,
        source: result.source,
        status: result.status,
        recordsCreated: result.recordsCreated,
        errorMessage: result.errorMessage,
        mode: "mock",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[discovery/run]", message);
      return NextResponse.json(
        { error: "Mock discovery failed", detail: message },
        { status: 500 }
      );
    }
  }

  // Live scraping: not enabled in v1; require Apify
  if (!process.env.APIFY_API_TOKEN) {
    return NextResponse.json(
      { error: "Live discovery requires APIFY_API_TOKEN. Use ?mock=true for sample data." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "Live discovery not implemented in v1. Use ?mock=true." },
    { status: 501 }
  );
}

/**
 * GET /api/discovery/run
 *
 * Returns recent discovery runs. Optional: ?limit=10
 */
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.DISCOVERY_API_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 50);

    const { data, error } = await supabase
      .from("discovery_runs")
      .select("id, source, status, started_at, finished_at, records_created, error_message")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ runs: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to list runs", detail: message },
      { status: 500 }
    );
  }
}
