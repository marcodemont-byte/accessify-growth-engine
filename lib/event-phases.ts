/**
 * Operative time logic for events: phases and prioritization.
 * Used for "Brauchen Coverage", event table sort, and phase badges.
 */

export type EventPhase =
  | "too_early"   // > 90 days away
  | "prepare"    // 90–61 days away
  | "active"     // 60–14 days away (Aktionszone)
  | "too_late"   // < 14 days away
  | "past";      // event date in the past

/** Event-date string YYYY-MM-DD or null. */
export function getEventPhase(eventDate: string | null): EventPhase {
  if (!eventDate?.trim()) return "too_early";
  const event = new Date(eventDate + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  event.setHours(0, 0, 0, 0);
  const daysUntil = Math.floor((event.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (daysUntil < 0) return "past";
  if (daysUntil < 14) return "too_late";
  if (daysUntil <= 60) return "active";
  if (daysUntil <= 90) return "prepare";
  return "too_early";
}

/** Lead/event has at least email or LinkedIn (same as existing coverage logic). */
export function hasCoverage(lead: {
  contact_email?: string | null;
  linkedin_url?: string | null;
}): boolean {
  const email = lead.contact_email?.trim();
  const linkedin = lead.linkedin_url?.trim();
  return !!(email || linkedin);
}

/**
 * Sort priority for table: lower = higher urgency.
 * 1 = Vorbereiten ohne Coverage, 2 = Aktionszone, 3 = Zu früh, 4 = Zu spät, 5 = Vorbei.
 */
export function getSortPriority(
  phase: EventPhase,
  hasCoverageFlag: boolean
): number {
  if (phase === "prepare" && !hasCoverageFlag) return 1;
  if (phase === "active") return 2;
  if (phase === "prepare" && hasCoverageFlag) return 3;
  if (phase === "too_early") return 4;
  if (phase === "too_late") return 5;
  return 6; // past
}

/** Human-readable phase label for UI. */
export const EVENT_PHASE_LABELS: Record<EventPhase, string> = {
  too_early: "Zu früh",
  prepare: "Vorbereiten",
  active: "Aktionszone",
  too_late: "Zu spät",
  past: "Vorbei",
};
