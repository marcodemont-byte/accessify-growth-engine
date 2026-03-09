"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Building2, Loader2 } from "lucide-react";

type OrganizerEvent = {
  id: string;
  event_name: string;
  event_date: string | null;
  city: string | null;
  event_category?: string | null;
};

export function OrganizerPopover({
  organizerName,
  currentEventId,
}: {
  organizerName: string;
  currentEventId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<OrganizerEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    if (events !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/organizers/${encodeURIComponent(organizerName)}`);
      const data = res.ok ? await res.json() : { events: [] };
      const list = (data.events ?? []).map((e: { id: string; event_name: string; event_date: string | null; city: string | null; event_category?: string | null }) => ({
        id: e.id,
        event_name: e.event_name,
        event_date: e.event_date,
        city: e.city,
        event_category: e.event_category,
      }));
      setEvents(list);
    } finally {
      setLoading(false);
    }
  }, [organizerName, events]);

  const handleEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setOpen(true);
    fetchEvents();
  }, [fetchEvents]);

  const handleLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const handlePopoverEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const handlePopoverLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const organizerUrl = `/organizers/${encodeURIComponent(organizerName)}`;
  const otherCount = events ? events.length - (currentEventId && events.some((e) => e.id === currentEventId) ? 1 : 0) : null;

  return (
    <div
      className="relative inline"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href={organizerUrl}
        className="text-primary hover:underline font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        {organizerName}
        {otherCount != null && otherCount > 0 && (
          <span className="text-muted-foreground font-normal ml-1">
            ({otherCount} {otherCount === 1 ? "weiteres Event" : "weitere Events"})
          </span>
        )}
      </Link>
      {open && (
        <div
          ref={popoverRef}
          role="tooltip"
          className="absolute left-0 top-full mt-1 z-50 min-w-[280px] max-w-[360px] rounded-xl border border-border bg-card shadow-lg p-3 text-sm"
          onMouseEnter={handlePopoverEnter}
          onMouseLeave={handlePopoverLeave}
        >
          <div className="flex items-center gap-2 font-medium text-foreground mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{organizerName}</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Events laden…</span>
            </div>
          ) : events && events.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
                Events ({events.length})
              </p>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {events.map((e) => (
                  <li key={e.id} className="flex justify-between gap-2 text-muted-foreground">
                    <span className="truncate">{e.event_name}</span>
                    <span className="shrink-0">{formatDate(e.event_date)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={organizerUrl}
                className="mt-2 inline-flex items-center text-primary hover:underline text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Alle Events anzeigen →
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground text-xs">Keine weiteren Events</p>
          )}
        </div>
      )}
    </div>
  );
}
