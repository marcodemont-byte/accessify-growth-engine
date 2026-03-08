import { getSupabase } from "@/lib/supabase";
import type { EventLeadInsert, DiscoveryRunResult } from "@/types/event-leads";
import { SAMPLE_EVENT_LEADS, SAMPLE_SOURCE } from "@/data/sample-event-leads";
import { classifyEventCategory } from "@/lib/event-categorization";

/**
 * Insert one event lead. On unique conflict (event_name, organizer_name, event_date) skip.
 * Category is set by classifyEventCategory() from event_name, organizer_name, event_url;
 * category_source is stored as "auto_rule".
 * Returns true if inserted, false if duplicate.
 */
export async function insertEventLead(row: EventLeadInsert): Promise<boolean> {
  const { category, confidence, source: categorySource } = classifyEventCategory({
    event_name: row.event_name,
    organizer_name: row.organizer_name,
    event_url: row.event_url ?? null,
  });

  const supabase = getSupabase();
  const { error } = await supabase.from("event_leads").insert({
    event_name: row.event_name,
    organizer_name: row.organizer_name,
    organizer_website: row.organizer_website ?? null,
    contact_email: row.contact_email ?? null,
    linkedin_url: row.linkedin_url ?? null,
    country: row.country,
    city: row.city ?? null,
    venue_name: row.venue_name ?? null,
    event_url: row.event_url ?? null,
    event_type: row.event_type ?? null,
    event_date: row.event_date ?? null,
    estimated_audience_size: row.estimated_audience_size ?? null,
    languages_count: row.languages_count ?? null,
    international_visitors_score: row.international_visitors_score ?? null,
    public_visibility: row.public_visibility ?? null,
    accessibility_relevance: row.accessibility_relevance ?? null,
    lead_score: row.lead_score ?? null,
    source: row.source,
    event_category: row.event_category ?? category,
    category_confidence: row.category_confidence ?? confidence,
    category_source: row.category_source ?? categorySource,
  });
  if (error) {
    if (error.code === "23505") return false; // unique violation
    throw error;
  }
  return true;
}

/**
 * Ingest sample DACH event leads into event_leads table.
 * Uses mock data only (DACH). Creates a discovery_run log entry.
 */
export async function ingestSampleEventLeads(): Promise<DiscoveryRunResult> {
  const supabase = getSupabase();

  const runId = await (async () => {
    const { data, error } = await supabase
      .from("discovery_runs")
      .insert({
        source: SAMPLE_SOURCE,
        status: "running",
        metadata: { mode: "mock" },
      })
      .select("id")
      .single();
    if (error) throw error;
    if (!data?.id) throw new Error("discovery_runs insert returned no id");
    return data.id;
  })();

  let recordsCreated = 0;

  try {
    for (const row of SAMPLE_EVENT_LEADS) {
      const inserted = await insertEventLead(row);
      if (inserted) recordsCreated++;
    }

    await supabase
      .from("discovery_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        records_created: recordsCreated,
      })
      .eq("id", runId);

    return {
      runId,
      source: SAMPLE_SOURCE,
      status: "success",
      recordsCreated,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await supabase
      .from("discovery_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: errorMessage,
        records_created: recordsCreated,
      })
      .eq("id", runId);
    return {
      runId,
      source: SAMPLE_SOURCE,
      status: "failed",
      recordsCreated,
      errorMessage,
    };
  }
}
