import { createClient } from "@/lib/supabase/server";
import {
  getEventPhase,
  getSortPriority,
  hasCoverage as hasCoverageLead,
  type EventPhase,
} from "@/lib/event-phases";

export type EventLead = {
  id: string;
  event_name: string;
  organizer_name: string;
  organizer_website: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  country: string;
  city: string | null;
  event_date: string | null;
  lead_score: number | null;
  status: string | null;
  owner: string | null;
  notes: string | null;
  priority: number | null;
  source: string;
  created_at?: string;
  event_category?: string | null;
  category_confidence?: number | null;
  category_source?: string | null;
};

export type OrganizerContact = {
  id: string;
  organizer_name: string;
  website: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  source: string;
};

export type ContactPerson = {
  id: string;
  organizer_name: string;
  full_name: string | null;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
  confidence_score: number;
  source: string;
};

export async function getDashboardStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const in90 = new Date();
  in90.setDate(in90.getDate() + 90);
  const in90Str = in90.toISOString().slice(0, 10);
  const in61 = new Date();
  in61.setDate(in61.getDate() + 61);
  const in61Str = in61.toISOString().slice(0, 10);

  // All counts from event_leads and organizer_contacts (table names are correct)
  const [eventsRes, organizersRes, eventsNoCoverageRes, upcoming90Res, prepareWindowRes] =
    await Promise.all([
      supabase.from("event_leads").select("*", { count: "exact", head: true }),
      supabase.from("organizer_contacts").select("id", { count: "exact", head: true }),
      supabase
        .from("event_leads")
        .select("*", { count: "exact", head: true })
        .or("contact_email.is.null,contact_email.eq.,linkedin_url.is.null,linkedin_url.eq."),
      supabase
        .from("event_leads")
        .select("*", { count: "exact", head: true })
        .not("event_date", "is", null)
        .gte("event_date", today)
        .lte("event_date", in90Str),
      // Events 61–90 days away (Vorbereiten) for "Brauchen Coverage" count
      supabase
        .from("event_leads")
        .select("id, contact_email, linkedin_url")
        .not("event_date", "is", null)
        .gte("event_date", in61Str)
        .lte("event_date", in90Str),
    ]);

  const withEmailRes = await supabase
    .from("organizer_contacts")
    .select("id", { count: "exact", head: true })
    .not("contact_email", "is", null);
  const withLinkedInRes = await supabase
    .from("organizer_contacts")
    .select("id", { count: "exact", head: true })
    .not("linkedin_url", "is", null);

  // Brauchen Coverage: im Vorbereiten-Fenster (61–90 Tage) ohne Kontaktdaten
  const prepareRows = prepareWindowRes.data ?? [];
  const needCoverage = prepareWindowRes.error
    ? 0
    : prepareRows.filter((r: { contact_email?: string | null; linkedin_url?: string | null }) => !hasCoverageLead(r)).length;

  return {
    totalEvents: eventsRes.error ? 0 : (eventsRes.count ?? 0),
    totalOrganizers: organizersRes.count ?? 0,
    organizersWithEmail: withEmailRes.count ?? 0,
    organizersWithLinkedIn: withLinkedInRes.count ?? 0,
    eventsWithoutCoverage: eventsNoCoverageRes.error ? 0 : (eventsNoCoverageRes.count ?? 0),
    upcoming90: upcoming90Res.error ? 0 : (upcoming90Res.count ?? 0),
    needCoverage,
  };
}

const COUNTRY_NORMALIZE: Record<string, string> = {
  CH: "CH",
  Switzerland: "CH",
  DE: "DE",
  Germany: "DE",
  AT: "AT",
  Austria: "AT",
};

export async function getEventsByCountry() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_leads")
    .select("country");
  const counts: Record<string, number> = { CH: 0, DE: 0, AT: 0, Other: 0 };
  if (!error && data) {
    data.forEach((r: { country?: string | null }) => {
      const c = (r.country || "").trim();
      const norm = COUNTRY_NORMALIZE[c] || (c ? "Other" : "");
      if (norm && norm in counts) counts[norm]++;
      else if (norm) counts["Other"]++;
    });
  }
  return Object.entries(counts).map(([country, count]) => ({ country, count }));
}

export async function getLeadCoverageStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("event_leads").select("contact_email, linkedin_url");
  let withBoth = 0;
  let withEmail = 0;
  let withLinkedIn = 0;
  let withNone = 0;
  if (!error && data) {
    data.forEach((r: { contact_email?: string | null; linkedin_url?: string | null }) => {
      const hasEmail = !!r.contact_email?.trim();
      const hasLi = !!r.linkedin_url?.trim();
      if (hasEmail && hasLi) withBoth++;
      else if (hasEmail) withEmail++;
      else if (hasLi) withLinkedIn++;
      else withNone++;
    });
  }
  return [
    { name: "Email + LinkedIn", value: withBoth, fill: "hsl(162, 65%, 45%)" },
    { name: "Email only", value: withEmail, fill: "hsl(162, 50%, 35%)" },
    { name: "LinkedIn only", value: withLinkedIn, fill: "hsl(162, 40%, 28%)" },
    { name: "No coverage", value: withNone, fill: "hsl(217, 33%, 25%)" },
  ].filter((d) => d.value > 0);
}

export async function getUpcomingTimeline(limit = 14) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: futureData } = await supabase
    .from("event_leads")
    .select("event_date")
    .not("event_date", "is", null)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(limit * 3);
  let byDate: Record<string, number> = {};
  (futureData || []).forEach((r: { event_date?: string | null }) => {
    const d = r.event_date || "";
    if (d) byDate[d] = (byDate[d] || 0) + 1;
  });
  const entries = Object.entries(byDate);
  if (entries.length === 0) {
    const { data: pastData } = await supabase
      .from("event_leads")
      .select("event_date")
      .not("event_date", "is", null)
      .order("event_date", { ascending: false })
      .limit(limit * 3);
    byDate = {};
    (pastData || []).forEach((r: { event_date?: string | null }) => {
      const d = r.event_date || "";
      if (d) byDate[d] = (byDate[d] || 0) + 1;
    });
  }
  return Object.entries(byDate)
    .slice(0, limit)
    .map(([date, count]) => ({ date, count }));
}

export async function getTopUpcomingOpportunities(limit = 10) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  let data: { id: string; event_name: string; event_date: string | null; city: string | null; organizer_name: string; contact_email: string | null; linkedin_url: string | null; lead_score: number | null }[] | null = null;
  const { data: futureData } = await supabase
    .from("event_leads")
    .select("id, event_name, event_date, city, organizer_name, contact_email, linkedin_url, lead_score")
    .not("event_date", "is", null)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .order("lead_score", { ascending: false })
    .limit(limit);
  data = futureData;
  if (!data || data.length === 0) {
    const { data: fallbackData } = await supabase
      .from("event_leads")
      .select("id, event_name, event_date, city, organizer_name, contact_email, linkedin_url, lead_score")
      .order("event_date", { ascending: false })
      .order("lead_score", { ascending: false })
      .limit(limit);
    data = fallbackData;
  }
  const orgContacts = await supabase.from("organizer_contacts").select("organizer_name, contact_email, linkedin_url");
  type OrgContact = { organizer_name: string; contact_email?: string | null; linkedin_url?: string | null };
  type OrgMapValue = { email?: string | null; linkedin?: string | null };
  const orgMap = new Map<string, OrgMapValue>(
    (orgContacts.data || []).map((o: OrgContact) => [o.organizer_name, { email: o.contact_email, linkedin: o.linkedin_url }])
  );
  return (data || []).map((e: { id: string; event_name: string; event_date: string | null; city: string | null; organizer_name: string; contact_email: string | null; linkedin_url: string | null; lead_score: number | null }) => {
    const org = orgMap.get(e.organizer_name);
    const email = e.contact_email?.trim() || org?.email?.trim() || null;
    const linkedin = e.linkedin_url?.trim() || org?.linkedin?.trim() || null;
    const contact_coverage =
      (email ? "Email" : "") + (linkedin ? " LinkedIn" : "").trim() || "None";
    return {
      id: e.id,
      event_name: e.event_name,
      event_date: e.event_date,
      city: e.city,
      organizer_name: e.organizer_name,
      contact_coverage,
      lead_score: e.lead_score,
    };
  });
}

export type EventLeadWithPhase = EventLead & {
  phase: EventPhase;
  sortPriority: number;
};

export async function getEventLeads(filters?: {
  country?: string;
  search?: string;
  status?: string;
  minScore?: number;
  category?: string;
}) {
  const supabase = await createClient();
  let q = supabase
    .from("event_leads")
    .select("*");
  if (filters?.country) q = q.eq("country", filters.country);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.minScore != null) q = q.gte("lead_score", filters.minScore);
  if (filters?.category && filters.category !== "all") q = q.eq("event_category", filters.category);
  if (filters?.search) {
    q = q.or(
      `event_name.ilike.%${filters.search}%,organizer_name.ilike.%${filters.search}%`
    );
  }
  const { data, error } = await q;
  if (error) return [];
  const leads = (data || []) as EventLead[];
  return leads.sort((a, b) => {
    const dA = a.event_date ?? "";
    const dB = b.event_date ?? "";
    return dA.localeCompare(dB);
  });
}

/** Events with phase and sortPriority, sorted by handlungsbedarf (Vorbereiten ohne Coverage zuerst, dann Aktionszone, Zu früh, Zu spät). */
export async function getEventLeadsSortedByPriority(filters?: {
  country?: string;
  search?: string;
  status?: string;
  minScore?: number;
  category?: string;
}): Promise<EventLeadWithPhase[]> {
  const leads = await getEventLeads(filters);
  const withPhase: EventLeadWithPhase[] = leads.map((lead) => {
    const phase = getEventPhase(lead.event_date);
    const covered = hasCoverageLead(lead);
    const sortPriority = getSortPriority(phase, covered);
    return { ...lead, phase, sortPriority };
  });
  withPhase.sort((a, b) => {
    if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
    const dA = a.event_date ?? "";
    const dB = b.event_date ?? "";
    return dA.localeCompare(dB);
  });
  return withPhase;
}

export async function getOrganizerContacts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizer_contacts")
    .select("*")
    .order("organizer_name");
  return (data || []) as OrganizerContact[];
}

export async function getContactPeople(filters?: {
  hasEmail?: boolean;
  hasLinkedIn?: boolean;
  minConfidence?: number;
}) {
  const supabase = await createClient();
  let q = supabase.from("contact_people").select("*").order("organizer_name");
  if (filters?.hasEmail) q = q.not("email", "is", null);
  if (filters?.hasLinkedIn) q = q.not("linkedin_url", "is", null);
  if (filters?.minConfidence != null) q = q.gte("confidence_score", filters.minConfidence);
  const { data } = await q;
  return (data || []) as ContactPerson[];
}

export type ContactRow = {
  organizer_name: string;
  website: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  contact_name: string | null;
  contact_role: string | null;
  confidence_score: number | null;
  source: string;
};

export async function getContactsCombined(filters?: {
  hasEmail?: boolean;
  hasLinkedIn?: boolean;
  minConfidence?: number;
  role?: string;
}) {
  const supabase = await createClient();
  const [orgsRes, peopleRes] = await Promise.all([
    supabase.from("organizer_contacts").select("organizer_name, website, contact_email, linkedin_url, source"),
    (() => {
      let q = supabase.from("contact_people").select("*").order("organizer_name");
      if (filters?.hasEmail) q = q.not("email", "is", null);
      if (filters?.hasLinkedIn) q = q.not("linkedin_url", "is", null);
      if (filters?.minConfidence != null) q = q.gte("confidence_score", filters.minConfidence);
      if (filters?.role) q = q.ilike("role", `%${filters.role}%`);
      return q;
    })(),
  ]);
  const orgs = (orgsRes.data || []) as { organizer_name: string; website: string | null; contact_email: string | null; linkedin_url: string | null; source: string }[];
  const people = (peopleRes.data || []) as ContactPerson[];
  const byOrg = new Map(orgs.map((o) => [o.organizer_name, o]));
  const rows: ContactRow[] = orgs.map((o) => ({
    organizer_name: o.organizer_name,
    website: o.website,
    contact_email: o.contact_email,
    linkedin_url: o.linkedin_url,
    contact_name: null,
    contact_role: null,
    confidence_score: null,
    source: o.source,
  }));
  people.forEach((p) => {
    const org = byOrg.get(p.organizer_name);
    rows.push({
      organizer_name: p.organizer_name,
      website: org?.website ?? null,
      contact_email: p.email,
      linkedin_url: p.linkedin_url,
      contact_name: p.full_name,
      contact_role: p.role,
      confidence_score: p.confidence_score,
      source: p.source,
    });
  });
  return rows;
}

/** Distinct organizer names for manual contact form (event_leads + organizer_contacts). */
export async function getOrganizerNames(): Promise<string[]> {
  const supabase = await createClient();
  const [eventsRes, orgsRes] = await Promise.all([
    supabase.from("event_leads").select("organizer_name"),
    supabase.from("organizer_contacts").select("organizer_name"),
  ]);
  const fromEvents = (eventsRes.data || []).map((r: { organizer_name: string }) => r.organizer_name);
  const fromOrgs = (orgsRes.data || []).map((r: { organizer_name: string }) => r.organizer_name);
  const set = new Set([...fromEvents, ...fromOrgs]);
  return Array.from(set).filter(Boolean).sort();
}

export async function getEventById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("event_leads").select("*").eq("id", id).single();
  return data as EventLead | null;
}

export async function getOrganizerByName(organizer_name: string) {
  const supabase = await createClient();
  const [orgRes, eventsRes] = await Promise.all([
    supabase.from("organizer_contacts").select("*").eq("organizer_name", organizer_name).single(),
    supabase.from("event_leads").select("*").eq("organizer_name", organizer_name).order("event_date"),
  ]);
  return {
    organizer: orgRes.data as OrganizerContact | null,
    events: (eventsRes.data || []) as EventLead[],
  };
}

export async function updateEventStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("event_leads").update({ status }).eq("id", id);
  return !error;
}

/** Temporary debug: raw event_leads count and sample rows (same client as dashboard). */
export async function getEventLeadsDebug() {
  const supabase = await createClient();
  const countRes = await supabase
    .from("event_leads")
    .select("*", { count: "exact", head: true });
  const sampleRes = await supabase
    .from("event_leads")
    .select("id, event_name, organizer_name, country, event_date, lead_score")
    .limit(5);
  return {
    rawCount: countRes.count ?? null,
    countError: countRes.error
      ? { message: countRes.error.message, code: countRes.error.code, details: countRes.error.details }
      : null,
    sampleRows: sampleRes.data ?? [],
    sampleError: sampleRes.error
      ? { message: sampleRes.error.message, code: sampleRes.error.code }
      : null,
  };
}
