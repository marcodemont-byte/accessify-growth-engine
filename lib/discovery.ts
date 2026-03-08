import { getSupabase } from "@/lib/supabase";
import type {
  NormalizedDiscovery,
  LeadInsert,
  LeadEventInsert,
  DiscoveryRunResult,
} from "@/types/discovery";

/**
 * Find existing lead by organizer company name and source (and optionally email).
 * Returns lead id if found, null otherwise.
 */
async function findLeadByOrganizer(
  organizerCompany: string,
  source: string
): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("leads")
    .select("id")
    .eq("organizer_company", organizerCompany.trim())
    .eq("source", source)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/**
 * Insert a lead and return its id.
 */
async function createLead(lead: LeadInsert): Promise<string> {
  const { data, error } = await getSupabase()
    .from("leads")
    .insert({
      organizer_company: lead.organizer_company,
      organizer_website: lead.organizer_website ?? null,
      contact_email: lead.contact_email ?? null,
      contact_phone: lead.contact_phone ?? null,
      linkedin_url: lead.linkedin_url ?? null,
      source: lead.source,
      custom_metadata: lead.custom_metadata ?? {},
    })
    .select("id")
    .single();
  if (error) throw error;
  if (!data?.id) throw new Error("Lead insert returned no id");
  return data.id;
}

/**
 * Get or create lead; return lead_id.
 */
async function getOrCreateLead(lead: LeadInsert): Promise<{ leadId: string; created: boolean }> {
  const existing = await findLeadByOrganizer(lead.organizer_company, lead.source);
  if (existing) return { leadId: existing, created: false };
  const id = await createLead(lead);
  return { leadId: id, created: true };
}

/**
 * Insert lead_event. Returns true if a new row was inserted.
 * On unique violation (event_name, lead_id, event_date) we skip and return false.
 */
async function createLeadEvent(event: LeadEventInsert): Promise<boolean> {
  const { error } = await getSupabase().from("lead_events").insert({
    lead_id: event.lead_id,
    event_name: event.event_name,
    event_type: event.event_type ?? null,
    event_date: event.event_date ?? null,
    location_city: event.location_city ?? null,
    location_country: event.location_country ?? null,
    estimated_audience_size: event.estimated_audience_size ?? null,
    has_livestream: event.has_livestream ?? false,
    source: event.source,
    source_url: event.source_url ?? null,
    raw_discovery_payload: event.raw_discovery_payload ?? null,
  });
  if (error) {
    if (error.code === "23505") return false; // unique violation = duplicate
    throw error;
  }
  return true;
}

/**
 * Ingest normalized discoveries into Supabase.
 * - Creates discovery_run record at start.
 * - For each item: get or create lead, then insert lead_event (dedupe by event_name, lead_id, event_date).
 * - Updates discovery_run with counts and status.
 */
export async function ingestDiscoveries(
  source: string,
  normalized: NormalizedDiscovery[]
): Promise<DiscoveryRunResult> {
  const supabase = getSupabase();
  const runId = await createDiscoveryRun(supabase, source);

  let leadsCreated = 0;
  let eventsCreated = 0;

  try {
    for (const { lead, event } of normalized) {
      const { leadId, created } = await getOrCreateLead(lead);
      if (created) leadsCreated++;

      const inserted = await createLeadEvent({
        ...event,
        lead_id: leadId,
      });
      if (inserted) eventsCreated++;
    }

    await updateDiscoveryRun(supabase, runId, {
      status: "success",
      finished_at: new Date().toISOString(),
      leads_created: leadsCreated,
      events_created: eventsCreated,
    });

    return {
      runId,
      source,
      status: "success",
      leadsCreated,
      eventsCreated,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await updateDiscoveryRun(supabase, runId, {
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: errorMessage,
      leads_created: leadsCreated,
      events_created: eventsCreated,
    });
    return {
      runId,
      source,
      status: "failed",
      leadsCreated,
      eventsCreated,
      errorMessage,
    };
  }
}

async function createDiscoveryRun(supabase: import("@supabase/supabase-js").SupabaseClient, source: string): Promise<string> {
  const { data, error } = await supabase
    .from("discovery_runs")
    .insert({
      source,
      status: "running",
      metadata: {},
    })
    .select("id")
    .single();
  if (error) throw error;
  if (!data?.id) throw new Error("Discovery run insert returned no id");
  return data.id;
}

async function updateDiscoveryRun(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  runId: string,
  update: {
    status?: string;
    finished_at?: string;
    leads_created?: number;
    events_created?: number;
    error_message?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("discovery_runs")
    .update(update)
    .eq("id", runId);
  if (error) throw error;
}

/**
 * Store raw payloads in raw_discoveries (optional, for debugging).
 */
export async function storeRawDiscoveries(
  runId: string,
  source: string,
  payloads: Record<string, unknown>[]
): Promise<void> {
  if (payloads.length === 0) return;
  const rows = payloads.map((payload) => ({
    run_id: runId,
    source,
    payload,
  }));
  const { error } = await getSupabase().from("raw_discoveries").insert(rows);
  if (error) throw error;
}
